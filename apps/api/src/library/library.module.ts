import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GearModel } from '../gear/entities/gear-model.entity';
import { StorageModule } from '../storage/storage.module';
import { LibraryController } from './library.controller';
import { LibraryDocument } from './library-document.entity';
import { LibraryService } from './library.service';

@Module({
  imports: [StorageModule, TypeOrmModule.forFeature([LibraryDocument, GearModel])],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
