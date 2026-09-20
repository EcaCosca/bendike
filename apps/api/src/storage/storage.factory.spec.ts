import { GoogleDriveDocumentStorage } from './google-drive-document-storage';
import { LocalDocumentStorage } from './local-document-storage';
import { createDocumentStorage } from './storage.factory';

describe('createDocumentStorage', () => {
  test('uses local disk when Google Drive is not configured', () => {
    const storage = createDocumentStorage({ googleDrive: null, libraryLocalDir: './library-files' });

    expect(storage).toBeInstanceOf(LocalDocumentStorage);
  });

  test('uses Google Drive when it is configured', () => {
    const storage = createDocumentStorage({
      googleDrive: { clientId: 'id', clientSecret: 'secret', refreshToken: 'refresh', folderId: 'folder' },
      libraryLocalDir: './library-files',
    });

    expect(storage).toBeInstanceOf(GoogleDriveDocumentStorage);
  });
});
