import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ServiceDetail, ServiceSummary } from '@bendike/shared';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { toServiceDetail, toServiceSummary } from './service-mapper';

@Injectable()
export class ServicesService {
  constructor(@InjectRepository(Service) private readonly services: Repository<Service>) {}

  async findActive(): Promise<ServiceSummary[]> {
    const rows = await this.services.find({ where: { active: true }, order: { position: 'ASC', slug: 'ASC' } });
    return rows.map(toServiceSummary);
  }

  async findActiveBySlug(slug: string): Promise<ServiceDetail> {
    const service = await this.services.findOne({ where: { slug, active: true } });
    if (!service) {
      throw new NotFoundException(`Service ${slug} not found`);
    }
    return toServiceDetail(service);
  }
}
