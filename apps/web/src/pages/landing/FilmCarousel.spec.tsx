import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { LearnItemSummary } from '@bendike/shared';
import { listFilms } from '../learn/learn-api';
import { FilmCarousel } from './FilmCarousel';
import { FILMS_HEADING } from './landing-content';

jest.mock('../learn/learn-api', () => ({ listFilms: jest.fn() }));
const listFilmsMock = listFilms as jest.MockedFunction<typeof listFilms>;

function film(id: string, title: string): LearnItemSummary {
  return {
    id,
    slug: `sqtv-${id}`,
    format: 'film',
    title: { en: title, es: `${title} es`, pt: `${title} pt` },
    summary: { en: `${title} caption`, es: 'es', pt: 'pt' },
    author: null,
    sourceName: 'Squirrel TV',
    url: `https://www.youtube.com/watch?v=${id}`,
    embed: { provider: 'youtube', id, kind: 'video' },
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    contentLanguage: 'en',
    topics: [],
    level: 'all',
    durationMinutes: 3,
    publishedAt: null,
    buyUrl: null,
    affiliate: false,
    position: 0,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  } as unknown as LearnItemSummary;
}

function renderCarousel() {
  return render(
    <MemoryRouter>
      <FilmCarousel />
    </MemoryRouter>,
  );
}

describe('FilmCarousel', () => {
  beforeEach(() => {
    listFilmsMock.mockReset();
  });

  test('shows each film as a card linking out to YouTube', async () => {
    listFilmsMock.mockResolvedValue([film('aaa', 'Baffin Island BASE'), film('bbb', 'Will Mitchell jumps the Y')]);

    renderCarousel();

    expect(await screen.findByRole('heading', { name: FILMS_HEADING })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Baffin Island BASE/ });
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=aaa');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  test('renders no iframe, so there is nothing for the consent gate to hold back', async () => {
    listFilmsMock.mockResolvedValue([film('aaa', 'Slovenia')]);

    const { container } = renderCarousel();

    await screen.findByRole('heading', { name: FILMS_HEADING });
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://i.ytimg.com/vi/aaa/hqdefault.jpg');
  });

  test('does not render at all when there are no films', async () => {
    listFilmsMock.mockResolvedValue([]);

    const { container } = renderCarousel();

    await waitFor(() => {
      expect(listFilmsMock).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  test('stays silent when the films cannot be fetched', async () => {
    listFilmsMock.mockRejectedValue(new Error('offline'));

    const { container } = renderCarousel();

    await waitFor(() => {
      expect(listFilmsMock).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  test('plays a self-hosted clip behind the strip, muted and looping, never an embed', async () => {
    listFilmsMock.mockResolvedValue([film('aaa', 'Baffin Island BASE')]);

    const { container } = renderCarousel();

    await screen.findByRole('heading', { name: FILMS_HEADING });
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    // React sets these as properties, not attributes.
    expect((video as HTMLVideoElement).muted).toBe(true);
    expect((video as HTMLVideoElement).loop).toBe(true);
    expect(container.querySelectorAll('source')[1]).toHaveAttribute(
      'src',
      expect.stringMatching(/^\/about\/vig\/.+\.mp4$/),
    );
    expect(container.querySelector('iframe')).toBeNull();
  });

  test('falls back to a still when the viewer prefers reduced motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    listFilmsMock.mockResolvedValue([film('aaa', 'Slovenia')]);

    const { container } = renderCarousel();

    await screen.findByRole('heading', { name: FILMS_HEADING });
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img[src^="/about/vig/"]')).not.toBeNull();
    window.matchMedia = original;
  });

  test('shows at most eighteen cards however many films there are', async () => {
    listFilmsMock.mockResolvedValue(Array.from({ length: 67 }, (_, index) => film(`id${index}`, `Film ${index}`)));

    renderCarousel();

    await screen.findByRole('heading', { name: FILMS_HEADING });
    expect(screen.getAllByRole('link')).toHaveLength(18);
  });
});
