import type { Digest, DigestItem } from './digest';
import { renderDigest } from './digest-renderer';

function item(overrides: Partial<DigestItem> = {}): DigestItem {
  return {
    key: { subjectId: 'i1', kind: 'repack', dueKey: '2026-08-28' },
    section: 'overdue',
    status: 'overdue',
    ownerName: 'Salta en Rosario',
    ownerPhone: '+5493415550002',
    ownerEmail: 'dz@bendike.example',
    rigName: 'Micro 3',
    componentLabel: 'PD VR360',
    dueKind: 'repack',
    dueOn: '2026-08-28',
    daysLeft: -22,
    contactUrl: 'https://wa.me/5493415550002?text=Hola',
    ...overrides,
  };
}

function digest(locale: 'es' | 'en' | 'pt', items: DigestItem[]): Digest {
  return { rigger: { id: 'r1', displayName: 'Eca', email: 'eca@bendike.example', locale }, items };
}

const BASE = 'https://bendike.example';

describe('renderDigest', () => {
  test('writes the subject in the rigger language with the counts', () => {
    const items = [
      item(),
      item({
        section: 'due_soon',
        status: 'due_soon',
        daysLeft: 10,
        dueOn: '2026-09-29',
        key: { subjectId: 'i2', kind: 'repack', dueKey: '2026-09-29' },
      }),
    ];

    expect(renderDigest(digest('en', items), BASE).subject).toBe('Bendike: 2 items need your attention (1 overdue)');
    expect(renderDigest(digest('es', items), BASE).subject).toBe(
      'Bendike: 2 pendientes que requieren tu atención (1 vencidos)',
    );
    expect(renderDigest(digest('pt', items), BASE).subject).toBe(
      'Bendike: 2 pendências que precisam da sua atenção (1 vencidos)',
    );
  });

  test('lists each item with owner, rig, component, date, how late and the contact link, in text and html', () => {
    const { text, html } = renderDigest(digest('en', [item()]), BASE);

    for (const body of [text, html]) {
      expect(body).toContain('Salta en Rosario');
      expect(body).toContain('Micro 3');
      expect(body).toContain('PD VR360');
      expect(body).toContain('2026-08-28');
      expect(body).toContain('22 days overdue');
      expect(body).toContain('https://wa.me/5493415550002?text=Hola');
    }
    expect(html).toContain('<a href="https://wa.me/5493415550002?text=Hola"');
  });

  test('groups into overdue, due soon and awaiting verification with headings', () => {
    const verification = item({
      section: 'verification',
      status: 'pending',
      dueKind: null,
      dueOn: null,
      daysLeft: null,
      contactUrl: null,
      key: { subjectId: 'e1', kind: 'verification', dueKey: 'none' },
      verification: {
        kind: 'repack',
        performedOn: '2026-09-12',
        performedByName: 'Carlos Packer',
        performedByContact: '+54 9 341 555 0000',
      },
    });
    const { text } = renderDigest(digest('en', [item(), verification]), BASE);

    expect(text).toMatch(/OVERDUE/);
    expect(text).toMatch(/AWAITING YOUR VERIFICATION/);
    expect(text).toContain('Carlos Packer');
    expect(text).toContain('+54 9 341 555 0000');
    expect(text.indexOf('OVERDUE')).toBeLessThan(text.indexOf('AWAITING YOUR VERIFICATION'));
  });

  test('labels the contact link WhatsApp or email depending on what it opens', () => {
    const whatsapp = renderDigest(digest('en', [item()]), BASE);
    const email = renderDigest(digest('en', [item({ contactUrl: 'mailto:ana%40bendike.example?subject=x' })]), BASE);

    expect(whatsapp.text).toContain('Message on WhatsApp: https://wa.me/');
    expect(email.text).toContain('Send an email: mailto:ana');
    expect(email.text).not.toContain('WhatsApp');
    expect(email.html).toContain('>Send an email</a>');
  });

  test('shows grounded rigs and open bulletins with their notes, in each language', () => {
    const grounded = item({
      section: 'grounded',
      status: 'pending',
      dueKind: null,
      dueOn: null,
      daysLeft: null,
      contactUrl: null,
      componentLabel: '',
      note: 'Grounded by Eca: Frayed handle',
      key: { subjectId: 'r1', kind: 'grounded', dueKey: 'none' },
    });
    const bulletin = item({
      section: 'bulletin',
      status: 'pending',
      dueKind: null,
      dueOn: null,
      daysLeft: null,
      contactUrl: null,
      note: 'SB-1 (mandatory): Slider check. Inspect the slider',
      key: { subjectId: 'm1', kind: 'bulletin', dueKey: 'none' },
    });

    const en = renderDigest(digest('en', [grounded, bulletin]), BASE);
    expect(en.text).toContain('GROUNDED RIGS');
    expect(en.text).toContain('OPEN SERVICE BULLETINS');
    expect(en.text).toContain('Grounded by Eca: Frayed handle');
    expect(en.text).toContain('SB-1 (mandatory): Slider check. Inspect the slider');
    expect(en.text.indexOf('GROUNDED RIGS')).toBeLessThan(en.text.indexOf('OPEN SERVICE BULLETINS'));
    expect(renderDigest(digest('es', [grounded, bulletin]), BASE).text).toContain('BOLETINES DE SERVICIO ABIERTOS');
    expect(renderDigest(digest('pt', [grounded, bulletin]), BASE).text).toContain('BOLETINS DE SERVIÇO ABERTOS');
    expect(en.html).toContain('Grounded by Eca: Frayed handle');
  });

  test('links to the work queue', () => {
    const { text, html } = renderDigest(digest('en', [item()]), BASE);

    expect(text).toContain('https://bendike.example/app/work');
    expect(html).toContain('href="https://bendike.example/app/work"');
  });

  test('escapes names so a hostile account name cannot inject markup', () => {
    const { html } = renderDigest(
      digest('en', [item({ ownerName: '<script>alert(1)</script>', rigName: 'A & B' })]),
      BASE,
    );

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B');
  });

  test('an item with no contact link still renders, and a spare has no rig line', () => {
    const { text } = renderDigest(digest('en', [item({ contactUrl: null, rigName: null })]), BASE);

    expect(text).toContain('Salta en Rosario');
    expect(text).not.toContain('null');
  });

  test('says which kind of date is due in each language', () => {
    expect(renderDigest(digest('en', [item({ dueKind: 'battery' })]), BASE).text).toContain('Battery');
    expect(renderDigest(digest('es', [item({ dueKind: 'expiry' })]), BASE).text).toContain('Vencimiento');
    expect(renderDigest(digest('pt', [item({ dueKind: 'service' })]), BASE).text).toContain('Serviço');
  });
});
