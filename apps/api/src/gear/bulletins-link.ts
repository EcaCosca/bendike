import type { GearKind } from '@bendike/shared';
import type { GearModel } from './entities/gear-model.entity';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export interface CatalogueLookup {
  modelId: string | null;
  kind: GearKind;
  manufacturer: string;
  model: string;
}

export function findCatalogueModel(item: CatalogueLookup, catalogue: readonly GearModel[]): GearModel | null {
  if (item.modelId) {
    const linked = catalogue.find((m) => m.id === item.modelId);
    if (linked) return linked;
  }
  return (
    catalogue.find(
      (m) =>
        m.kind === item.kind &&
        normalize(m.manufacturer) === normalize(item.manufacturer) &&
        normalize(m.model) === normalize(item.model),
    ) ?? null
  );
}

export function resolveBulletinsLink(
  model: GearModel | null,
  catalogue: readonly GearModel[],
): { url: string; source: 'model' | 'manufacturer' } | null {
  if (!model) return null;
  if (model.bulletinsUrl) return { url: model.bulletinsUrl, source: 'model' };
  const sameMaker = catalogue
    .filter((m) => m.id !== model.id && m.bulletinsUrl && normalize(m.manufacturer) === normalize(model.manufacturer))
    .sort((a, b) => a.model.localeCompare(b.model, 'en', { sensitivity: 'base' }));
  const found = sameMaker[0];
  return found?.bulletinsUrl ? { url: found.bulletinsUrl, source: 'manufacturer' } : null;
}
