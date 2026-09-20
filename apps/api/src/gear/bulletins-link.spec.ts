import { GearModel } from './entities/gear-model.entity';
import { findCatalogueModel, resolveBulletinsLink } from './bulletins-link';

function model(overrides: Partial<GearModel>): GearModel {
  return Object.assign(new GearModel(), {
    id: overrides.model ?? 'id',
    kind: 'container',
    manufacturer: 'UPT Vector',
    model: 'Sigma Tandem',
    active: true,
    bulletinsUrl: null,
    ...overrides,
  });
}

const VECTOR = 'https://uptvector.com/product-service-bulletins/';

describe('resolveBulletinsLink', () => {
  test("offers the model's own link", () => {
    const sigma = model({ bulletinsUrl: VECTOR });

    expect(resolveBulletinsLink(sigma, [sigma])).toEqual({ url: VECTOR, source: 'model' });
  });

  test("falls back to another model of the same manufacturer, marked as the manufacturer's", () => {
    const sigma = model({ id: 'sigma', model: 'Sigma Tandem' });
    const vector = model({ id: 'vector', model: 'Vector 3', bulletinsUrl: VECTOR });

    expect(resolveBulletinsLink(sigma, [sigma, vector])).toEqual({ url: VECTOR, source: 'manufacturer' });
  });

  test('the manufacturer match ignores case and spaces, and never crosses manufacturers', () => {
    const sigma = model({ id: 'sigma' });
    const sameMaker = model({ id: 'a', manufacturer: ' upt vector ', model: 'Vector 3', bulletinsUrl: VECTOR });
    const other = model({
      id: 'b',
      manufacturer: 'Mirage',
      model: 'M1',
      bulletinsUrl: 'https://mirage.example/bulletins',
    });

    expect(resolveBulletinsLink(sigma, [sigma, other])).toBeNull();
    expect(resolveBulletinsLink(sigma, [sigma, other, sameMaker])?.url).toBe(VECTOR);
  });

  test('uses the same fallback whichever order the catalogue is in', () => {
    const sigma = model({ id: 'sigma' });
    const a = model({ id: 'a', model: 'A model', bulletinsUrl: 'https://a.example/' });
    const b = model({ id: 'b', model: 'B model', bulletinsUrl: 'https://b.example/' });

    expect(resolveBulletinsLink(sigma, [sigma, b, a])?.url).toBe('https://a.example/');
  });

  test('is null for a component that is not in the catalogue', () => {
    expect(resolveBulletinsLink(null, [model({ bulletinsUrl: VECTOR })])).toBeNull();
  });
});

describe('findCatalogueModel', () => {
  const sigma = model({ id: 'sigma' });
  const reserve = model({ id: 'reserve', kind: 'reserve', model: 'Sigma Tandem' });

  test('uses the linked model when the item has one', () => {
    expect(findCatalogueModel({ modelId: 'sigma', kind: 'container', manufacturer: 'x', model: 'y' }, [sigma])).toBe(
      sigma,
    );
  });

  test('otherwise matches kind, manufacturer and model ignoring case and spaces', () => {
    const item = { modelId: null, kind: 'container' as const, manufacturer: ' upt vector', model: 'SIGMA tandem ' };

    expect(findCatalogueModel(item, [reserve, sigma])).toBe(sigma);
  });

  test('is null when nothing matches', () => {
    expect(
      findCatalogueModel({ modelId: null, kind: 'aad', manufacturer: 'Vigil', model: 'Cuatro' }, [sigma]),
    ).toBeNull();
  });
});
