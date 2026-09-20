import { BadGatewayException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Role, LIBRARY_MAX_BYTES } from '@bendike/shared';
import { GearModel } from '../gear/entities/gear-model.entity';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { StorageError, type DocumentStorage } from '../storage/document-storage';
import { buildUser } from '../users/user.factory';
import { LibraryService } from './library.service';
import type { UploadedDocument } from './uploaded-document';

function pdf(text = 'manual'): UploadedDocument {
  const buffer = Buffer.from(`%PDF-1.7 ${text}`);
  return { originalname: `${text}.pdf`, mimetype: 'application/pdf', size: buffer.length, buffer };
}

class FakeStorage implements DocumentStorage {
  readonly files = new Map<string, Buffer>();
  failWith: Error | null = null;
  put({ bytes }: { bytes: Buffer }): Promise<{ storageKey: string }> {
    if (this.failWith) return Promise.reject(this.failWith);
    const storageKey = `key-${this.files.size + 1}`;
    this.files.set(storageKey, bytes);
    return Promise.resolve({ storageKey });
  }
  get(storageKey: string): Promise<Buffer> {
    if (this.failWith) return Promise.reject(this.failWith);
    const bytes = this.files.get(storageKey);
    return bytes ? Promise.resolve(bytes) : Promise.reject(new StorageError('missing'));
  }
}

