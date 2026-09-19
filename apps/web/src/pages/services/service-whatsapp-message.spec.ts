import { buildServiceWhatsappUrl } from './service-whatsapp-message';

describe('buildServiceWhatsappUrl', () => {
  test.each([
    ['en', "Hello Eca, I'd like to ask about the service: Reline."],
    ['es', 'Hola Eca, quiero consultar por el servicio: Reline.'],
    ['pt', 'Olá Eca, quero saber mais sobre o serviço: Reline.'],
  ] as const)('writes the message in %s and encodes it into the wa.me link', (locale, message) => {
    const url = new URL(buildServiceWhatsappUrl('Reline', locale));

    expect(url.origin + url.pathname).toBe('https://wa.me/5493413955408');
    expect(url.searchParams.get('text')).toBe(message);
  });
});
