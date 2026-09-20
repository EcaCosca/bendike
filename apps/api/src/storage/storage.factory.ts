import type { AppConfigService } from '../config/app.config.service';
import type { DocumentStorage } from './document-storage';
import { GoogleDriveDocumentStorage } from './google-drive-document-storage';
import { LocalDocumentStorage } from './local-document-storage';
import { RefreshTokenProvider } from './refresh-token-provider';

export function createDocumentStorage(
  config: Pick<AppConfigService, 'googleDrive' | 'libraryLocalDir'>,
): DocumentStorage {
  if (config.googleDrive) {
    return new GoogleDriveDocumentStorage(config.googleDrive.folderId, new RefreshTokenProvider(config.googleDrive));
  }
  return new LocalDocumentStorage(config.libraryLocalDir);
}
