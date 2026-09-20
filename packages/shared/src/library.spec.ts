import { LIBRARY_DOCUMENT_KINDS, LIBRARY_MAX_BYTES, isHttpsUrl } from './library';

describe('library', () => {
  test('a document is a manual, a service bulletin or something else', () => {
    expect(LIBRARY_DOCUMENT_KINDS).toEqual(['manual', 'service_bulletin', 'other']);
  });

  test('a file can be up to 25 MB', () => {
    expect(LIBRARY_MAX_BYTES).toBe(25 * 1024 * 1024);
  });
});

describe('isHttpsUrl', () => {
  test.each([
    'https://uptvector.com/product-service-bulletins/',
    'https://uptvector.com/wp-content/uploads/2026/06/Man013-Rev4-SigmaII-Tandem-Owners-Manual.pdf',
    'https://example.com:8443/a?b=c#d',
  ])('accepts %s', (url) => {
    expect(isHttpsUrl(url)).toBe(true);
  });

  test.each([
    'http://uptvector.com/manual.pdf',
    'ftp://uptvector.com/manual.pdf',
    'javascript:alert(1)',
    'https://',
    'https://user:secret@example.com/manual.pdf',
    'uptvector.com/manual.pdf',
    '',
    '   ',
  ])('rejects %p', (url) => {
    expect(isHttpsUrl(url)).toBe(false);
  });
});
