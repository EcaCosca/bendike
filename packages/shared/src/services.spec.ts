import { isServiceCategory } from './services';

describe('isServiceCategory', () => {
  test.each(['repack', 'aad_service', 'repair', 'reline', 'other'])('accepts %s', (value) => {
    expect(isServiceCategory(value)).toBe(true);
  });

  test.each(['patchwork', '', 3, null])('rejects %p', (value) => {
    expect(isServiceCategory(value)).toBe(false);
  });
});
