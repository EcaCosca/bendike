import type { GearModelView, LearnCollectionSummary, LearnItemAdminDetail } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as gearApi from '../gear/gear-api';
import * as catalogApi from '../shop/catalog-api';
import * as adminApi from './learn-admin-api';
import { learnItem } from './learn-fixtures';
import { LearnAdminPage } from './LearnAdminPage';

jest.mock('../../auth/use-auth');
jest.mock('./learn-admin-api');
jest.mock('../shop/catalog-api');
jest.mock('../gear/gear-api');
jest.mock('../../components/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const admin = jest.mocked(adminApi);

function adminItem(slug: string, overrides: Partial<LearnItemAdminDetail> = {}): LearnItemAdminDetail {
  return { ...learnItem(slug), translationOverrides: {}, ...overrides };
}

const model: GearModelView = {
  id: 'model-cuatro',
  kind: 'aad',
  manufacturer: 'Vigil',
  model: 'Cuatro',
  repackCycleDays: null,
  serviceIntervalMonths: null,
  batteryCycleMonths: null,
  lifeYears: null,
  bulletinsUrl: null,
  active: true,
};

const collection: LearnCollectionSummary = {
  id: 'col-1',
  slug: 'first-aad',
  title: { en: 'Your first AAD', es: 'Tu primer AAD', pt: 'Seu primeiro AAD' },
  intro: { en: 'Start here.', es: 'Empezá acá.', pt: 'Comece aqui.' },
  topic: 'aad',
  startHere: true,
  active: true,
  itemIds: ['id-cuatro-battery'],
};

describe('LearnAdminPage', () => {
  beforeEach(() => {
    jest.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'eca', email: 'eca@bendike.local', displayName: 'Eca', role: 'admin' },
      token: 'tok',
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      loginWithGoogle: jest.fn(),
    } as never);
    admin.listAllLearnItems.mockResolvedValue([
      adminItem('cuatro-battery', {
        embed: { provider: 'youtube', id: 'dQw4w9WgXcQ', kind: 'video' },
        links: [{ kind: 'brand', targetId: 'brand-vigil' }],
      }),
      adminItem('exit-point', { format: 'podcast', active: false, buyUrl: 'https://amazon.com/x', affiliate: true }),
    ]);
    admin.listAllLearnCollections.mockResolvedValue([collection]);
    jest.mocked(catalogApi.listProducts).mockResolvedValue({ items: [], page: 1, pageSize: 48, total: 0 });
    jest
      .mocked(catalogApi.listBrands)
      .mockResolvedValue([
        { id: 'brand-vigil', slug: 'vigil', name: 'Vigil', websiteUrl: 'https://vigil.aero', active: true },
      ]);
    jest.mocked(gearApi.listModels).mockResolvedValue([model]);
  });

  function renderPage() {
    render(
      <MemoryRouter>
        <LearnAdminPage />
      </MemoryRouter>,
    );
  }

  test('lists every item, active or not, with its player, links and buy-link flag, and the collections', async () => {
    renderPage();

    await screen.findByRole('switch', { name: 'Active: cuatro battery' });
    const table = screen.getByRole('table', { name: 'Learn items' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('youtube')).toBeInTheDocument();
    expect(within(rows[0]!).getByRole('switch', { name: 'Active: cuatro battery' })).toBeChecked();
    expect(within(rows[1]!).getByRole('switch', { name: 'Active: exit point' })).not.toBeChecked();
    expect(within(rows[1]!).getByText('affiliate')).toBeInTheDocument();
    const collections = screen.getByRole('table', { name: 'Collections' });
    expect(within(collections).getByText('Your first AAD')).toBeInTheDocument();
    expect(within(collections).getByText('Yes')).toBeInTheDocument();
  });

  test('adds an item from a pasted link, showing the recognised player, and posts the fields', async () => {
    const user = userEvent.setup();
    admin.createLearnItem.mockImplementation((_token, body) =>
      Promise.resolve(adminItem(body.slug, { title: { en: body.title, es: body.title, pt: body.title } })),
    );
    renderPage();
    await screen.findByRole('switch', { name: 'Active: cuatro battery' });

    await user.click(screen.getByRole('button', { name: 'Add item' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Link \(https\)/), 'https://youtu.be/dQw4w9WgXcQ');
    expect(within(dialog).getByText(/YouTube video recognised: dQw4w9WgXcQ/)).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/^Title/), 'Changing the Cuatro battery');
    await user.type(within(dialog).getByLabelText(/^Summary/), 'Step by step.');
    await user.type(within(dialog).getByLabelText(/Source name/), 'Vigil');
    await user.click(within(dialog).getByLabelText(/Topics/));
    await user.click(screen.getByRole('option', { name: 'AAD' }));
    await user.click(screen.getByRole('option', { name: 'Gear care' }));
    await user.keyboard('{Escape}');
    await user.click(within(dialog).getByRole('button', { name: 'Add item' }));

    await waitFor(() => expect(admin.createLearnItem).toHaveBeenCalledTimes(1));
    expect(admin.createLearnItem).toHaveBeenCalledWith(
      'tok',
      expect.objectContaining({
        slug: 'changing-the-cuatro-battery',
        url: 'https://youtu.be/dQw4w9WgXcQ',
        format: 'video',
        title: 'Changing the Cuatro battery',
        summary: 'Step by step.',
        sourceName: 'Vigil',
        topics: ['aad', 'gear_care'],
        level: 'all',
        contentLanguage: 'en',
        affiliate: false,
        buyUrl: null,
      }),
    );
    expect(await screen.findByText('Changing the Cuatro battery')).toBeInTheDocument();
  });

  test('refuses a non-https link and an item without topics before calling the API', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('switch', { name: 'Active: cuatro battery' });

    await user.click(screen.getByRole('button', { name: 'Add item' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Link \(https\)/), 'http://squirrel.ws/learn');
    await user.type(within(dialog).getByLabelText(/^Title/), 'Squirrel Learn');
    await user.type(within(dialog).getByLabelText(/^Summary/), 'Pages.');
    await user.type(within(dialog).getByLabelText(/Source name/), 'Squirrel');
    await user.click(within(dialog).getByRole('button', { name: 'Add item' }));

    expect(within(dialog).getByText('The link must start with https://.')).toBeInTheDocument();
    expect(admin.createLearnItem).not.toHaveBeenCalled();
  });

  test('replaces the links of an item from the picker and deactivates an item with the switch', async () => {
    const user = userEvent.setup();
    admin.replaceLearnLinks.mockImplementation((_token, id, body) =>
      Promise.resolve(adminItem('cuatro-battery', { id, links: body.links })),
    );
    admin.updateLearnItem.mockImplementation((_token, id, body) =>
      Promise.resolve(adminItem('cuatro-battery', { id, active: body.active ?? true })),
    );
    renderPage();
    await screen.findByRole('switch', { name: 'Active: cuatro battery' });

    await user.click(screen.getByRole('button', { name: 'Links cuatro battery' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByLabelText(/Gear models/));
    await user.click(await screen.findByRole('option', { name: /Vigil Cuatro/ }));
    await user.keyboard('{Escape}');
    await user.click(within(dialog).getByRole('button', { name: 'Save links' }));

    await waitFor(() =>
      expect(admin.replaceLearnLinks).toHaveBeenCalledWith('tok', 'id-cuatro-battery', {
        links: [
          { kind: 'brand', targetId: 'brand-vigil' },
          { kind: 'gear_model', targetId: 'model-cuatro' },
        ],
      }),
    );

    await user.click(screen.getByRole('switch', { name: 'Active: cuatro battery' }));
    await waitFor(() =>
      expect(admin.updateLearnItem).toHaveBeenCalledWith('tok', 'id-cuatro-battery', { active: false }),
    );
  });

  test('creates a collection with ordered items and the start-here flag', async () => {
    const user = userEvent.setup();
    admin.createLearnCollection.mockImplementation((_token, body) =>
      Promise.resolve({
        id: 'col-2',
        slug: body.slug,
        title: { en: body.title, es: body.title, pt: body.title },
        intro: { en: body.intro, es: body.intro, pt: body.intro },
        topic: body.topic,
        startHere: body.startHere ?? false,
        active: true,
        itemIds: body.itemIds,
      }),
    );
    renderPage();
    await screen.findByRole('switch', { name: 'Active: cuatro battery' });
    await screen.findByText('Your first AAD');

    await user.click(screen.getByRole('button', { name: 'Add collection' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^Title/), 'Podcasts to start with');
    await user.type(within(dialog).getByLabelText(/^Intro/), 'Listen on the way to the DZ.');
    await user.click(within(dialog).getByLabelText(/^Topic/));
    await user.click(screen.getByRole('option', { name: 'Safety culture' }));
    await user.click(within(dialog).getByLabelText(/Items, in order/));
    await user.click(screen.getByRole('option', { name: /exit point/ }));
    await user.keyboard('{Escape}');
    await user.click(within(dialog).getByRole('button', { name: 'Add collection' }));

    await waitFor(() =>
      expect(admin.createLearnCollection).toHaveBeenCalledWith('tok', {
        slug: 'podcasts-to-start-with',
        title: 'Podcasts to start with',
        intro: 'Listen on the way to the DZ.',
        topic: 'safety_culture',
        startHere: false,
        itemIds: ['id-exit-point'],
      }),
    );
    expect(await screen.findByText('Podcasts to start with')).toBeInTheDocument();
  });
});
