import { Role, type GearModelView } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as api from './gear-api';
import { GearModelsPage } from './GearModelsPage';

jest.mock('../../auth/use-auth');
jest.mock('./gear-api');

const mocked = jest.mocked(api);

const vigil: GearModelView = {
  id: 'm1',
  kind: 'aad',
  manufacturer: 'Vigil',
  model: 'Cuatro',
  repackCycleDays: null,
  serviceIntervalMonths: 120,
  batteryCycleMonths: null,
  lifeYears: 20,
  active: true,
};

function renderPage() {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'a',
      email: 'a@b.c',
      displayName: 'Eca',
      role: Role.Admin,
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
      <GearModelsPage />
    </MemoryRouter>,
  );
}

describe('GearModelsPage', () => {
  beforeEach(() => {
    mocked.listModels.mockResolvedValue([vigil]);
  });

  test('lists every model, active or not, with its rules', async () => {
    renderPage();

    const row = (await screen.findByText('Cuatro')).closest('tr') as HTMLElement;
    expect(mocked.listModels).toHaveBeenCalledWith('token-1', true);
    expect(within(row).getByText('Vigil')).toBeInTheDocument();
    expect(within(row).getByText('120 months')).toBeInTheDocument();
    expect(within(row).getByText('20 years')).toBeInTheDocument();
  });

  test('adds a model with only the rules that were filled in', async () => {
    const user = userEvent.setup();
    mocked.createModel.mockResolvedValue({
      ...vigil,
      id: 'm2',
      manufacturer: 'PD',
      model: 'VR360',
      kind: 'reserve',
      repackCycleDays: 180,
      serviceIntervalMonths: null,
      lifeYears: null,
    });
    renderPage();
    await screen.findByText('Cuatro');

    await user.click(screen.getByRole('button', { name: 'Add model' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.click(dialog.getByRole('combobox', { name: 'Kind' }));
    await user.click(screen.getByRole('option', { name: 'Reserve' }));
    await user.type(dialog.getByLabelText('Manufacturer'), 'PD');
    await user.type(dialog.getByLabelText('Model'), 'VR360');
    await user.type(dialog.getByLabelText(/Repack cycle/), '180');
    await user.click(dialog.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mocked.createModel).toHaveBeenCalledWith('token-1', {
        kind: 'reserve',
        manufacturer: 'PD',
        model: 'VR360',
        repackCycleDays: 180,
      }),
    );
    await waitFor(() => expect(mocked.listModels).toHaveBeenCalledTimes(2));
  });

  test('deactivates a model from the list', async () => {
    const user = userEvent.setup();
    mocked.updateModel.mockResolvedValue({ ...vigil, active: false });
    renderPage();
    await screen.findByText('Cuatro');

    await user.click(screen.getByRole('switch', { name: 'Active: Vigil Cuatro' }));

    await waitFor(() => expect(mocked.updateModel).toHaveBeenCalledWith('token-1', 'm1', { active: false }));
  });

  test('shows the error when saving fails', async () => {
    const user = userEvent.setup();
    mocked.createModel.mockRejectedValue(new Error('Vigil Cuatro already exists in the catalogue'));
    renderPage();
    await screen.findByText('Cuatro');

    await user.click(screen.getByRole('button', { name: 'Add model' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Manufacturer'), 'Vigil');
    await user.type(dialog.getByLabelText('Model'), 'Cuatro');
    await user.click(dialog.getByRole('button', { name: 'Save' }));

    expect(await dialog.findByText('Vigil Cuatro already exists in the catalogue')).toBeInTheDocument();
  });
});
