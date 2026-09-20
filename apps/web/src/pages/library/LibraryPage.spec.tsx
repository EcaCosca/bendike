import { Role, type GearModelView, type LibraryDocumentView } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as gearApi from '../gear/gear-api';
import * as api from './library-api';
import { LibraryPage } from './LibraryPage';

jest.mock('../../auth/use-auth');
jest.mock('../gear/gear-api');
jest.mock('./library-api');

const mocked = jest.mocked(api);

const sigma: GearModelView = {
  id: 'model-1',
  kind: 'container',
  manufacturer: 'UPT Vector',
  model: 'Sigma Tandem',
  repackCycleDays: null,
  serviceIntervalMonths: null,
  batteryCycleMonths: null,
  lifeYears: null,
  active: true,
};

function doc(overrides: Partial<LibraryDocumentView> = {}): LibraryDocumentView {
  return {
    id: 'doc-1',
    title: 'Sigma II Tandem owners manual',
    kind: 'manual',
    manufacturer: 'UPT Vector',
    modelId: 'model-1',
    modelName: 'Sigma Tandem',
    revision: 'Rev4',
    language: 'en',
    sourceUrl: 'https://uptvector.com/manual.pdf',
    fileName: 'Man013-Rev4.pdf',
    sizeBytes: 2 * 1024 * 1024,
    addedByName: 'Eca Rigger',
    createdAt: '2026-09-20T10:00:00.000Z',
    archivedAt: null,
    archiveReason: null,
    ...overrides,
  };
}

function renderPage(role: Role = Role.Rigger) {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'u1',
      email: 'r@b.c',
      displayName: 'Eca',
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
      <LibraryPage />
    </MemoryRouter>,
  );
}

