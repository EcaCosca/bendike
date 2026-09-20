import { StreamableFile } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { buildUser } from '../users/user.factory';
import { RigPhotosController } from './rig-photos.controller';
import type { RigPhotosService } from './rig-photos.service';

describe('RigPhotosController', () => {
  const user = buildUser({ role: Role.User });
  const photos = { file: jest.fn(), covers: jest.fn(), add: jest.fn(), list: jest.fn(), remove: jest.fn() };
  const controller = new RigPhotosController(photos as unknown as RigPhotosService);

  test('a photo is streamed inline with a long private cache header', async () => {
    photos.file.mockResolvedValue({ bytes: Buffer.from('img'), mimeType: 'image/jpeg', fileName: 'Front view.jpg' });
    const res = { setHeader: jest.fn() };

    const result = await controller.file(user, '00000000-0000-4000-8000-000000000001', res);

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, max-age=31536000, immutable');
    expect(result).toBeInstanceOf(StreamableFile);
    expect(result.getHeaders()).toMatchObject({
      type: 'image/jpeg',
      disposition: "inline; filename*=UTF-8''Front%20view.jpg",
    });
  });

  test('covers default to the signed-in account', async () => {
    photos.covers.mockResolvedValue({});

    await controller.covers(user, {});
    await controller.covers(user, { ownerId: 'someone-else' });

    expect(photos.covers).toHaveBeenNthCalledWith(1, user, user.id);
    expect(photos.covers).toHaveBeenNthCalledWith(2, user, 'someone-else');
  });
});
