import type { ServiceDetail, ServiceSummary } from '@bendike/shared';
import { apiFetch } from '../../api/http';

export function listServices(): Promise<ServiceSummary[]> {
  return apiFetch<ServiceSummary[]>('/services');
}

export function getService(slug: string): Promise<ServiceDetail> {
  return apiFetch<ServiceDetail>(`/services/${encodeURIComponent(slug)}`);
}
