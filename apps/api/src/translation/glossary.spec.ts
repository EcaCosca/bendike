import { applyGlossary, GLOSSARY, missingTerms } from './glossary';

describe('applyGlossary', () => {
  test('puts the canopy pilot’s flare back where DeepL left a distress flare', () => {
    expect(applyGlossary('Cuándo y cuándo no usar la bengala.', 'es')).toBe('Cuándo y cuándo no usar la flare.');
    expect(applyGlossary('Quando usar o sinalizador.', 'pt')).toBe('Quando usar o flare.');
  });

  test('restores the English the sport actually keeps', () => {
    expect(applyGlossary('Ajustá el control deslizante antes de plegar.', 'es')).toContain('slider');
    expect(applyGlossary('O pacote profissional leva mais tempo.', 'pt')).toContain('pro pack');
  });

  test('uses the words a rigger uses for the parts', () => {
    expect(applyGlossary('Revisá los elevadores y el paracaídas piloto.', 'es')).toBe(
      // "los bandas", not "las bandas": a lookup table cannot fix the article it did
      // not touch. Documented in glossary.ts; the backfill flags these for a reader.
      'Revisá los bandas y el pilotín.',
    );
    expect(applyGlossary('O dossel abriu limpo.', 'pt')).toBe('O vela abriu limpo.');
  });

  test('keeps the case of what it replaces', () => {
    expect(applyGlossary('Bengala alta.', 'es')).toBe('Flare alta.');
    expect(applyGlossary('BENGALA', 'es')).toBe('FLARE');
  });

  test('matches whole words only', () => {
    // "Bengalas" is the plural and is listed; a longer unrelated word must survive.
    expect(applyGlossary('bengalí', 'es')).toBe('bengalí');
    expect(applyGlossary('bengalas', 'es')).toBe('flare');
  });

  test('leaves text that is already right alone', () => {
    const already = 'Revisá las bandas y el pilotín antes de saltar.';
    expect(applyGlossary(already, 'es')).toBe(already);
  });

  test("uses Eca's readings, not the ones a dictionary suggests", () => {
    // Corrected by Eca on review, 2026-09-25.
    expect(applyGlossary('un pilotillo de 32 pulgadas', 'es')).toBe('un pilotín de 32 pulgadas');
    expect(applyGlossary('configuración todo malla', 'es')).toBe('configuración mesh');
    expect(applyGlossary('equipo de skydive', 'es')).toBe('equipo de paracaidismo');
  });

  test('every term carries both readings and something to replace', () => {
    for (const term of GLOSSARY) {
      expect(term.es.length).toBeGreaterThan(0);
      expect(term.pt.length).toBeGreaterThan(0);
      expect(term.wrong.length).toBeGreaterThan(0);
    }
  });
});

describe('missingTerms', () => {
  test('flags a term that never made it into the translation', () => {
    expect(missingTerms('Check the risers before you jump.', 'Revisá todo antes de saltar.', 'es')).toContain('risers');
  });

  test('says nothing when the term came through', () => {
    expect(missingTerms('Check the risers.', 'Revisá las bandas.', 'es')).toEqual([]);
  });
});
