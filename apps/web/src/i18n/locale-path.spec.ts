import { buildLocaleSwitchPath } from './locale-path';

describe('buildLocaleSwitchPath', () => {
  test('swaps the locale segment and keeps the rest of the path', () => {
    expect(buildLocaleSwitchPath('/es/shop/freak6', '', 'pt')).toBe('/pt/shop/freak6');
  });

  test('keeps the query string', () => {
    expect(buildLocaleSwitchPath('/en/shop', '?category=wingsuits&page=2', 'es')).toBe(
      '/es/shop?category=wingsuits&page=2',
    );
  });

  test('handles the bare locale root', () => {
    expect(buildLocaleSwitchPath('/en', '', 'pt')).toBe('/pt');
  });
});
