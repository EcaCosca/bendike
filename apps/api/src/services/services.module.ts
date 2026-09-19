import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { TranslationModule } from '../translation/translation.module';
import { ServicesAdminController } from './services-admin.controller';
import { ServicesAdminService } from './services-admin.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [TypeOrmModule.forFeature([Service]), TranslationModule],
  controllers: [ServicesController, ServicesAdminController],
  providers: [ServicesService, ServicesAdminService],
  exports: [ServicesService],
})
export class ServicesModule {}
