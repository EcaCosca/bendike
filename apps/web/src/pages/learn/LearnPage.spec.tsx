import type { LearnCollectionDetail, LearnItemSummary, Page } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '../../i18n/i18n';
import * as learnApi from './learn-api';
import { learnSummary } from './learn-fixtures';
import { LearnPage } from './LearnPage';

jest.mock('./learn-api');
jest.mock('../../components/site/SitePage', () => ({
  SitePage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const api = jest.mocked(learnApi);

function page(items: LearnItemSummary[], total = items.length): Page<LearnItemSummary> {
  return { items, page: 1, pageSize: 24, total };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderLearn(initialEntry = '/en/learn') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route path="/:locale/learn" element={<LearnPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LearnPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    api.listLearnItems.mockResolvedValue(
      page([
        learnSummary('vigil-cuatro-battery', { durationMinutes: 7, sourceName: 'Vigil' }),
        learnSummary('exit-point', { format: 'podcast', topics: ['safety_culture'], sourceName: 'Spotify' }),
      ]),
    );
    api.listLearnCollections.mockResolvedValue([]);
  });

  test('lists the items as cards with source, format, duration and language, linking to the item page', async () => {
    renderLearn();

    const card = await screen.findByRole('link', { name: /vigil cuatro battery/ });
    expect(card).toHaveAttribute('href', '/en/learn/vigil-cuatro-battery');
    expect(within(card).getByText('Video')).toBeInTheDocument();
    expect(within(card).getByText('7 min')).toBeInTheDocument();
    expect(within(card).getByText('English')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /exit point/ })).toBeInTheDocument();
    expect(api.listLearnItems).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en', page: 1, pageSize: 24 }));
  });

  test('a topic chip, a format select and the search box all write to the URL and re-query', async () => {
    const user = userEvent.setup();
    renderLearn();
    await screen.findByRole('link', { name: /vigil cuatro battery/ });

    await user.click(screen.getByRole('button', { name: 'AAD' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/en/learn?topic=aad');
    await waitFor(() => expect(api.listLearnItems).toHaveBeenLastCalledWith(expect.objectContaining({ topic: 'aad' })));

    await user.type(screen.getByRole('searchbox', { name: 'Search titles, authors and sources' }), 'battery{enter}');
    expect(screen.getByTestId('location')).toHaveTextContent('/en/learn?topic=aad&q=battery');
    await waitFor(() =>
      expect(api.listLearnItems).toHaveBeenLastCalledWith(expect.objectContaining({ topic: 'aad', q: 'battery' })),
    );
  });

  test('reads the filters from a shared URL and offers to clear them when nothing matches', async () => {
    const user = userEvent.setup();
    api.listLearnItems.mockResolvedValue(page([]));
    renderLearn('/en/learn?topic=canopy&type=book&level=rigger&lang=pt&page=2');

    expect(await screen.findByText('Nothing matches those filters yet.')).toBeInTheDocument();
    expect(api.listLearnItems).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'canopy', type: 'book', level: 'rigger', lang: 'pt', page: 2 }),
    );

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/en/learn');
  });

  test('shows the start-here collection above the results only when a topic is picked and one exists', async () => {
    const collection: LearnCollectionDetail = {
      id: 'c1',
      slug: 'first-aad',
      title: { en: 'Your first AAD', es: 'Tu primer AAD', pt: 'Seu primeiro AAD' },
      intro: { en: 'Three things to watch first.', es: 'Tres cosas.', pt: 'Três coisas.' },
      topic: 'aad',
      startHere: true,
      active: true,
      itemIds: ['id-vigil-cuatro-battery'],
      items: [learnSummary('vigil-cuatro-battery')],
    };
    api.listLearnCollections.mockResolvedValue([collection]);
    renderLearn('/en/learn');
    await screen.findByRole('link', { name: /exit point/ });
    expect(screen.queryByRole('region', { name: 'Start here' })).not.toBeInTheDocument();
    expect(api.listLearnCollections).not.toHaveBeenCalled();

    await i18n.changeLanguage('es');
    renderLearn('/es/learn?topic=aad');

    const strip = await screen.findByRole('region', { name: 'Empezá por acá' });
    expect(within(strip).getByRole('heading', { name: 'Tu primer AAD' })).toBeInTheDocument();
    expect(api.listLearnCollections).toHaveBeenCalledWith('aad');
  });

  test('the suggestion box opens WhatsApp to Eca with the link, and refuses a non-https link', async () => {
    const user = userEvent.setup();
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    await i18n.changeLanguage('es');
    renderLearn('/es/learn');
    await screen.findByRole('link', { name: /vigil cuatro battery/ });
    const box = screen.getByRole('form', { name: 'Sugerí algo' });

    await user.type(within(box).getByLabelText(/Enlace/), 'http://youtu.be/dQw4w9WgXcQ');
    await user.click(within(box).getByRole('button', { name: 'Enviar por WhatsApp' }));
    expect(within(box).getByText('Pegá un enlace completo que empiece con https://.')).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();

    await user.clear(within(box).getByLabelText(/Enlace/));
    await user.type(within(box).getByLabelText(/Enlace/), 'https://youtu.be/dQw4w9WgXcQ');
    await user.type(within(box).getByLabelText(/Por qué vale la pena/), 'Explica el AAD');
    await user.type(within(box).getByLabelText(/Tu nombre/), 'Simón');
    await user.click(within(box).getByRole('button', { name: 'Enviar por WhatsApp' }));

    expect(open).toHaveBeenCalledTimes(1);
    const url = new URL(open.mock.calls[0]?.[0] as string);
    expect(url.origin + url.pathname).toBe('https://wa.me/5493413955408');
    expect(url.searchParams.get('text')).toBe(
      'Hola Eca, te sugiero algo para la sección Aprender de Bendike:\nhttps://youtu.be/dQw4w9WgXcQ\nPor qué: Explica el AAD\nDe: Simón',
    );
    open.mockRestore();
  });

  test('carries the Amazon Associates disclosure once and shows an error when the API fails', async () => {
    api.listLearnItems.mockRejectedValue(new Error('boom'));
    renderLearn();

    expect(await screen.findByText('Could not load the learning material. Please try again.')).toBeInTheDocument();
    expect(screen.getAllByText('As an Amazon Associate, Bendike earns from qualifying purchases.')).toHaveLength(1);
  });
});
