import { renderRepackNotice, type RepackNoticeInput } from './repack-notice-renderer';

function input(overrides: Partial<RepackNoticeInput> = {}): RepackNoticeInput {
  return {
    locale: 'en',
    ownerName: 'Ana',
    rigName: 'Tandem 1',
    reserve: { manufacturer: 'UPT Vector', model: 'Sigma Reserve', serial: 'R-100' },
    rigger: { name: 'Eca Rigger', licence: 'AR-1234', phone: '+5493415550000', email: 'eca@bendike.example' },
    performedOn: '2026-09-19',
    signedAt: new Date('2026-09-20T11:51:00.000Z'),
    sheetNo: 7,
    nextDueOn: '2027-03-18',
    notes: '',
    rigUrl: 'https://app.bendike.example/app/gear/tandem-1',
    ...overrides,
  };
}

function whatsappTextOf(html: string): { number: string; message: string } {
  const match = /href="https:\/\/wa\.me\/(\d+)\?text=([^"]+)"/.exec(html);
  if (!match) throw new Error('no WhatsApp link');
  return { number: match[1] as string, message: decodeURIComponent((match[2] as string).replace(/&amp;/g, '&')) };
}

describe('renderRepackNotice', () => {
  test('has a Bendike banner in the brand colours', () => {
    const { html } = renderRepackNotice(input());

    expect(html).toContain('BENDIKE');
    expect(html).toContain('#0B2545');
    expect(html).toContain('#E0A406');
  });

  test('tells the owner, by name, that their reserve was repacked and by whom', () => {
    const { subject, text } = renderRepackNotice(input());

    expect(subject).toBe('Your reserve has been repacked: Tandem 1');
    expect(text).toContain(
      'Hello Ana, your reserve (UPT Vector Sigma Reserve, serial R-100) on rig Tandem 1 has been repacked by Eca Rigger.',
    );
  });

  test('lists the rig, reserve, dates, sheet, rigger, licence and next due date', () => {
    const { text, html } = renderRepackNotice(input());

    for (const part of [
      'Tandem 1',
      'UPT Vector Sigma Reserve',
      'R-100',
      '19 September 2026',
      '20 September 2026',
      '08:51',
      '7',
      'Eca Rigger',
      'AR-1234',
      '18 March 2027',
    ]) {
      expect(text).toContain(part);
      expect(html).toContain(part);
    }
  });

  test('offers a WhatsApp button to the rigger with a message from the owner', () => {
    const { html, text } = renderRepackNotice(input());

    const { number, message } = whatsappTextOf(html);
    expect(number).toBe('5493415550000');
    expect(message).toContain('Ana');
    expect(message).toContain('Tandem 1');
    expect(html).toContain('Message Eca Rigger on WhatsApp');
    expect(text).toContain('https://wa.me/5493415550000?text=');
  });

  test('without a phone the button writes an email to the rigger instead', () => {
    const { html, text } = renderRepackNotice(
      input({ rigger: { name: 'Eca Rigger', licence: 'AR-1234', phone: null, email: 'eca@bendike.example' } }),
    );

    expect(html).toContain('href="mailto:eca%40bendike.example?subject=');
    expect(html).toContain('Send an email to Eca Rigger');
    expect(text).toContain('mailto:eca%40bendike.example');
    expect(html).not.toContain('wa.me');
  });

  test("includes the rigger's notes when there are any", () => {
    const withNotes = renderRepackNotice(input({ notes: 'No MARD on this unit & changed the AAD' }));
    const without = renderRepackNotice(input());

    expect(withNotes.text).toContain('No MARD on this unit & changed the AAD');
    expect(withNotes.html).toContain('No MARD on this unit &amp; changed the AAD');
    expect(without.html).not.toContain('Notes from your rigger');
  });

  test('leaves out the next due date when there is none, and copes with no reserve on record', () => {
    const { text } = renderRepackNotice(input({ nextDueOn: null, reserve: null }));

    expect(text).not.toContain('Next repack due');
    expect(text).toContain('Hello Ana, your reserve on rig Tandem 1 has been repacked by Eca Rigger.');
  });

  test('links to the rig on Bendike', () => {
    const { html, text } = renderRepackNotice(input());

    expect(html).toContain('href="https://app.bendike.example/app/gear/tandem-1"');
    expect(text).toContain('https://app.bendike.example/app/gear/tandem-1');
  });

  test('escapes text that comes from users', () => {
    const { html } = renderRepackNotice(input({ ownerName: '<b>Ana</b>', rigName: 'Rig "1" <x>' }));

    expect(html).not.toContain('<b>Ana</b>');
    expect(html).toContain('&lt;b&gt;Ana&lt;/b&gt;');
    expect(html).toContain('Rig &quot;1&quot; &lt;x&gt;');
  });

  test('never uses a gendered pronoun for the rigger', () => {
    const { text } = renderRepackNotice(input());

    expect(text).not.toMatch(/\b(he|him|his|she|her)\b/i);
  });

  test('is written in Spanish for a Spanish-speaking owner', () => {
    const { subject, text, html } = renderRepackNotice(input({ locale: 'es' }));

    expect(subject).toBe('Tu reserva fue plegada: Tandem 1');
    expect(text).toContain(
      'Hola Ana, tu reserva (UPT Vector Sigma Reserve, serie R-100) del equipo Tandem 1 fue plegada por Eca Rigger.',
    );
    expect(text).toContain('19 de septiembre de 2026');
    expect(html).toContain('Escribir a Eca Rigger por WhatsApp');
    expect(whatsappTextOf(html).message).toContain('Hola Eca Rigger, soy Ana');
  });

  test('is written in Portuguese for a Portuguese-speaking owner', () => {
    const { subject, text, html } = renderRepackNotice(input({ locale: 'pt' }));

    expect(subject).toBe('Sua reserva foi dobrada: Tandem 1');
    expect(text).toContain(
      'Olá Ana, sua reserva (UPT Vector Sigma Reserve, série R-100) do equipamento Tandem 1 foi dobrada por Eca Rigger.',
    );
    expect(text).toContain('19 de setembro de 2026');
    expect(html).toContain('Escrever para Eca Rigger no WhatsApp');
  });
});
