import { StreamableFile } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { buildUser } from '../users/user.factory';
import { LibraryController } from './library.controller';
import type { LibraryService } from './library.service';

describe('LibraryController', () => {
  const rigger = buildUser({ role: Role.Rigger });
  const library = {
    list: jest.fn(),
    add: jest.fn(),
    download: jest.fn(),
    archive: jest.fn(),
  };
  const controller = new LibraryController(library as unknown as LibraryService);

  test('a download is streamed with the original file name and no public link', async () => {
    library.download.mockResolvedValue({
      bytes: Buffer.from('%PDF-1.7'),
      fileName: 'Sigma II Tandem manual.pdf',
      mimeType: 'application/pdf',
    });

    const result = await controller.file(rigger, '00000000-0000-4000-8000-000000000001');

    expect(result).toBeInstanceOf(StreamableFile);
    expect(result.getHeaders()).toEqual({
      type: 'application/pdf',
      disposition: "attachment; filename*=UTF-8''Sigma%20II%20Tandem%20manual.pdf",
      length: 8,
    });
  });

  test('an upload hands the file and the fields to the service', async () => {
    const file = { originalname: 'a.pdf', mimetype: 'application/pdf', size: 8, buffer: Buffer.from('%PDF-1.7') };
    library.add.mockResolvedValue({ id: 'd1' });

    await controller.add(rigger, file, { title: 'Manual', kind: 'manual' });

    expect(library.add).toHaveBeenCalledWith(rigger, file, { title: 'Manual', kind: 'manual' });
  });
});
