import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@bendike/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MAX_IMAGE_BYTES } from '../uploads/image-type';
import type { UploadedImage } from '../uploads/uploaded-image';
import { CatalogAdminService } from './catalog-admin.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateImageDto } from './dto/create-image.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductCopyDto } from './dto/update-product-copy.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@ApiTags('catalog-admin')
@ApiBearerAuth()
@Controller('catalog/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class CatalogAdminController {
  constructor(private readonly admin: CatalogAdminService) {}

  @Post('brands')
  @ApiOperation({ summary: 'Create a brand (admin only)' })
  createBrand(@Body() dto: CreateBrandDto) {
    return this.admin.createBrand(dto);
  }

  @Patch('brands/:id')
  @ApiOperation({ summary: 'Update a brand (admin only)' })
  updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.admin.updateBrand(id, dto);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category (admin only)' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.admin.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category (admin only)' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.admin.updateCategory(id, dto);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a product, inactive until priced (admin only)' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.admin.createProduct(dto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update a product; activating without a price is rejected (admin only)' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.admin.updateProduct(id, dto);
  }

  @Patch('products/:id/copy')
  @ApiOperation({ summary: 'Edit one locale of a translatable field and record the override (admin only)' })
  updateProductCopy(@Param('id') id: string, @Body() dto: UpdateProductCopyDto) {
    return this.admin.updateProductCopy(id, dto);
  }

  @Post('products/:id/variants')
  @ApiOperation({ summary: 'Add a variant to a product (admin only)' })
  createVariant(@Param('id') productId: string, @Body() dto: CreateVariantDto) {
    return this.admin.createVariant(productId, dto);
  }

  @Patch('variants/:id')
  @ApiOperation({ summary: 'Update a variant (admin only)' })
  updateVariant(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
    return this.admin.updateVariant(id, dto);
  }

  @Post('products/:id/images')
  @ApiOperation({ summary: 'Add an image to a product (admin only)' })
  createImage(@Param('id') productId: string, @Body() dto: CreateImageDto) {
    return this.admin.createImage(productId, dto);
  }

  @Post('products/:id/images/upload')
  @ApiOperation({ summary: 'Upload photos (JPEG, PNG or WebP, up to 5 MB each) for a product (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } },
  })
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: MAX_IMAGE_BYTES } }))
  uploadImages(@Param('id', ParseUUIDPipe) productId: string, @UploadedFiles() files: UploadedImage[] | undefined) {
    return this.admin.uploadImages(productId, files ?? []);
  }

  @Delete('images/:id')
  @ApiOperation({ summary: 'Remove a product image (admin only)' })
  deleteImage(@Param('id') id: string) {
    return this.admin.deleteImage(id);
  }
}
