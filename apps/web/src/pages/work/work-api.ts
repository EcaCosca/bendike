import type { CustomerSummary, WorkQueueQuery, WorkQueueResponse } from '@bendike/shared';
import { apiFetch } from '../../api/http';

export function toWorkQueryString(query: WorkQueueQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export function getQueue(token: string, query: WorkQueueQuery): Promise<WorkQueueResponse> {
  return apiFetch<WorkQueueResponse>(`/work-queue${toWorkQueryString(query)}`, {}, token);
}

export function getCustomers(token: string): Promise<CustomerSummary[]> {
  return apiFetch<CustomerSummary[]>('/work-queue/customers', {}, token);
}

export interface RiggerSettings {
  digestEnabled: boolean;
}

export function getRiggerSettings(token: string): Promise<RiggerSettings> {
  return apiFetch<RiggerSettings>('/rigger-settings', {}, token);
}

export function updateRiggerSettings(token: string, body: RiggerSettings): Promise<RiggerSettings> {
  return apiFetch<RiggerSettings>('/rigger-settings', { method: 'PUT', body: JSON.stringify(body) }, token);
}
