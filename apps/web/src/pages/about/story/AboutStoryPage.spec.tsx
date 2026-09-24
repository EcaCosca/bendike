import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as authApi from '../../../auth/auth-api';
import * as useAuthModule from '../../../auth/use-auth';
import { SOCIAL_LINKS, WHATSAPP_LABEL } from '../../../components/site/site-content';
import { CAREER, CHAPTERS, CTA_LABEL, TITLE } from './about-story-content';
import { HERO_CLIP, PREP_CLIPS, VIGNETTES } from './vignette-content';
import { AboutStoryPage } from './AboutStoryPage';

jest.mock('../scrollcraft/scrollcraft.js', () => ({}));
jest.mock('../../../auth/auth-api');
jest.mock('../../../auth/use-auth');

const mockedApi = jest.mocked(authApi);
const mockedUseAuth = jest.mocked(useAuthModule.useAuth);

describe('AboutStoryPage', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      loginWithGoogle: jest.fn(),
      logout: jest.fn(),
    });
    fetchMock = jest.fn().mockResolvedValue({ ok: false, headers: new Headers() });
    Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true, configurable: true });
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutStoryPage />
      </MemoryRouter>,
    );
  });

  test('opens on a media-free title page whose H1 is the name, nickname in the middle', () => {
    const headings = screen.getAllByRole('heading', { level: 1 });

    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(`${TITLE.given} “${TITLE.nickname}” ${TITLE.family}`);
    for (const word of TITLE.words) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
    expect(screen.getByText(TITLE.creed)).toBeInTheDocument();
    expect(screen.getByText(TITLE.place)).toBeInTheDocument();
  });

  test('opens on a pinned clip that plays itself rather than scrubbing on scroll', () => {
    const video = screen.getByLabelText(HERO_CLIP.alt);

    expect(video.tagName).toBe('VIDEO');
    // Autoplaying, not scrubbed: a scroll-driven playhead freezes the moment the
    // reader stops, which reads as a broken player.
    expect(video).not.toHaveAttribute('data-sc-scrub');
    expect(video).toHaveAttribute('loop');
    // React assigns muted as a DOM property, never as an attribute.
    expect((video as HTMLVideoElement).muted).toBe(true);
    expect(document.querySelectorAll('video[data-sc-scrub]')).toHaveLength(0);
    expect(document.querySelector('[data-sc-act="pin"]')).toHaveAttribute('data-sc-span', '2.4');
  });

  test('carries the mark, and no copy, over the opening clip', () => {
    const stage = document.querySelector('[data-sc-stage]');
    expect(stage).not.toBeNull();
    expect(within(stage as HTMLElement).getByRole('img', { name: 'BENDIKE' })).toBeInTheDocument();
    expect(stage?.querySelectorAll('h1, h2, p')).toHaveLength(0);
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
  });

  test('shows every vignette as a poster until its tile is near the viewport', () => {
    // The montage plus the clips standing in for Preparation slots with no photo.
    const tiles = document.querySelectorAll('.as-vig');
    expect(tiles).toHaveLength(VIGNETTES.length + Object.keys(PREP_CLIPS).length);
    for (const item of VIGNETTES) {
      expect(screen.getByText(item.caption)).toBeInTheDocument();
    }
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
    // Matched loosely on purpose: this paragraph is Eca's and he rewords it. The
    // test guards that the name's origin is still told, not his punctuation.
    expect(screen.getByText(/Benja and Ike[^.]*Bendike/)).toBeInTheDocument();
    expect(screen.getByText(/improving the safety of the community as a whole/)).toBeInTheDocument();
    expect(document.querySelector('.as-sons__portrait')).toHaveAttribute('data-sc-reveal', 'iris');
  });

  test('shows the flying milestones instead of animated counters', () => {
    expect(document.querySelectorAll('[data-sc-count]')).toHaveLength(0);
    for (const milestone of CHAPTERS.airAndCode.milestones) {
      expect(screen.getByText(milestone.text)).toBeInTheDocument();
    }
  });

  test('lists every licence in the loft and again with the career in the colophon', () => {
    for (const credential of CHAPTERS.loft.credentials) {
      expect(screen.getAllByText(credential.text)).toHaveLength(2);
    }
    for (const entry of CAREER) {
      expect(screen.getByText(entry.text)).toBeInTheDocument();
    }
  });

  test('keeps the site navigation and the WhatsApp button like every public page', () => {
    const banner = screen.getByRole('banner');

    expect(within(banner).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(banner).getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
    expect(within(banner).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    const whatsapp = screen.getAllByRole('link', { name: WHATSAPP_LABEL });
    expect(whatsapp.length).toBeGreaterThanOrEqual(2);
    for (const link of whatsapp) {
      expect(link).toHaveAttribute('target', '_blank');
    }
  });

  test('resolves on the colophon with the CTA as running text and every link out', () => {
    expect(screen.getByRole('link', { name: CTA_LABEL })).toHaveAttribute('href', '/register');
    expect(screen.getAllByRole('link', { name: 'Log in' }).length).toBeGreaterThanOrEqual(2);
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
