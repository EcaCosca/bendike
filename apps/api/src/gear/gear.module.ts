import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulletinMatcherModule } from '../bulletins/bulletin-matcher.module';
import { RiggerLinksModule } from '../rigger-links/rigger-links.module';
import { User } from '../users/user.entity';
import { ComponentPart } from './entities/component-part.entity';
import { AadDetail, ContainerDetail, MainDetail, ReserveDetail } from './entities/details.entities';
import { GearItem } from './entities/gear-item.entity';
import { GearModel } from './entities/gear-model.entity';
import { MaintenanceEntry } from './entities/maintenance-entry.entity';
import { Rig } from './entities/rig.entity';
import { GearAccessService } from './gear-access.service';
import { GearClock, SystemGearClock } from './gear-clock';
import { GearModelsController } from './gear-models.controller';
import { GearModelsService } from './gear-models.service';
import { GearReadService } from './gear-read.service';
import { GearController } from './gear.controller';
import { GearService } from './gear.service';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [
    RiggerLinksModule,
    BulletinMatcherModule,
    TypeOrmModule.forFeature([
      User,
      Rig,
      GearModel,
      GearItem,
      ContainerDetail,
      MainDetail,
      ReserveDetail,
      AadDetail,
      ComponentPart,
      MaintenanceEntry,
    ]),
  ],
  controllers: [GearController, GearModelsController],
  providers: [
    GearAccessService,
    GearReadService,
    GearService,
    MaintenanceService,
    GearModelsService,
    { provide: GearClock, useClass: SystemGearClock },
  ],
  exports: [GearAccessService, GearReadService, GearService, MaintenanceService, GearClock],
})
export class GearModule {}