describe('LibraryService', () => {
  let manager: InMemoryManager;
  let storage: FakeStorage;
  let service: LibraryService;
  const rigger = buildUser({ role: Role.Rigger, displayName: 'Eca Rigger' });
  const admin = buildUser({ role: Role.Admin, displayName: 'Admin' });
  let sigma: GearModel;

  beforeEach(() => {
    manager = new InMemoryManager();
    storage = new FakeStorage();
    service = new LibraryService(manager as never, storage);
    sigma = manager.seed(GearModel, {
      kind: 'container',
      manufacturer: 'UPT Vector',
      model: 'Sigma Tandem',
      active: true,
    });
  });

  describe('add', () => {
    test('stores the file and records who added it, its size and checksum', async () => {
      const file = pdf('Sigma manual');

      const view = await service.add(rigger, file, {
        title: 'Sigma II Tandem owners manual',
        kind: 'manual',
        modelId: sigma.id,
        revision: 'Rev4',
        language: 'en',
        sourceUrl: 'https://uptvector.com/wp-content/uploads/2026/06/Man013-Rev4-SigmaII-Tandem-Owners-Manual.pdf',
      });

      expect(view).toMatchObject({
        title: 'Sigma II Tandem owners manual',
        kind: 'manual',
        manufacturer: 'UPT Vector',
        modelId: sigma.id,
        modelName: 'Sigma Tandem',
        revision: 'Rev4',
        language: 'en',
        fileName: 'Sigma manual.pdf',
        sizeBytes: file.size,
        addedByName: 'Eca Rigger',
        archivedAt: null,
      });
      expect([...storage.files.values()][0]).toEqual(file.buffer);
    });

    test('a document without a model needs a manufacturer', async () => {
      await expect(service.add(rigger, pdf(), { title: 'Loose manual', kind: 'manual' })).rejects.toThrow(
        BadRequestException,
      );

      const view = await service.add(rigger, pdf('b'), {
        title: 'Loose manual',
        kind: 'manual',
        manufacturer: 'Mirage',
      });
      expect(view).toMatchObject({ manufacturer: 'Mirage', modelId: null, modelName: null });
    });

    test('refuses a missing file, a file that is not a PDF and an oversized file, and stores nothing', async () => {
      const notPdf = { ...pdf(), buffer: Buffer.from('<html>not a pdf</html>'), originalname: 'manual.pdf' };
      const huge = { ...pdf(), size: LIBRARY_MAX_BYTES + 1 };
      const body = { title: 'T', kind: 'manual' as const, manufacturer: 'M' };

      await expect(service.add(rigger, undefined, body)).rejects.toThrow(BadRequestException);
      await expect(service.add(rigger, notPdf, body)).rejects.toThrow(BadRequestException);
      await expect(service.add(rigger, huge, body)).rejects.toThrow(BadRequestException);

      expect(storage.files.size).toBe(0);
    });

    test('judges a PDF by its first bytes, not its name', async () => {
      const disguised = { ...pdf(), originalname: 'manual.exe', mimetype: 'application/octet-stream' };

      const view = await service.add(rigger, disguised, { title: 'T', kind: 'manual', manufacturer: 'M' });

      expect(view.fileName).toBe('manual.exe');
    });

    test('accepts only an https source link', async () => {
      const body = { title: 'T', kind: 'manual' as const, manufacturer: 'M', sourceUrl: 'http://example.com/a.pdf' };

      await expect(service.add(rigger, pdf(), body)).rejects.toThrow(BadRequestException);
    });

    test('refuses an unknown model', async () => {
      await expect(
        service.add(rigger, pdf(), { title: 'T', kind: 'manual', modelId: '00000000-0000-4000-8000-00000000ffff' }),
      ).rejects.toThrow(BadRequestException);
    });

    test('refuses a duplicate by checksum and names the document already there', async () => {
      await service.add(rigger, pdf('same'), { title: 'First copy', kind: 'manual', manufacturer: 'M' });

      await expect(
        service.add(rigger, pdf('same'), { title: 'Second copy', kind: 'manual', manufacturer: 'M' }),
      ).rejects.toThrow(new ConflictException('This file is already in the Library as "First copy"'));
    });

    test('a storage failure is a 502 and leaves no row behind', async () => {
      storage.failWith = new StorageError('down');

      await expect(service.add(rigger, pdf(), { title: 'T', kind: 'manual', manufacturer: 'M' })).rejects.toThrow(
        BadGatewayException,
      );
      expect((await service.list(rigger, {})).total).toBe(0);
    });

    test('keeps only the file name of a path', async () => {
      const file = { ...pdf(), originalname: '../../secrets/Manual Rev2.pdf' };

      const view = await service.add(rigger, file, { title: 'T', kind: 'manual', manufacturer: 'M' });

      expect(view.fileName).toBe('Manual Rev2.pdf');
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await service.add(rigger, pdf('a'), {
        title: 'Sigma manual',
        kind: 'manual',
        modelId: sigma.id,
        revision: 'Rev3',
      });
      await service.add(rigger, pdf('b'), {
        title: 'Sigma manual',
        kind: 'manual',
        modelId: sigma.id,
        revision: 'Rev4',
      });
      await service.add(rigger, pdf('c'), {
        title: 'Vigil bulletin',
        kind: 'service_bulletin',
        manufacturer: 'Vigil',
      });
    });

    test('filters by kind and by text in title, manufacturer or model', async () => {
      expect((await service.list(rigger, { kind: 'service_bulletin' })).documents.map((d) => d.title)).toEqual([
        'Vigil bulletin',
      ]);
      expect((await service.list(rigger, { search: 'tandem' })).total).toBe(2);
      expect((await service.list(rigger, { search: 'upt' })).total).toBe(2);
      expect((await service.list(rigger, { search: 'vigil' })).total).toBe(1);
      expect((await service.list(rigger, { search: 'nothing' })).total).toBe(0);
    });

    test('lists a model documents newest revision first', async () => {
      const result = await service.list(rigger, { modelId: sigma.id });

      expect(result.documents.map((d) => d.revision)).toEqual(['Rev4', 'Rev3']);
    });

    test('pages 25 a page', async () => {
      for (let i = 0; i < 27; i++) {
        await service.add(rigger, pdf(`x${i}`), { title: `Doc ${i}`, kind: 'other', manufacturer: 'M' });
      }

      const first = await service.list(rigger, { page: 1 });
      const second = await service.list(rigger, { page: 2 });

      expect(first.total).toBe(30);
      expect(first.documents).toHaveLength(25);
      expect(second.documents).toHaveLength(5);
    });

    test('hides archived documents except for an admin who asks', async () => {
      const [target] = (await service.list(rigger, { kind: 'service_bulletin' })).documents;
      await service.archive(admin, target!.id, 'Superseded');

      expect((await service.list(rigger, {})).total).toBe(2);
      expect((await service.list(rigger, { includeArchived: true })).total).toBe(2);
      expect((await service.list(admin, {})).total).toBe(2);
      const withArchived = await service.list(admin, { includeArchived: true });
      expect(withArchived.total).toBe(3);
      expect(withArchived.documents.find((d) => d.id === target!.id)).toMatchObject({
        archiveReason: 'Superseded',
      });
    });
  });

  describe('download', () => {
    test('returns the stored bytes and the original file name', async () => {
      const file = pdf('bytes');
      const added = await service.add(rigger, file, { title: 'T', kind: 'manual', manufacturer: 'M' });

      const result = await service.download(rigger, added.id);

      expect(result.bytes).toEqual(file.buffer);
      expect(result.fileName).toBe('bytes.pdf');
    });

    test('an unknown id is 404, and a storage failure is 502', async () => {
      await expect(service.download(rigger, '00000000-0000-4000-8000-00000000ffff')).rejects.toThrow(NotFoundException);
      const added = await service.add(rigger, pdf(), { title: 'T', kind: 'manual', manufacturer: 'M' });
      storage.failWith = new StorageError('down');

      await expect(service.download(rigger, added.id)).rejects.toThrow(BadGatewayException);
    });

    test('an archived document is 404 for a rigger and downloadable by an admin', async () => {
      const added = await service.add(rigger, pdf(), { title: 'T', kind: 'manual', manufacturer: 'M' });
      await service.archive(admin, added.id, 'Wrong file');

      await expect(service.download(rigger, added.id)).rejects.toThrow(NotFoundException);
      await expect(service.download(admin, added.id)).resolves.toMatchObject({ fileName: 'manual.pdf' });
    });
  });

  describe('archive', () => {
    test('needs a reason, keeps the stored file and cannot be repeated', async () => {
      const added = await service.add(rigger, pdf(), { title: 'T', kind: 'manual', manufacturer: 'M' });

      await expect(service.archive(admin, added.id, '  ')).rejects.toThrow(BadRequestException);
      const archived = await service.archive(admin, added.id, 'Superseded by Rev5');

      expect(archived).toMatchObject({ archiveReason: 'Superseded by Rev5' });
      expect(archived.archivedAt).not.toBeNull();
      expect(storage.files.size).toBe(1);
      await expect(service.archive(admin, added.id, 'again')).rejects.toThrow(ConflictException);
    });

    test('an unknown id is 404', async () => {
      await expect(service.archive(admin, '00000000-0000-4000-8000-00000000ffff', 'x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('forModel', () => {
    test('lists the documents for a model, newest revision first, without paging', async () => {
      await service.add(rigger, pdf('a'), { title: 'Old', kind: 'manual', modelId: sigma.id, revision: 'Rev2' });
      await service.add(rigger, pdf('b'), { title: 'New', kind: 'manual', modelId: sigma.id, revision: 'Rev10' });

      const documents = await service.forModel(sigma.id);

      expect(documents.map((d) => d.title)).toEqual(['New', 'Old']);
    });
  });
});
