import { slugify } from './slug';

describe('slugify', () => {
  test.each([
    ['Freak 6', 'freak-6'],
    ['CR+', 'cr-plus'],
    ['Icarus Safire 3, 170 sqft', 'icarus-safire-3-170-sqft'],
    ['  Reserva   Pequeña  ', 'reserva-pequena'],
    ['Plegado de reserva — deportivo', 'plegado-de-reserva-deportivo'],
    ['Such.A.Dbag', 'such-a-dbag'],
  ])('turns "%s" into "%s"', (text, expected) => {
    expect(slugify(text)).toBe(expected);
  });

  test('text with no letters or digits gives an empty slug', () => {
    expect(slugify('***')).toBe('');
  });
});
