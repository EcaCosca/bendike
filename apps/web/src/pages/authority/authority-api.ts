import type {
  AuthorityGroundingRow,
  AuthorityPage,
  AuthorityRigRow,
  AuthoritySheetRow,
  AuthorityWorkRow,
  RiggerRegistryRow,
  RigResidence,
  RiggerRegistrySort,
} from '@bendike/shared';
import { apiFetch } from '../../api/http';

export interface RegistryQuery {
  search?: string;
  sort?: RiggerRegistrySort;
  page?: number;
}

export function getRiggers(token: string, query: RegistryQuery): Promise<AuthorityPage<RiggerRegistryRow>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return apiFetch<AuthorityPage<RiggerRegistryRow>>(`/authority/riggers${text ? `?${text}` : ''}`, {}, token);
}

export function getRigger(token: string, riggerId: string): Promise<RiggerRegistryRow> {
  return apiFetch<RiggerRegistryRow>(`/authority/riggers/${riggerId}`, {}, token);
}

export function getRiggerSheets(
  token: string,
  riggerId: string,
  page: number,
): Promise<AuthorityPage<AuthoritySheetRow>> {
  return apiFetch<AuthorityPage<AuthoritySheetRow>>(`/authority/riggers/${riggerId}/sheets?page=${page}`, {}, token);
}

export function getRiggerWork(token: string, riggerId: string, page: number): Promise<AuthorityPage<AuthorityWorkRow>> {
  return apiFetch<AuthorityPage<AuthorityWorkRow>>(`/authority/riggers/${riggerId}/work?page=${page}`, {}, token);
}

export function getRiggerGroundings(
  token: string,
  riggerId: string,
  page: number,
): Promise<AuthorityPage<AuthorityGroundingRow>> {
  return apiFetch<AuthorityPage<AuthorityGroundingRow>>(
    `/authority/riggers/${riggerId}/groundings?page=${page}`,
    {},
    token,
  );
}

export interface RigsQuery {
  search?: string;
  residence?: RigResidence;
  page?: number;
}

export function getRigs(token: string, query: RigsQuery): Promise<AuthorityPage<AuthorityRigRow>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return apiFetch<AuthorityPage<AuthorityRigRow>>(`/authority/rigs${text ? `?${text}` : ''}`, {}, token);
}
