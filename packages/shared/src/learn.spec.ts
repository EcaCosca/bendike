import { embedSrc, parseEmbed, suggestionMessage, youtubeThumbnail } from './learn';

describe('parseEmbed', () => {
  test.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?t=42', 'dQw4w9WgXcQ'],
    ['https://youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('recognises the YouTube video %s', (url, id) => {
    expect(parseEmbed(url)).toEqual({ provider: 'youtube', id, kind: 'video' });
  });

  test.each([
    'https://www.youtube.com/@flysquirreltv',
    'https://www.youtube.com/@Brian-Germain/videos',
    'https://www.youtube.com/channel/UC1234567890',
  ])('gives no embed for the channel %s, which stays a link', (url) => {
    expect(parseEmbed(url)).toBeNull();
  });

  test('recognises a Spotify show, ignoring the tracking query and a locale prefix', () => {
    expect(parseEmbed('https://open.spotify.com/show/3WjzoEn19X2rCimimh9C5N?si=d0ce840d13024598')).toEqual({
      provider: 'spotify',
      id: '3WjzoEn19X2rCimimh9C5N',
      kind: 'show',
    });
    expect(parseEmbed('https://open.spotify.com/intl-es/episode/4ZQF3HcHCuChVwZ0nXIJ1J')).toEqual({
      provider: 'spotify',
      id: '4ZQF3HcHCuChVwZ0nXIJ1J',
      kind: 'episode',
    });
  });

  test('accepts a Spotify embed address pasted from the share dialog', () => {
    expect(parseEmbed('https://open.spotify.com/embed/show/0IXuGzTeCwtiplzaOZxqti/video?utm_source=generator')).toEqual(
      { provider: 'spotify', id: '0IXuGzTeCwtiplzaOZxqti', kind: 'show' },
    );
  });

  test.each([
    ['https://vimeo.com/123456789', '123456789'],
    ['https://player.vimeo.com/video/123456789?h=abc', '123456789'],
  ])('recognises the Vimeo video %s', (url, id) => {
    expect(parseEmbed(url)).toEqual({ provider: 'vimeo', id, kind: 'video' });
  });

  test.each([
    'https://squirrel.ws/learn/',
    'https://www.amazon.com/dp/0977627705',
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://open.spotify.com/artist/3WjzoEn19X2rCimimh9C5N',
    'https://www.youtube.com/watch?v=short',
    'not a url',
    '',
  ])('returns null for %p', (url) => {
    expect(parseEmbed(url)).toBeNull();
  });
});

describe('embedSrc', () => {
  test('uses the privacy domains of each provider', () => {
    expect(embedSrc({ provider: 'youtube', id: 'dQw4w9WgXcQ', kind: 'video' })).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
    expect(embedSrc({ provider: 'spotify', id: '3WjzoEn19X2rCimimh9C5N', kind: 'show' })).toBe(
      'https://open.spotify.com/embed/show/3WjzoEn19X2rCimimh9C5N',
    );
    expect(embedSrc({ provider: 'spotify', id: '3WjzoEn19X2rCimimh9C5N', kind: 'episode' })).toBe(
      'https://open.spotify.com/embed/episode/3WjzoEn19X2rCimimh9C5N',
    );
    expect(embedSrc({ provider: 'vimeo', id: '123456789', kind: 'video' })).toBe(
      'https://player.vimeo.com/video/123456789?dnt=1',
    );
  });
});

describe('youtubeThumbnail', () => {
  test('points at the static thumbnail of the video', () => {
    expect(youtubeThumbnail('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });
});

describe('suggestionMessage', () => {
  test('carries the link, the reason and the name in the visitor language', () => {
    expect(
      suggestionMessage({
        locale: 'es',
        url: ' https://youtu.be/dQw4w9WgXcQ ',
        reason: 'Explica muy bien el AAD',
        name: 'Simón',
      }),
    ).toBe(
      [
        'Hola Eca, te sugiero algo para la sección Aprender de Bendike:',
        'https://youtu.be/dQw4w9WgXcQ',
        'Por qué: Explica muy bien el AAD',
        'De: Simón',
      ].join('\n'),
    );
  });

  test('leaves out the optional lines when they are blank', () => {
    expect(suggestionMessage({ locale: 'en', url: 'https://vimeo.com/123456789', reason: '  ', name: '' })).toBe(
      'Hi Eca, a suggestion for the Learn section of Bendike:\nhttps://vimeo.com/123456789',
    );
  });
});
