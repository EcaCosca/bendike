import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { RIG_PHOTO_MAX_BYTES, RIG_PHOTO_MAX_PER_RIG, type RigCovers, type RigPhotoView } from '@bendike/shared';
import { IsNull, type EntityManager } from 'typeorm';
import { GearItem } from '../gear/entities/gear-item.entity';
import { MaintenanceEntry } from '../gear/entities/maintenance-entry.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearAccessService } from '../gear/gear-access.service';
import { DOCUMENT_STORAGE, StorageError, type DocumentStorage } from '../storage/document-storage';
import { detectImageType, type ImageType } from '../uploads/image-type';
import type { User } from '../users/user.entity';
import { RigPhoto } from './rig-photo.entity';
import type { UploadedPhoto } from './uploaded-photo';

const MIME: Record<ImageType, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const EXTENSION: Record<ImageType, string> = { jpeg: 'jpg', png: 'png', webp: 'webp' };

function newestFirst(a: RigPhoto, b: RigPhoto): number {
  return b.createdAt.getTime() - a.createdAt.getTime();
}

function toView(photo: RigPhoto): RigPhotoView {
  return {
    id: photo.id,
    rigId: photo.rigId,
    entryId: photo.entryId,
    fileName: photo.fileName,
    sizeBytes: photo.sizeBytes,
    caption: photo.caption,
    addedById: photo.addedById,
    addedByName: photo.addedByName,
    createdAt: photo.createdAt.toISOString(),
  };
}

@Injectable()
export class RigPhotosService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly access: GearAccessService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
  ) {}

  async add(
    actor: User,
    rigId: string,
    file: UploadedPhoto | undefined,
    fields: { caption?: string | undefined; entryId?: string | undefined },
  ): Promise<RigPhotoView> {
    const rig = await this.loadRig(rigId);
    await this.access.assertRead(actor, rig.ownerId);
    if (!file) {
      throw new BadRequestException('Choose a photo');
    }
    if (file.size > RIG_PHOTO_MAX_BYTES || file.buffer.length > RIG_PHOTO_MAX_BYTES) {
      throw new BadRequestException('The photo is over the 8 MB limit');
    }
    const type = detectImageType(file.buffer);
    if (!type) {
      throw new BadRequestException('Only JPEG, PNG or WebP photos can be added');
    }
    const existing = await this.manager.find(RigPhoto, { where: { rigId, removedAt: IsNull() } });
    if (existing.length >= RIG_PHOTO_MAX_PER_RIG) {
      throw new ConflictException(`A rig can hold ${RIG_PHOTO_MAX_PER_RIG} photos; remove one first`);
    }
    if (fields.entryId) {
      await this.assertEntryOnRig(fields.entryId, rigId);
    }

    const { storageKey } = await this.storage
      .put({ fileName: `rig-${rigId}-${randomUUID()}.${EXTENSION[type]}`, mimeType: MIME[type], bytes: file.buffer })
      .catch((error: unknown) => {
        throw this.storageFailure(error);
      });
    const saved = await this.manager.save(
      this.manager.create(RigPhoto, {
        rigId,
        entryId: fields.entryId ?? null,
        storageKey,
        fileName: basename(file.originalname).slice(0, 200),
        mimeType: MIME[type],
        sizeBytes: file.buffer.length,
        caption: (fields.caption ?? '').trim().slice(0, 300),
        addedById: actor.id,
        addedByName: actor.displayName,
        removedAt: null,
        removedById: null,
      }),
    );
    return toView(saved);
  }

  async list(actor: User, rigId: string): Promise<RigPhotoView[]> {
    const rig = await this.loadRig(rigId);
    await this.access.assertRead(actor, rig.ownerId);
    const photos = await this.manager.find(RigPhoto, { where: { rigId, removedAt: IsNull() } });
    return photos.sort(newestFirst).map(toView);
  }

  async covers(actor: User, ownerId: string): Promise<RigCovers> {
    await this.access.assertRead(actor, ownerId);
    const rigs = await this.manager.find(Rig, { where: { ownerId } });
    const covers: RigCovers = {};
    for (const rig of rigs) {
      const [newest] = (await this.manager.find(RigPhoto, { where: { rigId: rig.id, removedAt: IsNull() } })).sort(
        newestFirst,
      );
      if (newest) covers[rig.id] = newest.id;
    }
    return covers;
  }

  async file(actor: User, photoId: string): Promise<{ bytes: Buffer; mimeType: string; fileName: string }> {
    const photo = await this.loadPhoto(photoId);
    const rig = await this.loadRig(photo.rigId);
    await this.access.assertRead(actor, rig.ownerId);
    const bytes = await this.storage.get(photo.storageKey).catch((error: unknown) => {
      throw this.storageFailure(error);
    });
    return { bytes, mimeType: photo.mimeType, fileName: photo.fileName };
  }

  async remove(actor: User, photoId: string): Promise<void> {
    const photo = await this.loadPhoto(photoId);
    const rig = await this.loadRig(photo.rigId);
    await this.access.assertRead(actor, rig.ownerId);
    if (actor.id !== photo.addedById && !(await this.access.canEdit(actor, rig.ownerId))) {
      throw new ForbiddenException('Only the person who added the photo, the owner or an admin can remove it');
    }
    photo.removedAt = new Date();
    photo.removedById = actor.id;
    await this.manager.save(photo);
  }

  private async loadRig(rigId: string): Promise<Rig> {
    const rig = await this.manager.findOne(Rig, { where: { id: rigId } });
    if (!rig) {
      throw new NotFoundException('Rig not found');
    }
    return rig;
  }

  private async loadPhoto(photoId: string): Promise<RigPhoto> {
    const photo = await this.manager.findOne(RigPhoto, { where: { id: photoId, removedAt: IsNull() } });
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }
    return photo;
  }

  private async assertEntryOnRig(entryId: string, rigId: string): Promise<void> {
    const entry = await this.manager.findOne(MaintenanceEntry, { where: { id: entryId } });
    const item = entry ? await this.manager.findOne(GearItem, { where: { id: entry.gearItemId } }) : null;
    if (!item || item.rigId !== rigId) {
      throw new BadRequestException('That work is not on this rig');
    }
  }

  private storageFailure(error: unknown): Error {
    return error instanceof StorageError
      ? new BadGatewayException('The photo storage is not reachable, try again shortly')
      : (error as Error);
  }
}
