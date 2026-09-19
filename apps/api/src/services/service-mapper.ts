import type { ServiceAdminDetail, ServiceDetail, ServiceSummary } from '@bendike/shared';
import { Service } from './entities/service.entity';

export function toServiceSummary(service: Service): ServiceSummary {
  return {
    id: service.id,
    slug: service.slug,
    category: service.category,
    name: service.name,
    summary: service.summary,
    priceAmount: service.priceAmount === null ? null : Number(service.priceAmount),
    priceCurrency: service.priceCurrency,
    position: service.position,
    active: service.active,
  };
}

export function toServiceDetail(service: Service): ServiceDetail {
  return {
    ...toServiceSummary(service),
    descriptionMd: service.descriptionMd,
    turnaroundNote: service.turnaroundNote,
  };
}

export function toServiceAdminDetail(service: Service): ServiceAdminDetail {
  return { ...toServiceDetail(service), translationOverrides: service.translationOverrides };
}
