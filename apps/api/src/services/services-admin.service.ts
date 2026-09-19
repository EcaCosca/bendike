import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { LocalizedText, PriceCurrency, ServiceAdminDetail, TranslationOverrides } from '@bendike/shared';
import { Repository } from 'typeorm';
import { TranslationService } from '../translation/translation.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceCopyDto } from './dto/update-service-copy.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';
import { toServiceAdminDetail } from './service-mapper';

function requirePricePair(amount: number | null, currency: PriceCurrency | null): void {
  if ((amount === null) !== (currency === null)) {
    throw new BadRequestException('A price needs both an amount and a currency, or neither');
  }
}

@Injectable()
export class ServicesAdminService {
  constructor(
    @InjectRepository(Service) private readonly services: Repository<Service>,
    private readonly translation: TranslationService,
  ) {}

  async findAll(): Promise<ServiceAdminDetail[]> {
    const rows = await this.services.find({ order: { position: 'ASC', slug: 'ASC' } });
    return rows.map(toServiceAdminDetail);
  }

  async create(dto: CreateServiceDto): Promise<ServiceAdminDetail> {
    const amount = dto.priceAmount ?? null;
    const currency = dto.priceCurrency ?? null;
    requirePricePair(amount, currency);

    if (await this.services.findOne({ where: { slug: dto.slug } })) {
      throw new ConflictException(`A service with slug ${dto.slug} already exists`);
    }

    const copy = await this.translation.translateProductCopy(
      { name: dto.name, summary: dto.summary, descriptionMd: dto.descriptionMd },
      {},
    );
    const localized = (english: string, field: keyof typeof copy): LocalizedText => ({
      en: english,
      es: copy[field].es ?? english,
      pt: copy[field].pt ?? english,
    });

    let turnaroundNote: LocalizedText | null = null;
    if (dto.turnaroundNote) {
      const translated = await this.translation.translateField(dto.turnaroundNote);
      turnaroundNote = {
        en: dto.turnaroundNote,
        es: translated.es ?? dto.turnaroundNote,
        pt: translated.pt ?? dto.turnaroundNote,
      };
    }

    const saved = await this.services.save(
      this.services.create({
        slug: dto.slug,
        category: dto.category,
        name: localized(dto.name, 'name'),
        summary: localized(dto.summary, 'summary'),
        descriptionMd: localized(dto.descriptionMd, 'descriptionMd'),
        turnaroundNote,
        translationOverrides: {},
        priceAmount: amount === null ? null : String(amount),
        priceCurrency: currency,
        position: dto.position ?? 0,
        active: true,
      }),
    );
    return toServiceAdminDetail(saved);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<ServiceAdminDetail> {
    const service = await this.findOrThrow(id);

    const amount =
      'priceAmount' in dto
        ? (dto.priceAmount ?? null)
        : service.priceAmount === null
          ? null
          : Number(service.priceAmount);
    const currency = 'priceCurrency' in dto ? (dto.priceCurrency ?? null) : service.priceCurrency;
    requirePricePair(amount, currency);
    service.priceAmount = amount === null ? null : String(amount);
    service.priceCurrency = currency;

    if (dto.category !== undefined) {
      service.category = dto.category;
    }
    if (dto.position !== undefined) {
      service.position = dto.position;
    }
    if (dto.active !== undefined) {
      service.active = dto.active;
    }

    return toServiceAdminDetail(await this.services.save(service));
  }

  async updateCopy(id: string, dto: UpdateServiceCopyDto): Promise<ServiceAdminDetail> {
    const service = await this.findOrThrow(id);

    const current: LocalizedText =
      dto.field === 'turnaroundNote' ? (service.turnaroundNote ?? { en: '', es: '', pt: '' }) : service[dto.field];
    const next = { ...current, [dto.locale]: dto.value };
    if (dto.field === 'turnaroundNote') {
      service.turnaroundNote = next;
    } else {
      service[dto.field] = next;
    }

    const overrides: TranslationOverrides = { ...service.translationOverrides };
    overrides[dto.locale] = [...new Set([...(overrides[dto.locale] ?? []), dto.field])];
    service.translationOverrides = overrides;

    return toServiceAdminDetail(await this.services.save(service));
  }

  private async findOrThrow(id: string): Promise<Service> {
    const service = await this.services.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }
    return service;
  }
}
