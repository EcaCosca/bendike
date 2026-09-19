import { Role } from '@bendike/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import { rigDetail } from './fixtures';
import * as api from './gear-api';
import { RigLabelPage } from './RigLabelPage';

jest.mock('../../auth/use-auth');
jest.mock('./gear-api');
const mockedToString = jest.fn();
jest.mock('qrcode', () => ({
  __esModule: true,
  default: { toString: (...args: unknown[]) => mockedToString(...args) },
}));

const mocked = jest.mocked(api);

function renderPage() {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'u1',
      email: 'a@b.c',
      displayName: 'Salta',
      role: Role.Dropzone,
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
    <MemoryRouter initialEntries={['/app/gear/micro-3/label']}>
      <Routes>
        <Route path="/app/gear/:rigId/label" element={<RigLabelPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RigLabelPage', () => {
  beforeEach(() => {
    mocked.getRig.mockResolvedValue(rigDetail('Micro 3', { id: 'micro-3' }));
    mockedToString.mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  });

  test('shows the rig name and a QR code that opens the rig page', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Micro 3' })).toBeInTheDocument();
    const image = await screen.findByRole('img', { name: 'QR code for Micro 3' });
    expect(image.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
    expect(mockedToString).toHaveBeenCalledWith(
      `${window.location.origin}/app/gear/micro-3`,
      expect.objectContaining({ type: 'svg' }),
    );
  });

  test('offers to print the label', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: 'Print label' })).toBeInTheDocument();
  });

  test('a rig that is not available says so', async () => {
    mocked.getRig.mockRejectedValue(new Error('Rig not found'));
    renderPage();

    expect(await screen.findByText(/not available/i)).toBeInTheDocument();
  });
});
