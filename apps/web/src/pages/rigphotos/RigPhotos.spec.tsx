import { RIG_PHOTO_MAX_PER_RIG, type MaintenanceEntryView, type RigPhotoView } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { entryView } from '../gear/fixtures';
import * as api from './rig-photos-api';
import { RigPhotos } from './RigPhotos';

jest.mock('./rig-photos-api');
jest.mock('./AuthedImage', () => ({
  AuthedImage: ({ alt, photoId }: { alt: string; photoId: string }) => <img alt={alt} data-photo={photoId} />,
}));
jest.mock('./resize-image', () => ({ resizeImage: (file: File) => Promise.resolve(file) }));

const mocked = jest.mocked(api);

function photo(overrides: Partial<RigPhotoView> = {}): RigPhotoView {
  return {
    id: 'p1',
    rigId: 'tandem-1',
    entryId: null,
    fileName: 'front.jpg',
    sizeBytes: 1000,
    caption: 'Front view',
    addedById: 'rigger-1',
    addedByName: 'Eca Rigger',
    createdAt: '2026-09-12T10:00:00.000Z',
    ...overrides,
  };
}

const entries: MaintenanceEntryView[] = [
  entryView({ id: 'e1', gearItemId: 'reserve-1', kind: 'repack', performedOn: '2026-09-10' }),
  entryView({ id: 'e2', gearItemId: 'aad-1', kind: 'aad_service', performedOn: '2026-08-01' }),
  entryView({
    id: 'e3',
    gearItemId: 'aad-1',
    kind: 'battery',
    performedOn: '2026-07-01',
    voidedAt: '2026-07-02T00:00:00.000Z',
  }),
];
const itemLabels = { 'reserve-1': 'Reserve PD VR360', 'aad-1': 'AAD Vigil 4' };

function renderGallery(photos: RigPhotoView[], overrides: Partial<Parameters<typeof RigPhotos>[0]> = {}) {
  const onChanged = jest.fn();
  render(
    <MemoryRouter>
      <RigPhotos
        token="token-1"
        rigId="tandem-1"
        photos={photos}
        entries={entries}
        itemLabels={itemLabels}
        canRemove={() => true}
        onChanged={onChanged}
        {...overrides}
      />
    </MemoryRouter>,
  );
  return { onChanged };
}

