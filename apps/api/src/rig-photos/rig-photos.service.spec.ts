import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RIG_PHOTO_MAX_BYTES, RIG_PHOTO_MAX_PER_RIG, Role } from '@bendike/shared';
import { GearItem } from '../gear/entities/gear-item.entity';
import { MaintenanceEntry } from '../gear/entities/maintenance-entry.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearAccessService } from '../gear/gear-access.service';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { linkedTo } from '../gear/testing/no-links';
import { StorageError, type DocumentStorage } from '../storage/document-storage';
import { buildUser } from '../users/user.factory';
import { RigPhotosService } from './rig-photos.service';
import type { UploadedPhoto } from './uploaded-photo';

function jpeg(text = 'a'): UploadedPhoto {
  const buffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from(text)]);
  return { originalname: `${text}.jpg`, mimetype: 'image/jpeg', size: buffer.length, buffer };
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

describe('RigPhotosService', () => {
  const owner = buildUser({ role: Role.User, displayName: 'Ana Skydiver' });
  const rigger = buildUser({ role: Role.Rigger, displayName: 'Eca Rigger' });
  const otherRigger = buildUser({ role: Role.Rigger, displayName: 'Other Rigger' });
  const admin = buildUser({ role: Role.Admin, displayName: 'Admin' });
  const stranger = buildUser({ role: Role.User, displayName: 'Stranger' });
  let manager: InMemoryManager;
  let storage: FakeStorage;
  let service: RigPhotosService;
  let rig: Rig;

  beforeEach(() => {
    manager = new InMemoryManager();
    storage = new FakeStorage();
    service = new RigPhotosService(manager as never, new GearAccessService(linkedTo([rigger.id, owner.id])), storage);
    rig = manager.seed(Rig, { ownerId: owner.id, name: 'Tandem 1', notes: '', active: true });
  });

  describe('add', () => {
    test('stores the photo and records the caption, who added it and its size', async () => {
      const file = jpeg('rig front');

      const photo = await service.add(rigger, rig.id, file, { caption: '  Front view  ' });

      expect(photo).toMatchObject({
        rigId: rig.id,
        entryId: null,
        fileName: 'rig front.jpg',
        sizeBytes: file.size,
        caption: 'Front view',
        addedById: rigger.id,
        addedByName: 'Eca Rigger',
      });
      expect([...storage.files.values()][0]).toEqual(file.buffer);
    });

    test('the owner, a linked rigger and an admin can add; anyone else gets 404', async () => {
      await expect(service.add(owner, rig.id, jpeg('1'), {})).resolves.toBeDefined();
      await expect(service.add(rigger, rig.id, jpeg('2'), {})).resolves.toBeDefined();
      await expect(service.add(admin, rig.id, jpeg('3'), {})).resolves.toBeDefined();
      await expect(service.add(otherRigger, rig.id, jpeg('4'), {})).rejects.toThrow(NotFoundException);
      await expect(service.add(stranger, rig.id, jpeg('5'), {})).rejects.toThrow(NotFoundException);
      await expect(service.add(owner, '00000000-0000-4000-8000-00000000ffff', jpeg('6'), {})).rejects.toThrow(
        NotFoundException,
      );
    });

    test('accepts PNG and WebP by their first bytes, whatever the name', async () => {
      const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('x')]);
      const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBPx')]);

      await expect(
        service.add(
          owner,
          rig.id,
          { originalname: 'a.txt', mimetype: 'text/plain', size: png.length, buffer: png },
          {},
        ),
      ).resolves.toBeDefined();
      await expect(
        service.add(owner, rig.id, { originalname: 'b', mimetype: 'x', size: webp.length, buffer: webp }, {}),
      ).resolves.toBeDefined();
    });

    test('refuses a missing file, something that is not an image and a file over 8 MB, and stores nothing', async () => {
      const notImage = { ...jpeg(), buffer: Buffer.from('<html></html>') };
      const huge = { ...jpeg(), size: RIG_PHOTO_MAX_BYTES + 1 };

      await expect(service.add(owner, rig.id, undefined, {})).rejects.toThrow(BadRequestException);
      await expect(service.add(owner, rig.id, notImage, {})).rejects.toThrow(BadRequestException);
      await expect(service.add(owner, rig.id, huge, {})).rejects.toThrow(BadRequestException);
      expect(storage.files.size).toBe(0);
    });

    test('a rig holds at most 20 photos, and a removed one no longer counts', async () => {
      for (let i = 0; i < RIG_PHOTO_MAX_PER_RIG; i++) {
        await service.add(owner, rig.id, jpeg(`p${i}`), {});
      }

      await expect(service.add(owner, rig.id, jpeg('one more'), {})).rejects.toThrow(ConflictException);
      const [first] = await service.list(owner, rig.id);
      await service.remove(owner, first!.id);
      await expect(service.add(owner, rig.id, jpeg('room again'), {})).resolves.toBeDefined();
    });

    test('links a photo to a piece of work on the same rig, and refuses work from elsewhere', async () => {
      const item = manager.seed(GearItem, {
        ownerId: owner.id,
        rigId: rig.id,
        kind: 'reserve',
        manufacturer: 'PD',
        model: 'VR',
        serial: null,
        manufacturedOn: null,
        notes: '',
        modelId: null,
        retiredAt: null,
      });
      const entry = manager.seed(MaintenanceEntry, {
        gearItemId: item.id,
        kind: 'repack',
        performedOn: '2026-09-10',
        description: 'Repack',
      });
      const elsewhere = manager.seed(GearItem, {
        ownerId: owner.id,
        rigId: null,
        kind: 'aad',
        manufacturer: 'V',
        model: '4',
        serial: null,
        manufacturedOn: null,
        notes: '',
        modelId: null,
        retiredAt: null,
      });
      const foreign = manager.seed(MaintenanceEntry, {
        gearItemId: elsewhere.id,
        kind: 'battery',
        performedOn: '2026-09-10',
        description: 'Battery',
      });

      const linked = await service.add(owner, rig.id, jpeg('l'), { entryId: entry.id });
      expect(linked.entryId).toBe(entry.id);
      await expect(service.add(owner, rig.id, jpeg('f'), { entryId: foreign.id })).rejects.toThrow(BadRequestException);
      await expect(
        service.add(owner, rig.id, jpeg('u'), { entryId: '00000000-0000-4000-8000-00000000ffff' }),
      ).rejects.toThrow(BadRequestException);
    });

    test('a storage failure is a 502 and leaves no photo behind', async () => {
      storage.failWith = new StorageError('down');

      await expect(service.add(owner, rig.id, jpeg(), {})).rejects.toThrow(BadGatewayException);
      expect(await service.list(owner, rig.id)).toEqual([]);
    });
  });

  describe('list and covers', () => {
    test('lists a rig photos newest first to anyone who can read it, and 404 to others', async () => {
      const first = await service.add(owner, rig.id, jpeg('first'), {});
      const second = await service.add(rigger, rig.id, jpeg('second'), {});

      expect((await service.list(owner, rig.id)).map((p) => p.id)).toEqual([second.id, first.id]);
      expect(await service.list(rigger, rig.id)).toHaveLength(2);
      await expect(service.list(stranger, rig.id)).rejects.toThrow(NotFoundException);
    });

    test('the cover of each rig is its newest photo, and rigs without one have none', async () => {
      const other = manager.seed(Rig, { ownerId: owner.id, name: 'Micro', notes: '', active: true });
      manager.seed(Rig, { ownerId: owner.id, name: 'Bare', notes: '', active: true });
      await service.add(owner, rig.id, jpeg('old'), {});
      const newest = await service.add(owner, rig.id, jpeg('new'), {});
      const micro = await service.add(owner, other.id, jpeg('micro'), {});

      const covers = await service.covers(owner, owner.id);

      expect(covers).toEqual({ [rig.id]: newest.id, [other.id]: micro.id });
      await expect(service.covers(rigger, owner.id)).resolves.toEqual(covers);
      await expect(service.covers(stranger, owner.id)).rejects.toThrow(NotFoundException);
    });

    test('a removed photo drops out of the list and the cover', async () => {
      const older = await service.add(owner, rig.id, jpeg('old'), {});
      const newer = await service.add(owner, rig.id, jpeg('new'), {});
      await service.remove(owner, newer.id);

      expect((await service.list(owner, rig.id)).map((p) => p.id)).toEqual([older.id]);
      expect((await service.covers(owner, owner.id))[rig.id]).toBe(older.id);
    });
  });

  describe('file', () => {
    test('returns the stored bytes with the image type and the file name', async () => {
      const file = jpeg('bytes');
      const photo = await service.add(owner, rig.id, file, {});

      const result = await service.file(rigger, photo.id);

      expect(result).toMatchObject({ bytes: file.buffer, mimeType: 'image/jpeg', fileName: 'bytes.jpg' });
    });

    test('a stranger, an unknown id and a removed photo are 404; a storage failure is 502', async () => {
      const photo = await service.add(owner, rig.id, jpeg(), {});

      await expect(service.file(stranger, photo.id)).rejects.toThrow(NotFoundException);
      await expect(service.file(owner, '00000000-0000-4000-8000-00000000ffff')).rejects.toThrow(NotFoundException);
      storage.failWith = new StorageError('down');
      await expect(service.file(owner, photo.id)).rejects.toThrow(BadGatewayException);
      storage.failWith = null;
      await service.remove(owner, photo.id);
      await expect(service.file(owner, photo.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    test('the person who added it, the owner and an admin can remove it, and the file is kept', async () => {
      const byRigger = await service.add(rigger, rig.id, jpeg('r'), {});
      const byOwner = await service.add(owner, rig.id, jpeg('o'), {});
      const byRigger2 = await service.add(rigger, rig.id, jpeg('r2'), {});

      await service.remove(rigger, byRigger.id);
      await service.remove(owner, byRigger2.id);
      await service.remove(admin, byOwner.id);

      expect(await service.list(owner, rig.id)).toEqual([]);
      expect(storage.files.size).toBe(3);
    });

    test("a rigger cannot remove someone else's photo, and removing twice is a 404", async () => {
      const photo = await service.add(owner, rig.id, jpeg(), {});

      await expect(service.remove(rigger, photo.id)).rejects.toThrow(ForbiddenException);
      await expect(service.remove(stranger, photo.id)).rejects.toThrow(NotFoundException);
      await service.remove(owner, photo.id);
      await expect(service.remove(owner, photo.id)).rejects.toThrow(NotFoundException);
    });
  });
});
