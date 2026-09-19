import { Role, type RiggerLinkView } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as api from './links-api';
import { LinksPage } from './LinksPage';

jest.mock('../../auth/use-auth');
jest.mock('./links-api');

const mocked = jest.mocked(api);

function link(overrides: Partial<RiggerLinkView> & { name: string }): RiggerLinkView {
  const { name, ...rest } = overrides;
  return {
    id: `link-${name}`,
    status: 'active',
    direction: 'outgoing',
    viewerIsOwner: true,
    counterpart: {
      id: `id-${name}`,
      displayName: name,
      role: Role.Rigger,
      email: `${name.toLowerCase()}@bendike.example`,
      phone: '+5493415550003',
    },
    createdAt: '2026-09-19T00:00:00.000Z',
    confirmedAt: '2026-09-19T00:00:00.000Z',
    ...rest,
  };
}

function renderPage(role: Role) {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'me',
      email: 'me@b.c',
      displayName: 'Me',
      role,
      authMethods: ['password'],
      phone: null,
      locale: 'es',
      createdAt: '2026-09-19T00:00:00.000Z',
    },
    token: 'token-1',
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
  });
  render(
    <MemoryRouter>
      <LinksPage />
    </MemoryRouter>,
  );
}

describe('LinksPage as an owner', () => {
  beforeEach(() => {
    mocked.listLinks.mockResolvedValue([
      link({ name: 'Eca' }),
      link({
        name: 'Lucia',
        status: 'pending',
        direction: 'incoming',
        counterpart: { id: 'l', displayName: 'Lucia', role: Role.Rigger, email: null, phone: null },
      }),
      link({
        name: 'Marcos',
        status: 'pending',
        direction: 'outgoing',
        counterpart: { id: 'm', displayName: 'Marcos', role: Role.Rigger, email: null, phone: null },
      }),
    ]);
    mocked.searchRiggers.mockResolvedValue([{ id: 'r9', displayName: 'Pablo Rigger' }]);
  });

  test('shows the rigger who looks after my gear with the contact details', async () => {
    renderPage(Role.Dropzone);

    expect(await screen.findByRole('heading', { name: 'My riggers' })).toBeInTheDocument();
    await screen.findByText('Eca');
    const active = screen.getByRole('region', { name: 'Looking after your gear' });
    expect(within(active).getByText('Eca')).toBeInTheDocument();
    expect(within(active).getByText(/\+5493415550003/)).toBeInTheDocument();
    expect(within(active).getByRole('button', { name: 'End link with Eca' })).toBeInTheDocument();
  });

  test('a request from a rigger can be confirmed or declined', async () => {
    const user = userEvent.setup();
    mocked.confirmLink.mockResolvedValue(link({ name: 'Lucia' }));
    renderPage(Role.Dropzone);
    const incoming = await screen.findByRole('region', { name: 'Waiting for your answer' });

    await user.click(within(incoming).getByRole('button', { name: 'Confirm Lucia' }));

    await waitFor(() => expect(mocked.confirmLink).toHaveBeenCalledWith('token-1', 'link-Lucia'));
    await waitFor(() => expect(mocked.listLinks).toHaveBeenCalledTimes(2));
  });

  test('a request I made can be cancelled', async () => {
    const user = userEvent.setup();
    mocked.endLink.mockResolvedValue(link({ name: 'Marcos', status: 'ended' }));
    renderPage(Role.User);
    const waiting = await screen.findByRole('region', { name: 'Waiting for the other side' });

    await user.click(within(waiting).getByRole('button', { name: 'Cancel request to Marcos' }));

    await waitFor(() => expect(mocked.endLink).toHaveBeenCalledWith('token-1', 'link-Marcos'));
  });

  test('finds a rigger by name and asks them', async () => {
    const user = userEvent.setup();
    mocked.createLink.mockResolvedValue(link({ name: 'Pablo Rigger', status: 'pending' }));
    renderPage(Role.User);
    await screen.findByRole('heading', { name: 'My riggers' });

    await user.type(screen.getByRole('textbox', { name: 'Find a rigger by name' }), 'pab');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: 'Ask Pablo Rigger' }));

    expect(mocked.searchRiggers).toHaveBeenCalledWith('token-1', 'pab');
    await waitFor(() => expect(mocked.createLink).toHaveBeenCalledWith('token-1', { riggerId: 'r9' }));
  });
});

describe('LinksPage as a rigger', () => {
  const owner = (name: string, extra: Partial<RiggerLinkView> = {}) =>
    link({
      name,
      viewerIsOwner: false,
      counterpart: {
        id: `o-${name}`,
        displayName: name,
        role: Role.Dropzone,
        email: 'dz@bendike.example',
        phone: '+5493415550002',
      },
      ...extra,
    });

  beforeEach(() => {
    mocked.listLinks.mockResolvedValue([owner('Salta en Rosario')]);
  });

  test('is titled customers and dropzones and lists them with their contact details', async () => {
    renderPage(Role.Rigger);

    expect(await screen.findByRole('heading', { name: 'Customers and dropzones' })).toBeInTheDocument();
    await screen.findByText('Salta en Rosario');
    const active = screen.getByRole('region', { name: 'You look after' });
    expect(within(active).getByText('Salta en Rosario')).toBeInTheDocument();
    expect(within(active).getByText(/dz@bendike.example/)).toBeInTheDocument();
  });

  test('adds an owner by email', async () => {
    const user = userEvent.setup();
    mocked.createLink.mockResolvedValue(owner('Ana', { status: 'pending' }));
    renderPage(Role.Rigger);
    await screen.findByRole('heading', { name: 'Customers and dropzones' });

    await user.type(screen.getByLabelText('Email or WhatsApp phone'), 'ana@bendike.example');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(mocked.createLink).toHaveBeenCalledWith('token-1', { ownerEmail: 'ana@bendike.example' }),
    );
  });

  test('a phone number is sent as a phone', async () => {
    const user = userEvent.setup();
    mocked.createLink.mockResolvedValue(owner('Ana', { status: 'pending' }));
    renderPage(Role.Rigger);
    await screen.findByRole('heading', { name: 'Customers and dropzones' });

    await user.type(screen.getByLabelText('Email or WhatsApp phone'), '+54 9 341 555 0001');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(mocked.createLink).toHaveBeenCalledWith('token-1', { ownerPhone: '+54 9 341 555 0001' }),
    );
  });

  test('says the person must create an account first when nobody matches', async () => {
    const user = userEvent.setup();
    mocked.createLink.mockRejectedValue(
      new Error('No Bendike account matches that email or phone. Ask them to create an account first.'),
    );
    renderPage(Role.Rigger);
    await screen.findByRole('heading', { name: 'Customers and dropzones' });

    await user.type(screen.getByLabelText('Email or WhatsApp phone'), 'nobody@x.example');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText(/create an account first/)).toBeInTheDocument();
  });
});