describe('RigPhotos', () => {
  test('shows each photo with its caption, who added it and when, and how many the rig holds', () => {
    renderGallery([
      photo(),
      photo({ id: 'p2', caption: '', addedByName: 'Ana', createdAt: '2026-09-01T10:00:00.000Z' }),
    ]);

    const gallery = screen.getByRole('region', { name: 'Photos' });
    expect(within(gallery).getByText('Front view')).toBeInTheDocument();
    expect(within(gallery).getByText(/Eca Rigger · 2026-09-12/)).toBeInTheDocument();
    expect(within(gallery).getByText(/Ana · 2026-09-01/)).toBeInTheDocument();
    expect(within(gallery).getByText(`2 of ${RIG_PHOTO_MAX_PER_RIG} photos`)).toBeInTheDocument();
  });

  test('says there are no photos yet, and still offers to add one', () => {
    renderGallery([]);

    expect(screen.getByText(/No photos yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add photo' })).toBeEnabled();
  });

  test('a full rig cannot take another photo', () => {
    renderGallery(Array.from({ length: RIG_PHOTO_MAX_PER_RIG }, (_, i) => photo({ id: `p${i}` })));

    expect(screen.getByRole('button', { name: 'Add photo' })).toBeDisabled();
    expect(screen.getByText(/holds 20 photos/)).toBeInTheDocument();
  });

  describe('adding', () => {
    const jpeg = () => new File(['jpeg'], 'IMG_1.jpg', { type: 'image/jpeg' });

    async function openDialog() {
      const user = userEvent.setup();
      const { onChanged } = renderGallery([]);
      await user.click(screen.getByRole('button', { name: 'Add photo' }));
      return { user, onChanged, dialog: within(screen.getByRole('dialog')) };
    }

    test('uploads the chosen photo with its caption and the work it is about', async () => {
      mocked.uploadPhoto.mockResolvedValue(photo());
      const { user, onChanged, dialog } = await openDialog();

      await user.upload(dialog.getByLabelText('Choose photo'), jpeg());
      await user.type(dialog.getByLabelText('Caption'), 'Reserve packed');
      await user.click(dialog.getByRole('combobox', { name: 'Related work' }));
      await user.click(screen.getByRole('option', { name: /2026-09-10 · Repack · Reserve PD VR360/ }));
      await user.click(dialog.getByRole('button', { name: 'Upload' }));

      await waitFor(() =>
        expect(mocked.uploadPhoto).toHaveBeenCalledWith('token-1', expect.any(File), {
          rigId: 'tandem-1',
          caption: 'Reserve packed',
          entryId: 'e1',
        }),
      );
      await waitFor(() => expect(onChanged).toHaveBeenCalled());
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('offers only work that is not void', async () => {
      const { user, dialog } = await openDialog();

      await user.click(dialog.getByRole('combobox', { name: 'Related work' }));

      expect(screen.getByRole('option', { name: /AAD service/ })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /Battery/ })).not.toBeInTheDocument();
    });

    test('needs a photo before it uploads', async () => {
      const { user, dialog } = await openDialog();

      await user.click(dialog.getByRole('button', { name: 'Upload' }));

      expect(await dialog.findByText('Choose a photo')).toBeInTheDocument();
      expect(mocked.uploadPhoto).not.toHaveBeenCalled();
    });

    test('shows what the API says when it refuses', async () => {
      mocked.uploadPhoto.mockRejectedValue(new Error('A rig can hold 20 photos; remove one first'));
      const { user, dialog } = await openDialog();

      await user.upload(dialog.getByLabelText('Choose photo'), jpeg());
      await user.click(dialog.getByRole('button', { name: 'Upload' }));

      expect(await dialog.findByText('A rig can hold 20 photos; remove one first')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('viewing and removing', () => {
    test('a photo opens larger with its caption, author and the work it is about', async () => {
      const user = userEvent.setup();
      renderGallery([photo({ entryId: 'e1' })]);

      await user.click(screen.getByRole('button', { name: 'Open photo: Front view' }));

      const dialog = within(screen.getByRole('dialog'));
      expect(dialog.getByText('Front view')).toBeInTheDocument();
      expect(dialog.getByText('Added by Eca Rigger on 2026-09-12')).toBeInTheDocument();
      expect(dialog.getByText(/About: 2026-09-10 · Repack · Reserve PD VR360/)).toBeInTheDocument();
    });

    test('removing asks first, then removes and refreshes', async () => {
      const user = userEvent.setup();
      mocked.removePhoto.mockResolvedValue();
      const { onChanged } = renderGallery([photo()]);
      await user.click(screen.getByRole('button', { name: 'Open photo: Front view' }));

      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove photo' }));
      expect(mocked.removePhoto).not.toHaveBeenCalled();
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes, remove it' }));

      await waitFor(() => expect(mocked.removePhoto).toHaveBeenCalledWith('token-1', 'p1'));
      await waitFor(() => expect(onChanged).toHaveBeenCalled());
    });

    test('no Remove button for someone who may not remove it', async () => {
      const user = userEvent.setup();
      renderGallery([photo()], { canRemove: () => false });

      await user.click(screen.getByRole('button', { name: 'Open photo: Front view' }));

      expect(
        within(screen.getByRole('dialog')).queryByRole('button', { name: 'Remove photo' }),
      ).not.toBeInTheDocument();
    });

    test('shows why a removal failed', async () => {
      const user = userEvent.setup();
      mocked.removePhoto.mockRejectedValue(new Error('Only the person who added the photo can remove it'));
      renderGallery([photo()]);
      await user.click(screen.getByRole('button', { name: 'Open photo: Front view' }));

      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove photo' }));
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes, remove it' }));

      expect(await screen.findByText('Only the person who added the photo can remove it')).toBeInTheDocument();
    });
  });
});
