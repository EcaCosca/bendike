import type { DeepLClient, HttpDeepLClient } from './deepl-client';
import { translateField, translateProductCopy, TranslationService } from './translation.service';

function buildClient(overrides: Partial<DeepLClient> = {}): jest.Mocked<DeepLClient> {
  return {
    translate: jest.fn(),
    ...overrides,
  } as jest.Mocked<DeepLClient>;
}

describe('translateField', () => {
  test('a successful call returns the Spanish and Portuguese text', async () => {
    const client = buildClient();
    client.translate.mockImplementation((_text, target) => Promise.resolve(`${target}-translation`));

    const result = await translateField(client, 'Freak 6');

    expect(result).toEqual({ es: 'es-translation', pt: 'pt-translation' });
    expect(client.translate).toHaveBeenCalledWith('Freak 6', 'es');
    expect(client.translate).toHaveBeenCalledWith('Freak 6', 'pt');
  });

  test('a client that returns null for a locale produces null for that locale, not a throw', async () => {
    const client = buildClient();
    client.translate.mockResolvedValue(null);

    const result = await translateField(client, 'Freak 6');

    expect(result).toEqual({ es: null, pt: null });
  });

  test('a client that throws still resolves with null per locale', async () => {
    const client = buildClient();
    client.translate.mockRejectedValue(new Error('network down'));

    const result = await translateField(client, 'Freak 6');

    expect(result).toEqual({ es: null, pt: null });
  });
});

describe('translateProductCopy', () => {
  test('translates every field with no overrides', async () => {
    const client = buildClient();
    client.translate.mockImplementation((text, target) => Promise.resolve(`${text}-${target}`));

    const result = await translateProductCopy(
      client,
      { name: 'Freak 6', summary: 'A wingsuit', descriptionMd: '# Freak 6' },
      {},
    );

    expect(result.name).toEqual({ es: 'Freak 6-es', pt: 'Freak 6-pt' });
    expect(result.summary).toEqual({ es: 'A wingsuit-es', pt: 'A wingsuit-pt' });
    expect(result.descriptionMd).toEqual({ es: '# Freak 6-es', pt: '# Freak 6-pt' });
    expect(client.translate).toHaveBeenCalledTimes(6);
  });

  test('never calls DeepL for a locale/field listed in translation_overrides', async () => {
    const client = buildClient();
    client.translate.mockResolvedValue('translated');

    const result = await translateProductCopy(
      client,
      { name: 'Freak 6', summary: 'A wingsuit', descriptionMd: '# Freak 6' },
      { es: ['summary'], pt: ['name', 'descriptionMd'] },
    );

    expect(result.summary.es).toBeNull();
    expect(result.name.pt).toBeNull();
    expect(result.descriptionMd.pt).toBeNull();
    expect(result.name.es).toBe('translated');
    expect(result.summary.pt).toBe('translated');
    expect(result.descriptionMd.es).toBe('translated');
    expect(client.translate).not.toHaveBeenCalledWith('A wingsuit', 'es');
    expect(client.translate).not.toHaveBeenCalledWith('Freak 6', 'pt');
    expect(client.translate).not.toHaveBeenCalledWith('# Freak 6', 'pt');
  });
});

describe('TranslationService', () => {
  test('delegates translateField and translateProductCopy to the injected client', async () => {
    const client = buildClient();
    client.translate.mockImplementation((text, target) => Promise.resolve(`${text}-${target}`));
    const service = new TranslationService(client as unknown as HttpDeepLClient);

    const field = await service.translateField('Freak 6');
    expect(field).toEqual({ es: 'Freak 6-es', pt: 'Freak 6-pt' });

    const copy = await service.translateProductCopy(
      { name: 'Freak 6', summary: 'A wingsuit', descriptionMd: '# Freak 6' },
      {},
    );
    expect(copy.name).toEqual({ es: 'Freak 6-es', pt: 'Freak 6-pt' });
  });
});
