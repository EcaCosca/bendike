import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ServiceAdminDetail } from '@bendike/shared';
import { Role } from '@bendike/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceCopyDto } from './dto/update-service-copy.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesAdminService } from './services-admin.service';

@ApiTags('services-admin')
@ApiBearerAuth()
@Controller('admin/services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class ServicesAdminController {
  constructor(private readonly admin: ServicesAdminService) {}

  @Get()
  @ApiOperation({ summary: 'List every service, active or not (admin only)' })
  findAll(): Promise<ServiceAdminDetail[]> {
    return this.admin.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a service; Spanish and Portuguese are machine-translated (admin only)' })
  create(@Body() dto: CreateServiceDto): Promise<ServiceAdminDetail> {
    return this.admin.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category, price, position or active flag (admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceDto): Promise<ServiceAdminDetail> {
    return this.admin.update(id, dto);
  }

  @Patch(':id/copy')
  @ApiOperation({ summary: 'Edit one locale of a copy field and record the override (admin only)' })
  updateCopy(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceCopyDto): Promise<ServiceAdminDetail> {
    return this.admin.updateCopy(id, dto);
  }
}
