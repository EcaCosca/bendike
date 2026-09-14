import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as authApi from '../../../auth/auth-api';
import { SOCIAL_LINKS } from '../../../components/site/site-content';
import { ABOUT_ASSETS, CHAPTERS, CTA_LABEL, LOGBOOK, TITLE } from './about-story-content';
import { AboutStoryPage } from './AboutStoryPage';

jest.mock('../scrollcraft/scrollcraft.js', () => ({}));
jest.mock('../../../auth/auth-api');

const mockedApi = jest.mocked(authApi);

describe('AboutStoryPage', () => {
  beforeEach(() => {
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

  test('carries the father line and the origin of the name', () => {
    expect(screen.getByText(/Benjamin, and Enrique, who we call Ike/)).toBeInTheDocument();
    expect(screen.getByText(/safer sport than the one that received me/)).toBeInTheDocument();
    expect(document.querySelector('.as-sons__portrait')).toHaveAttribute('data-sc-reveal', 'iris');
  });

  test('counts only real figures', () => {
    const counters = Array.from(document.querySelectorAll('[data-sc-count]')).map((el) =>
      el.getAttribute('data-sc-count'),
    );

    expect(counters).toEqual(['0 350', '0 14', '0 100']);
  });

  test('keeps the full logbook in the margin with every entry as a jump link', () => {
    const folio = screen.getByRole('complementary', { name: 'Logbook' });

    expect(within(folio).getAllByRole('listitem', { hidden: true })).toHaveLength(LOGBOOK.length);
    expect(within(folio).getByText(`1 / ${LOGBOOK.length}`)).toBeInTheDocument();
    expect(within(folio).getByText('ECPE, University of Michigan')).toBeInTheDocument();
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
