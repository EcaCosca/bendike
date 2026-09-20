import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../config/app.config.module';
import { EmailModule } from '../email/email.module';
import { GearItem } from '../gear/entities/gear-item.entity';
import { GearModel } from '../gear/entities/gear-model.entity';
import { MaintenanceEntry } from '../gear/entities/maintenance-entry.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearModule } from '../gear/gear.module';
import { LibraryModule } from '../library/library.module';
import { User } from '../users/user.entity';
import { PackingSheet } from './packing-sheet.entity';
import { PackingSheetsController } from './packing-sheets.controller';
import { PackingSheetsService } from './packing-sheets.service';

@Module({
  imports: [
    AppConfigModule,
    EmailModule,
    GearModule,
    LibraryModule,
    TypeOrmModule.forFeature([PackingSheet, Rig, GearItem, GearModel, MaintenanceEntry, User]),
  ],
  controllers: [PackingSheetsController],
  providers: [PackingSheetsService],
})
export class PackingSheetsModule {}
