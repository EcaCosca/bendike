import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GearItem } from '../gear/entities/gear-item.entity';
import { GearModule } from '../gear/gear.module';
import { RiggerLinksModule } from '../rigger-links/rigger-links.module';
import { User } from '../users/user.entity';
import { WorkQueueController } from './work-queue.controller';
import { WorkQueueService } from './work-queue.service';

@Module({
  imports: [GearModule, RiggerLinksModule, TypeOrmModule.forFeature([User, GearItem])],
  controllers: [WorkQueueController],
  providers: [WorkQueueService],
  exports: [WorkQueueService],
})
export class WorkQueueModule {}
