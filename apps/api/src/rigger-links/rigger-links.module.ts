import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { RiggerLink } from './rigger-link.entity';
import { RiggerLinksController, RiggersController } from './rigger-links.controller';
import { RiggerLinksService } from './rigger-links.service';

@Module({
  imports: [TypeOrmModule.forFeature([RiggerLink, User])],
  controllers: [RiggerLinksController, RiggersController],
  providers: [RiggerLinksService],
  exports: [RiggerLinksService],
})
export class RiggerLinksModule {}
