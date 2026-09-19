import type {
  CreateServiceRequestBody,
  ServiceAdminDetail,
  UpdateServiceCopyRequestBody,
  UpdateServiceRequestBody,
} from '@bendike/shared';
import { apiFetch } from '../../api/http';

export function listAllServices(token: string): Promise<ServiceAdminDetail[]> {
  return apiFetch<ServiceAdminDetail[]>('/admin/services', {}, token);
}

export function createService(token: string, body: CreateServiceRequestBody): Promise<ServiceAdminDetail> {
  return apiFetch<ServiceAdminDetail>('/admin/services', { method: 'POST', body: JSON.stringify(body) }, token);
}

export function updateService(token: string, id: string, body: UpdateServiceRequestBody): Promise<ServiceAdminDetail> {
  return apiFetch<ServiceAdminDetail>(`/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token);
}

export function updateServiceCopy(
  token: string,
  id: string,
  body: UpdateServiceCopyRequestBody,
): Promise<ServiceAdminDetail> {
  return apiFetch<ServiceAdminDetail>(
    `/admin/services/${id}/copy`,
    { method: 'PATCH', body: JSON.stringify(body) },
    token,
  );
}
