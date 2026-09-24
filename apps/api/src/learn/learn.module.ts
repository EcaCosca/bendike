import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GearModule } from '../gear/gear.module';
import { TranslationModule } from '../translation/translation.module';
import { LearnCollection, LearnCollectionItem } from './entities/learn-collection.entity';
import { LearnItemLink } from './entities/learn-item-link.entity';
import { LearnItem } from './entities/learn-item.entity';
import { LearnAdminController } from './learn-admin.controller';
import { LearnAdminService } from './learn-admin.service';
import { LearnController } from './learn.controller';
import { LearnService } from './learn.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearnItem, LearnItemLink, LearnCollection, LearnCollectionItem]),
    GearModule,
    TranslationModule,
  ],
  controllers: [LearnController, LearnAdminController],
  providers: [LearnService, LearnAdminService],
})
export class LearnModule {}
