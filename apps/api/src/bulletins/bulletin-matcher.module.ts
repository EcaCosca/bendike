import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GearItem } from '../gear/entities/gear-item.entity';
import { Rig } from '../gear/entities/rig.entity';
import { BulletinMatcher } from './bulletin-matcher';
import { BulletinMatch, BulletinTarget, Grounding, ServiceBulletin } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceBulletin, BulletinTarget, BulletinMatch, Grounding, GearItem, Rig])],
  providers: [BulletinMatcher],
  exports: [BulletinMatcher],
})
export class BulletinMatcherModule {}
