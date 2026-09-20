import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GearItem } from '../gear/entities/gear-item.entity';
import { MaintenanceEntry } from '../gear/entities/maintenance-entry.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearModule } from '../gear/gear.module';
import { StorageModule } from '../storage/storage.module';
import { RigPhoto } from './rig-photo.entity';
import { RigPhotosController } from './rig-photos.controller';
import { RigPhotosService } from './rig-photos.service';

@Module({
  imports: [GearModule, StorageModule, TypeOrmModule.forFeature([RigPhoto, Rig, GearItem, MaintenanceEntry])],
  controllers: [RigPhotosController],
  providers: [RigPhotosService],
})
export class RigPhotosModule {}