describe('LibraryPage', () => {
  beforeEach(() => {
    mocked.listDocuments.mockResolvedValue({ documents: [doc()], total: 1 });
    jest.mocked(gearApi.listModels).mockResolvedValue([sigma]);
  });

  test('lists each document with its manufacturer, model, revision, language, size, date and author', async () => {
    renderPage();

    const row = (await screen.findByText('Sigma II Tandem owners manual')).closest('tr') as HTMLElement;
    expect(within(row).getByText('Manual')).toBeInTheDocument();
    expect(within(row).getByText('UPT Vector')).toBeInTheDocument();
    expect(within(row).getByText('Sigma Tandem')).toBeInTheDocument();
    expect(within(row).getByText('Rev4')).toBeInTheDocument();
    expect(within(row).getByText('en')).toBeInTheDocument();
    expect(within(row).getByText('2.0 MB')).toBeInTheDocument();
    expect(within(row).getByText('2026-09-20')).toBeInTheDocument();
    expect(within(row).getByText('Eca Rigger')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: 'Source' })).toHaveAttribute(
      'href',
      'https://uptvector.com/manual.pdf',
    );
    expect(within(row).getByRole('link', { name: 'Source' })).toHaveAttribute('rel', 'noopener noreferrer');
    expect(mocked.listDocuments).toHaveBeenCalledWith('token-1', { search: '', includeArchived: false, page: 1 });
  });

  test('says the Library is empty, and when a filter matches nothing', async () => {
    const user = userEvent.setup();
    mocked.listDocuments.mockResolvedValue({ documents: [], total: 0 });
    renderPage();

    expect(await screen.findByText(/The Library is empty/)).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'zzz');
    expect(await screen.findByText('No documents match these filters.')).toBeInTheDocument();
  });

  test('filters by kind and by the search text', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Sigma II Tandem owners manual');

    await user.click(screen.getByRole('combobox', { name: 'Kind' }));
    await user.click(screen.getByRole('option', { name: 'Service bulletin' }));
    await waitFor(() =>
      expect(mocked.listDocuments).toHaveBeenLastCalledWith('token-1', {
        kind: 'service_bulletin',
        search: '',
        includeArchived: false,
        page: 1,
      }),
    );

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'sigma');
    await waitFor(() =>
      expect(mocked.listDocuments).toHaveBeenLastCalledWith('token-1', {
        kind: 'service_bulletin',
        search: 'sigma',
        includeArchived: false,
        page: 1,
      }),
    );
  });

  test('pages through more than 25 documents', async () => {
    const user = userEvent.setup();
    mocked.listDocuments.mockResolvedValue({ documents: [doc()], total: 30 });
    renderPage();
    await screen.findByText('30 documents');

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));

    await waitFor(() =>
      expect(mocked.listDocuments).toHaveBeenLastCalledWith('token-1', {
        search: '',
        includeArchived: false,
        page: 2,
      }),
    );
  });

  test('downloading asks the API for the file with the token', async () => {
    const user = userEvent.setup();
    mocked.downloadDocument.mockResolvedValue();
    renderPage();
    await screen.findByText('Sigma II Tandem owners manual');

    await user.click(screen.getByRole('button', { name: 'Download' }));

    expect(mocked.downloadDocument).toHaveBeenCalledWith('token-1', expect.objectContaining({ id: 'doc-1' }));
  });

  test('a failed download shows the error', async () => {
    const user = userEvent.setup();
    mocked.downloadDocument.mockRejectedValue(new Error('The document storage is not reachable'));
    renderPage();
    await screen.findByText('Sigma II Tandem owners manual');

    await user.click(screen.getByRole('button', { name: 'Download' }));

    expect(await screen.findByText('The document storage is not reachable')).toBeInTheDocument();
  });

  test('shows the error when the Library cannot be loaded', async () => {
    mocked.listDocuments.mockRejectedValue(new Error('Boom'));
    renderPage();

    expect(await screen.findByText('Boom')).toBeInTheDocument();
  });

  describe('adding a document', () => {
    async function openDialog() {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('Sigma II Tandem owners manual');
      await user.click(screen.getByRole('button', { name: 'Add document' }));
      return { user, dialog: within(screen.getByRole('dialog')) };
    }

    const pdf = () => new File(['%PDF-1.7 body'], 'Man013 Rev4.pdf', { type: 'application/pdf' });

    test('uploads the PDF with its model, revision and source, then reloads the list', async () => {
      mocked.uploadDocument.mockResolvedValue(doc());
      const { user, dialog } = await openDialog();

      await user.upload(dialog.getByLabelText('Choose PDF'), pdf());
      expect(dialog.getByLabelText(/Title/)).toHaveValue('Man013 Rev4');
      await user.clear(dialog.getByLabelText(/Title/));
      await user.type(dialog.getByLabelText(/Title/), 'Sigma II Tandem owners manual');
      await user.click(dialog.getByRole('combobox', { name: 'Model' }));
      await user.click(screen.getByRole('option', { name: 'UPT Vector Sigma Tandem (Container)' }));
      await user.type(dialog.getByLabelText('Revision'), 'Rev4');
      await user.type(dialog.getByLabelText('Source link'), 'https://uptvector.com/manual.pdf');
      await user.click(dialog.getByRole('button', { name: 'Add document' }));

      await waitFor(() =>
        expect(mocked.uploadDocument).toHaveBeenCalledWith('token-1', expect.any(File), {
          title: 'Sigma II Tandem owners manual',
          kind: 'manual',
          modelId: 'model-1',
          revision: 'Rev4',
          language: '',
          sourceUrl: 'https://uptvector.com/manual.pdf',
        }),
      );
      await waitFor(() => expect(mocked.listDocuments).toHaveBeenCalledTimes(2));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('a document with no model needs a manufacturer', async () => {
      const { user, dialog } = await openDialog();

      await user.upload(dialog.getByLabelText('Choose PDF'), pdf());
      await user.click(dialog.getByRole('button', { name: 'Add document' }));

      expect(await dialog.findByText('Choose a model or say which manufacturer it is from')).toBeInTheDocument();
      expect(mocked.uploadDocument).not.toHaveBeenCalled();
    });

    test('refuses a source link that is not https, and asks for a file first', async () => {
      const { user, dialog } = await openDialog();

      await user.click(dialog.getByRole('button', { name: 'Add document' }));
      expect(await dialog.findByText('Choose a PDF file')).toBeInTheDocument();

      await user.upload(dialog.getByLabelText('Choose PDF'), pdf());
      await user.type(dialog.getByLabelText('Manufacturer'), 'UPT');
      await user.type(dialog.getByLabelText('Source link'), 'http://example.com/a.pdf');
      await user.click(dialog.getByRole('button', { name: 'Add document' }));

      expect(await dialog.findByText('The source link must start with https://')).toBeInTheDocument();
      expect(mocked.uploadDocument).not.toHaveBeenCalled();
    });

    test('shows what the API says when it refuses, such as a duplicate', async () => {
      mocked.uploadDocument.mockRejectedValue(new Error('This file is already in the Library as "Sigma manual"'));
      const { user, dialog } = await openDialog();

      await user.upload(dialog.getByLabelText('Choose PDF'), pdf());
      await user.type(dialog.getByLabelText('Manufacturer'), 'UPT');
      await user.click(dialog.getByRole('button', { name: 'Add document' }));

      expect(await dialog.findByText('This file is already in the Library as "Sigma manual"')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('archiving', () => {
    test('a rigger cannot archive and does not see archived documents', async () => {
      renderPage(Role.Rigger);
      await screen.findByText('Sigma II Tandem owners manual');

      expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'Show archived' })).not.toBeInTheDocument();
    });

    test('an admin archives with a reason and can list archived documents', async () => {
      const user = userEvent.setup();
      mocked.archiveDocument.mockResolvedValue(
        doc({ archivedAt: '2026-09-20T12:00:00.000Z', archiveReason: 'Wrong file' }),
      );
      renderPage(Role.Admin);
      await screen.findByText('Sigma II Tandem owners manual');

      await user.click(screen.getByRole('button', { name: 'Archive' }));
      const dialog = within(screen.getByRole('dialog'));
      expect(dialog.getByRole('button', { name: 'Archive' })).toBeDisabled();
      await user.type(dialog.getByLabelText(/Reason/), 'Wrong file');
      await user.click(dialog.getByRole('button', { name: 'Archive' }));

      await waitFor(() => expect(mocked.archiveDocument).toHaveBeenCalledWith('token-1', 'doc-1', 'Wrong file'));
      await waitFor(() => expect(mocked.listDocuments).toHaveBeenCalledTimes(2));

      await user.click(screen.getByRole('checkbox', { name: 'Show archived' }));
      await waitFor(() =>
        expect(mocked.listDocuments).toHaveBeenLastCalledWith('token-1', {
          search: '',
          includeArchived: true,
          page: 1,
        }),
      );
    });
  });
});
