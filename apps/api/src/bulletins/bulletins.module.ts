import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GearItem } from '../gear/entities/gear-item.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearModule } from '../gear/gear.module';
import { RiggerLinksModule } from '../rigger-links/rigger-links.module';
import { User } from '../users/user.entity';
import { BulletinMatcherModule } from './bulletin-matcher.module';
import { BulletinsController, GroundingsController } from './bulletins.controller';
import { BulletinsService } from './bulletins.service';
import { BulletinMatch, BulletinTarget, Grounding, ServiceBulletin } from './entities';
import { GroundingService } from './grounding.service';
import { MatchesService } from './matches.service';

@Module({
  imports: [
    GearModule,
    RiggerLinksModule,
    BulletinMatcherModule,
    TypeOrmModule.forFeature([ServiceBulletin, BulletinTarget, BulletinMatch, Grounding, User, GearItem, Rig]),
  ],
  controllers: [BulletinsController, GroundingsController],
  providers: [BulletinsService, MatchesService, GroundingService],
  exports: [BulletinsService, MatchesService, GroundingService],
})
export class BulletinsModule {}
