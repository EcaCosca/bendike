import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ServiceDetail, ServiceSummary } from '@bendike/shared';
import { ServicesService } from './services.service';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List active rigging services' })
  findActive(): Promise<ServiceSummary[]> {
    return this.services.findActive();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get an active rigging service by slug' })
  findBySlug(@Param('slug') slug: string): Promise<ServiceDetail> {
    return this.services.findActiveBySlug(slug);
  }
}
