import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationModule } from '../translation/translation.module';
import { UploadsModule } from '../uploads/uploads.module';
import { CatalogAdminController } from './catalog-admin.controller';
import { CatalogAdminService } from './catalog-admin.service';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Product } from './entities/product.entity';
import { UsedItemsAdminController } from './used-items-admin.controller';
import { UsedItemsAdminService } from './used-items-admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, Category, Product, ProductVariant, ProductImage]),
    UploadsModule,
    TranslationModule,
  ],
  controllers: [CatalogController, CatalogAdminController, UsedItemsAdminController],
  providers: [CatalogService, CatalogAdminService, UsedItemsAdminService],
  exports: [CatalogService],
})
export class CatalogModule {}
