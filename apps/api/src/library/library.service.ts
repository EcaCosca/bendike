import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  LIBRARY_MAX_BYTES,
  LIBRARY_PAGE_SIZE,
  Role,
  isHttpsUrl,
  paginate,
  type LibraryDocumentKind,
  type LibraryDocumentView,
  type LibraryListResponse,
} from '@bendike/shared';
import { IsNull, type EntityManager } from 'typeorm';
import { GearModel } from '../gear/entities/gear-model.entity';
import { DOCUMENT_STORAGE, StorageError, type DocumentStorage } from '../storage/document-storage';
import type { User } from '../users/user.entity';
import { LibraryDocument } from './library-document.entity';
import type { UploadedDocument } from './uploaded-document';

export interface AddDocumentFields {
  title: string;
  kind: LibraryDocumentKind;
  manufacturer?: string | undefined;
  modelId?: string | undefined;
  revision?: string | undefined;
  language?: string | undefined;
  sourceUrl?: string | undefined;
}

export interface ListDocumentsQuery {
  kind?: LibraryDocumentKind | undefined;
  search?: string | undefined;
  modelId?: string | undefined;
  includeArchived?: boolean | undefined;
  page?: number | undefined;
}

const PDF_SIGNATURE = '%PDF-';

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function byRevisionThenNewest(a: LibraryDocument, b: LibraryDocument): number {
  if (a.revision !== b.revision) {
    if (a.revision === null) return 1;
    if (b.revision === null) return -1;
    const order = b.revision.localeCompare(a.revision, 'en', { numeric: true, sensitivity: 'base' });
    if (order !== 0) return order;
  }
  return b.createdAt.getTime() - a.createdAt.getTime();
}

@Injectable()
export class LibraryService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
  ) {}

  async add(actor: User, file: UploadedDocument | undefined, fields: AddDocumentFields): Promise<LibraryDocumentView> {
    if (!file) {
      throw new BadRequestException('Choose a PDF file');
    }
    if (file.size > LIBRARY_MAX_BYTES || file.buffer.length > LIBRARY_MAX_BYTES) {
      throw new BadRequestException('The file is over the 25 MB limit');
    }
    if (file.buffer.subarray(0, PDF_SIGNATURE.length).toString('latin1') !== PDF_SIGNATURE) {
      throw new BadRequestException('Only PDF files can be added to the Library');
    }
    const sourceUrl = blankToNull(fields.sourceUrl);
    if (sourceUrl !== null && !isHttpsUrl(sourceUrl)) {
      throw new BadRequestException('The source link must start with https://');
    }
    const model = fields.modelId ? await this.manager.findOne(GearModel, { where: { id: fields.modelId } }) : null;
    if (fields.modelId && !model) {
      throw new BadRequestException('That model is not in the catalogue');
    }
    const manufacturer = blankToNull(fields.manufacturer) ?? model?.manufacturer ?? null;
    if (manufacturer === null) {
      throw new BadRequestException('Say which manufacturer the document is from');
    }

    const sha256 = createHash('sha256').update(file.buffer).digest('hex');
    const duplicate = await this.manager.findOne(LibraryDocument, { where: { sha256 } });
    if (duplicate) {
      throw new ConflictException(`This file is already in the Library as "${duplicate.title}"`);
    }

    const { storageKey } = await this.storage
      .put({ fileName: basename(file.originalname), mimeType: 'application/pdf', bytes: file.buffer })
      .catch((error: unknown) => {
        throw this.storageFailure(error);
      });

    const saved = await this.manager.save(
      this.manager.create(LibraryDocument, {
        title: fields.title.trim(),
        kind: fields.kind,
        manufacturer,
        modelId: model?.id ?? null,
        revision: blankToNull(fields.revision),
        language: blankToNull(fields.language),
        sourceUrl,
        fileName: basename(file.originalname).slice(0, 200),
        mimeType: 'application/pdf',
        sizeBytes: file.buffer.length,
        sha256,
        storageKey,
        addedById: actor.id,
        addedByName: actor.displayName,
        archivedAt: null,
        archivedById: null,
        archiveReason: null,
      }),
    );
    return this.toView(saved, model ? [model] : []);
  }

  async list(actor: User, query: ListDocumentsQuery): Promise<LibraryListResponse> {
    const includeArchived = query.includeArchived === true && actor.role === Role.Admin;
    let documents = await this.manager.find(LibraryDocument, {
      ...(includeArchived ? {} : { where: { archivedAt: IsNull() } }),
    });
    const models = await this.manager.find(GearModel);
    const modelName = (id: string | null) => models.find((m) => m.id === id)?.model ?? '';
    const needle = query.search?.trim().toLowerCase();
    documents = documents.filter((doc) => {
      if (query.kind && doc.kind !== query.kind) return false;
      if (query.modelId && doc.modelId !== query.modelId) return false;
      return needle
        ? [doc.title, doc.manufacturer, modelName(doc.modelId)].some((part) => part.toLowerCase().includes(needle))
        : true;
    });
    documents.sort(query.modelId ? byRevisionThenNewest : (a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const { page, total } = paginate(documents, query.page ?? 1, LIBRARY_PAGE_SIZE);
    return { documents: page.map((doc) => this.toView(doc, models)), total };
  }

  async forModel(modelId: string): Promise<LibraryDocumentView[]> {
    return (await this.list({ role: Role.Rigger } as User, { modelId, page: 1 })).documents;
  }

  async download(actor: User, id: string): Promise<{ bytes: Buffer; fileName: string; mimeType: string }> {
    const doc = await this.find(id);
    if (doc.archivedAt !== null && actor.role !== Role.Admin) {
      throw new NotFoundException('Document not found');
    }
    const bytes = await this.storage.get(doc.storageKey).catch((error: unknown) => {
      throw this.storageFailure(error);
    });
    return { bytes, fileName: doc.fileName, mimeType: doc.mimeType };
  }

  async archive(actor: User, id: string, reason: string): Promise<LibraryDocumentView> {
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new BadRequestException('Say why the document is archived');
    }
    const doc = await this.find(id);
    if (doc.archivedAt !== null) {
      throw new ConflictException('The document is already archived');
    }
    doc.archivedAt = new Date();
    doc.archivedById = actor.id;
    doc.archiveReason = trimmed;
    const saved = await this.manager.save(doc);
    return this.toView(saved, await this.manager.find(GearModel));
  }

  private async find(id: string): Promise<LibraryDocument> {
    const doc = await this.manager.findOne(LibraryDocument, { where: { id } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  private storageFailure(error: unknown): Error {
    return error instanceof StorageError
      ? new BadGatewayException('The document storage is not reachable, try again shortly')
      : (error as Error);
  }

  private toView(doc: LibraryDocument, models: GearModel[]): LibraryDocumentView {
    return {
      id: doc.id,
      title: doc.title,
      kind: doc.kind,
      manufacturer: doc.manufacturer,
      modelId: doc.modelId,
      modelName: models.find((m) => m.id === doc.modelId)?.model ?? null,
      revision: doc.revision,
      language: doc.language,
      sourceUrl: doc.sourceUrl,
      fileName: doc.fileName,
      sizeBytes: doc.sizeBytes,
      addedByName: doc.addedByName,
      createdAt: doc.createdAt.toISOString(),
      archivedAt: doc.archivedAt?.toISOString() ?? null,
      archiveReason: doc.archiveReason,
    };
  }
}
