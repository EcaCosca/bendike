import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as authApi from '../../../auth/auth-api';
import { SOCIAL_LINKS } from '../../../components/site/site-content';
import { ABOUT_ASSETS, CAREER, CHAPTERS, CTA_LABEL, TITLE } from './about-story-content';
import { AboutStoryPage } from './AboutStoryPage';

jest.mock('../scrollcraft/scrollcraft.js', () => ({}));
jest.mock('../../../auth/auth-api');

const mockedApi = jest.mocked(authApi);

describe('AboutStoryPage', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: false, headers: new Headers() });
    Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true, configurable: true });
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutStoryPage />
      </MemoryRouter>,
    );
  });

  test('opens on a media-free title page with a single H1 carrying the four words', () => {
    const headings = screen.getAllByRole('heading', { level: 1 });

    expect(headings).toHaveLength(1);
    for (const word of TITLE.words) {
      expect(headings[0]).toHaveTextContent(word);
    }
    expect(screen.getByText(TITLE.place)).toBeInTheDocument();
  });

  test('spends the only clip on the wingsuit flight', () => {
    const video = screen.getByLabelText(CHAPTERS.air.caption);

    expect(video.tagName).toBe('VIDEO');
    expect(video).toHaveAttribute('data-sc-scrub');
    expect(video).toHaveAttribute('data-sc-src', ABOUT_ASSETS.flight);
    expect(video).toHaveAttribute('data-sc-src-mobile', ABOUT_ASSETS.flightMobile);
    expect(document.querySelectorAll('video[data-sc-scrub]')).toHaveLength(1);
    expect(document.querySelector('[data-sc-act="scrub"]')).toHaveAttribute('data-sc-span', '3.6');
  });

  test('asks for the FlySight track and shows no readout and no side panel without it', () => {
    expect(fetchMock).toHaveBeenCalledWith(ABOUT_ASSETS.flightTrack, expect.anything());
    expect(screen.queryByLabelText(CHAPTERS.air.readout.title)).not.toBeInTheDocument();
    expect(document.querySelector('.as-log')).toBeNull();
  });

  test('tells the story in six chapters after the title', () => {
    for (const chapter of [
      CHAPTERS.preparation,
      CHAPTERS.loft,
      CHAPTERS.airAndCode,
      CHAPTERS.sons,
      CHAPTERS.colophon,
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: chapter.heading })).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { level: 2, name: CHAPTERS.air.lines[0] })).toBeInTheDocument();
  });

  test('reveals the eight preparation photographs with sequential windows', () => {
    const reveals = Array.from(document.querySelectorAll('.as-montage [data-sc-reveal-at]'));

    expect(reveals).toHaveLength(8);
    const starts = reveals.map((el) => Number(el.getAttribute('data-sc-reveal-at')?.split(' ')[0]));
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i]).toBeGreaterThan(starts[i - 1] ?? 0);
    }
  });

  test('carries the origin of the name and the father line in Eca’s words', () => {
    expect(screen.getByText(/At home they are Benja and Ike\. Ben and Ike: Bendike\./)).toBeInTheDocument();
    expect(screen.getByText(/improving the safety of the community as a whole/)).toBeInTheDocument();
    expect(document.querySelector('.as-sons__portrait')).toHaveAttribute('data-sc-reveal', 'iris');
  });

  test('counts only real figures', () => {
    const counters = Array.from(document.querySelectorAll('[data-sc-count]')).map((el) =>
      el.getAttribute('data-sc-count'),
    );

    expect(counters).toEqual(['0 350', '0 14', '0 100']);
  });

  test('lists every licence in the loft and again with the career in the colophon', () => {
    for (const credential of CHAPTERS.loft.credentials) {
      expect(screen.getAllByText(credential.text)).toHaveLength(2);
    }
    for (const entry of CAREER) {
      expect(screen.getByText(entry.text)).toBeInTheDocument();
    }
  });

  test('resolves on the colophon with the CTA as running text and every link out', () => {
    expect(screen.getByRole('link', { name: CTA_LABEL })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    for (const link of SOCIAL_LINKS) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
    }
  });

  test('renders without calling the API', () => {
    const calls = Object.values(mockedApi).filter((value) => jest.isMockFunction(value));

    expect(calls).not.toHaveLength(0);
    for (const call of calls) {
      expect(call).not.toHaveBeenCalled();
    }
  });
});
