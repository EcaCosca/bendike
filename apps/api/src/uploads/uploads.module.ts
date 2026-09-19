import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app.config.module';
import { ImageStorageService } from './image-storage.service';

@Module({
  imports: [AppConfigModule],
  providers: [ImageStorageService],
  exports: [ImageStorageService],
})
export class UploadsModule {}
