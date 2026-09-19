import { buildProductWhatsappUrl } from './product-whatsapp-message';

describe('buildProductWhatsappUrl', () => {
  test.each([
    ['en', "Hello Eca, I'm interested in this used item: Icarus Safire 3."],
    ['es', 'Hola Eca, me interesa este artículo usado: Icarus Safire 3.'],
    ['pt', 'Olá Eca, tenho interesse neste item usado: Icarus Safire 3.'],
  ] as const)('writes the message in %s into the wa.me link', (locale, message) => {
    const url = new URL(buildProductWhatsappUrl('Icarus Safire 3', locale));

    expect(url.origin + url.pathname).toBe('https://wa.me/5493413955408');
    expect(url.searchParams.get('text')).toBe(message);
  });
});
