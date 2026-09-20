import { Logger, Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app.config.module';
import { AppConfigService } from '../config/app.config.service';
import { DOCUMENT_STORAGE, type DocumentStorage } from './document-storage';
import { createDocumentStorage } from './storage.factory';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: DOCUMENT_STORAGE,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): DocumentStorage => {
        if (!config.googleDrive) {
          new Logger('DocumentStorage').warn(
            `Google Drive is not configured; library files are kept on local disk in ${config.libraryLocalDir}`,
          );
        }
        return createDocumentStorage(config);
      },
    },
  ],
  exports: [DOCUMENT_STORAGE],
})
export class StorageModule {}
