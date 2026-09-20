import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grounding } from '../bulletins/entities';
import { GearItem } from '../gear/entities/gear-item.entity';
import { MaintenanceEntry } from '../gear/entities/maintenance-entry.entity';
import { Rig } from '../gear/entities/rig.entity';
import { PackingSheet } from '../packing-sheets/packing-sheet.entity';
import { RiggerLink } from '../rigger-links/rigger-link.entity';
import { User } from '../users/user.entity';
import { AuthorityController } from './authority.controller';
import { AuthorityService } from './authority.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, PackingSheet, MaintenanceEntry, GearItem, Rig, Grounding, RiggerLink])],
  controllers: [AuthorityController],
  providers: [AuthorityService],
})
export class AuthorityModule {}
