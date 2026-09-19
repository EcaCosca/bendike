import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { UsedItemAdminDetail } from '@bendike/shared';
import { Role } from '@bendike/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUsedItemDto } from './dto/create-used-item.dto';
import { UpdateUsedItemDto } from './dto/update-used-item.dto';
import { UsedItemsAdminService } from './used-items-admin.service';

@ApiTags('used-items-admin')
@ApiBearerAuth()
@Controller('catalog/admin/used-items')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class UsedItemsAdminController {
  constructor(private readonly usedItems: UsedItemsAdminService) {}

  @Get()
  @ApiOperation({ summary: 'List every used item, listed, sold or inactive (admin only)' })
  findAll(): Promise<UsedItemAdminDetail[]> {
    return this.usedItems.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a used item from English copy; Spanish and Portuguese are translated (admin only)' })
  create(@Body() dto: CreateUsedItemDto): Promise<UsedItemAdminDetail> {
    return this.usedItems.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change price, brand, category, active flag, or mark sold or available (admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUsedItemDto): Promise<UsedItemAdminDetail> {
    return this.usedItems.update(id, dto);
  }
}
