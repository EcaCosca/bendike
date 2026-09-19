import { contactLink, contactMessage, whatsappLink, type ContactMessageInput } from './whatsapp';

const base: ContactMessageInput = {
  locale: 'es',
  ownerName: 'Ana',
  riggerName: 'Eca',
  rigName: 'Micro 3',
  componentLabel: 'PD VR360',
  dueKind: 'repack',
  dueOn: '2026-11-11',
  daysLeft: 53,
};

describe('contactMessage', () => {
  test.each([
    ['es', /Hola Ana/, /plegado/],
    ['en', /Hi Ana/, /repack/],
    ['pt', /Olá Ana/, /dobragem/],
  ] as const)('a repack reminder in %s names everyone and the date', (locale, greeting, word) => {
    const message = contactMessage({ ...base, locale });

    expect(message).toMatch(greeting);
    expect(message).toMatch(word);
    for (const part of ['Eca', 'Micro 3', 'PD VR360', '2026-11-11']) {
      expect(message).toContain(part);
    }
  });

  test('an overdue date says it has passed instead of upcoming', () => {
    expect(contactMessage({ ...base, locale: 'en', daysLeft: -22 })).toMatch(/was due on 2026-11-11/);
    expect(contactMessage({ ...base, locale: 'es', daysLeft: -22 })).toMatch(/venció el 2026-11-11/);
    expect(contactMessage({ ...base, locale: 'en', daysLeft: 53 })).toMatch(/is due on 2026-11-11/);
  });

  test('each due kind talks about its own thing', () => {
    expect(contactMessage({ ...base, locale: 'en', dueKind: 'battery' })).toMatch(/battery/i);
    expect(contactMessage({ ...base, locale: 'en', dueKind: 'service' })).toMatch(/service/i);
    expect(contactMessage({ ...base, locale: 'en', dueKind: 'expiry' })).toMatch(/end of life|expir/i);
  });

  test('with no date on record it asks for the details instead of inventing one', () => {
    const message = contactMessage({ ...base, locale: 'en', dueOn: null, daysLeft: null });

    expect(message).not.toMatch(/null|undefined/);
    expect(message).toMatch(/no date on record/i);
  });

  test('a spare with no rig leaves the rig out', () => {
    expect(contactMessage({ ...base, locale: 'en', rigName: null })).not.toMatch(/ on null| of null/);
  });
});

describe('whatsappLink', () => {
  test('is wa.me with digits only and an encoded message', () => {
    expect(whatsappLink('+54 9 341 555 0000', 'Hola, ¿cómo va? 100%')).toBe(
      'https://wa.me/5493415550000?text=Hola%2C%20%C2%BFc%C3%B3mo%20va%3F%20100%25',
    );
  });
});

describe('contactLink', () => {
  test('uses WhatsApp when the owner has a phone', () => {
    expect(contactLink({ phone: '+5493415550000', email: 'a@b.c' }, { ...base, locale: 'en' })).toMatch(
      /^https:\/\/wa\.me\/5493415550000\?text=/,
    );
  });

  test('falls back to email with a subject when there is no phone', () => {
    const link = contactLink({ phone: null, email: 'ana@bendike.example' }, { ...base, locale: 'en' });

    expect(link).toMatch(/^mailto:ana%40bendike\.example\?subject=/);
    expect(link).toContain('body=');
  });
});
