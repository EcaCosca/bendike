import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as api from './work-api';
import { DigestSwitch } from './DigestSwitch';

jest.mock('./work-api');

const mocked = jest.mocked(api);

describe('DigestSwitch', () => {
  test('is on by default for a rigger who never chose', async () => {
    mocked.getRiggerSettings.mockResolvedValue({ digestEnabled: true });
    render(<DigestSwitch token="token-1" />);

    expect(await screen.findByRole('switch', { name: 'Daily digest email' })).toBeChecked();
  });

  test('turning it off saves the choice', async () => {
    const user = userEvent.setup();
    mocked.getRiggerSettings.mockResolvedValue({ digestEnabled: true });
    mocked.updateRiggerSettings.mockResolvedValue({ digestEnabled: false });
    render(<DigestSwitch token="token-1" />);

    await user.click(await screen.findByRole('switch', { name: 'Daily digest email' }));

    await waitFor(() => expect(mocked.updateRiggerSettings).toHaveBeenCalledWith('token-1', { digestEnabled: false }));
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Daily digest email' })).not.toBeChecked());
  });

  test('keeps the old choice and shows the error when saving fails', async () => {
    const user = userEvent.setup();
    mocked.getRiggerSettings.mockResolvedValue({ digestEnabled: true });
    mocked.updateRiggerSettings.mockRejectedValue(new Error('Could not save'));
    render(<DigestSwitch token="token-1" />);

    await user.click(await screen.findByRole('switch', { name: 'Daily digest email' }));

    expect(await screen.findByText('Could not save')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Daily digest email' })).toBeChecked();
  });
});
