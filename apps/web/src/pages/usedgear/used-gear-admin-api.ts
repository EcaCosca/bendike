import type {
  Brand,
  CreateBrandRequestBody,
  CreateUsedItemRequestBody,
  Locale,
  ProductImage,
  UpdateUsedItemRequestBody,
  UsedItemAdminDetail,
} from '@bendike/shared';
import { apiFetch } from '../../api/http';

export type UsedItemCopyField = 'name' | 'summary' | 'descriptionMd';

export function listUsedItems(token: string): Promise<UsedItemAdminDetail[]> {
  return apiFetch<UsedItemAdminDetail[]>('/catalog/admin/used-items', {}, token);
}

export function createUsedItem(token: string, body: CreateUsedItemRequestBody): Promise<UsedItemAdminDetail> {
  return apiFetch<UsedItemAdminDetail>(
    '/catalog/admin/used-items',
    { method: 'POST', body: JSON.stringify(body) },
    token,
  );
}

export function updateUsedItem(
  token: string,
  id: string,
  body: UpdateUsedItemRequestBody,
): Promise<UsedItemAdminDetail> {
  return apiFetch<UsedItemAdminDetail>(
    `/catalog/admin/used-items/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) },
    token,
  );
}

export async function updateUsedItemCopy(
  token: string,
  id: string,
  body: { field: UsedItemCopyField; locale: Locale; value: string },
): Promise<void> {
  await apiFetch(`/catalog/admin/products/${id}/copy`, { method: 'PATCH', body: JSON.stringify(body) }, token);
}

export function uploadProductImages(token: string, productId: string, files: File[]): Promise<ProductImage[]> {
  const form = new FormData();
  for (const file of files) {
    form.append('files', file);
  }
  return apiFetch<ProductImage[]>(
    `/catalog/admin/products/${productId}/images/upload`,
    { method: 'POST', body: form },
    token,
  );
}

export async function deleteProductImage(token: string, imageId: string): Promise<void> {
  await apiFetch(`/catalog/admin/images/${imageId}`, { method: 'DELETE' }, token);
}

export function createBrand(token: string, body: CreateBrandRequestBody): Promise<Brand> {
  return apiFetch<Brand>('/catalog/admin/brands', { method: 'POST', body: JSON.stringify(body) }, token);
}
