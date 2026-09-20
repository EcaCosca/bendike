import { Role } from '@bendike/shared';
import { render, screen, waitFor } from '@testing-library/react';
import * as useAuthModule from '../../auth/use-auth';
import { AuthedImage } from './AuthedImage';
import * as api from './rig-photos-api';

jest.mock('../../auth/use-auth');
jest.mock('./rig-photos-api');

const mocked = jest.mocked(api);

function signIn() {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'u',
      email: 'a@b.c',
      displayName: 'A',
      role: Role.User,
      authMethods: ['password'],
      phone: null,
      locale: 'es',
      country: null,
      createdAt: '2026-09-19T00:00:00.000Z',
    },
    token: 'token-1',
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
  });
}

describe('AuthedImage', () => {
  beforeEach(() => {
    signIn();
    URL.createObjectURL = jest.fn(() => 'blob:photo');
  });

  test('loads the photo with the token and shows it', async () => {
    mocked.fetchPhotoBlob.mockResolvedValue(new Blob(['x'], { type: 'image/jpeg' }));
    render(<AuthedImage photoId="photo-a" alt="Front view" />);

    const image = await screen.findByRole('img', { name: 'Front view' });
    expect(image).toHaveAttribute('src', 'blob:photo');
    expect(mocked.fetchPhotoBlob).toHaveBeenCalledWith('token-1', 'photo-a');
  });

  test('fetches a photo once however many times it is shown', async () => {
    mocked.fetchPhotoBlob.mockResolvedValue(new Blob(['x'], { type: 'image/jpeg' }));
    render(
      <>
        <AuthedImage photoId="photo-b" alt="One" />
        <AuthedImage photoId="photo-b" alt="Two" />
      </>,
    );

    await screen.findByRole('img', { name: 'One' });
    await screen.findByRole('img', { name: 'Two' });
    expect(mocked.fetchPhotoBlob).toHaveBeenCalledTimes(1);
  });

  test('says so when the photo cannot be loaded', async () => {
    mocked.fetchPhotoBlob.mockRejectedValue(new Error('gone'));
    render(<AuthedImage photoId="photo-c" alt="Missing" />);

    await waitFor(() => expect(screen.getByText('Photo unavailable')).toBeInTheDocument());
  });
});
