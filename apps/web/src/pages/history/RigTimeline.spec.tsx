import type { GroundingView, MaintenanceEntryView, PackingSheetSummary, RigPhotoView } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { entryView, groundingView } from '../gear/fixtures';
import * as packingApi from '../packing/packing-api';
import { RigTimeline } from './RigTimeline';

jest.mock('../packing/packing-api');
jest.mock('../rigphotos/AuthedImage', () => ({
  AuthedImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const labels = { 'reserve-1': 'Reserve PD VR360', 'aad-1': 'AAD Vigil 4' };

function sheet(overrides: Partial<PackingSheetSummary> = {}): PackingSheetSummary {
  return {
    id: 'sheet-7',
    rigId: 'tandem-1',
    rigName: 'Tandem 1',
    reserveItemId: 'reserve-1',
    entryId: 'repack-1',
    sheetNo: 7,
    performedOn: '2026-09-10',
    riggerName: 'Eca Rigger',
    missingCount: 0,
    voided: false,
    signedAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

function photo(overrides: Partial<RigPhotoView> = {}): RigPhotoView {
  return {
    id: 'p1',
    rigId: 'tandem-1',
    entryId: null,
    fileName: 'a.jpg',
    sizeBytes: 100,
    caption: 'Front view',
    addedById: 'u1',
    addedByName: 'Ana',
    createdAt: '2026-09-15T10:00:00.000Z',
    ...overrides,
  };
}

const entries: MaintenanceEntryView[] = [
  entryView({
    id: 'repack-1',
    kind: 'repack',
    performedOn: '2026-09-10',
    description: 'Repack, packing sheet #7',
    performedByName: 'Eca Rigger',
    ownerReported: false,
  }),
  entryView({
    id: 'service-1',
    gearItemId: 'aad-1',
    kind: 'aad_service',
    performedOn: '2026-05-02',
    description: 'Factory service',
    performedByName: 'Ana',
    ownerReported: true,
    verifiedAt: null,
  }),
  entryView({
    id: 'battery-1',
    gearItemId: 'aad-1',
    kind: 'battery',
    performedOn: '2026-03-01',
    description: 'New battery',
    performedByName: 'Ana',
    ownerReported: true,
    verifiedAt: '2026-03-02T00:00:00.000Z',
  }),
  entryView({
    id: 'old-1',
    kind: 'repack',
    performedOn: '2025-08-01',
    description: 'Old repack',
    voidedAt: '2025-08-02T00:00:00.000Z',
    voidReason: 'Wrong date',
  }),
];
const groundings: GroundingView[] = [
  groundingView({
    id: 'g1',
    reason: 'Frayed cutaway handle',
    openedAt: '2026-06-01T10:00:00.000Z',
    closedAt: '2026-06-03T10:00:00.000Z',
    closedByName: 'Eca Rigger',
    closeNote: 'Handle replaced',
  }),
];

function renderTimeline(overrides: Partial<Parameters<typeof RigTimeline>[0]> = {}) {
  render(
    <MemoryRouter>
      <RigTimeline
        token="token-1"
        rigId="tandem-1"
        entries={entries}
        groundings={groundings}
        photos={[]}
        itemLabels={labels}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

describe('RigTimeline', () => {
  beforeEach(() => {
    jest.mocked(packingApi.listSheets).mockResolvedValue([sheet()]);
  });

  test('lists what happened to the rig, newest first, with the kind of work, the component, the description and who did it', async () => {
    renderTimeline();

    const list = await screen.findByRole('list', { name: 'Rig history' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(6);
    expect(within(items[0]!).getByText('Repack')).toBeInTheDocument();
    expect(within(items[0]!).getByText('Reserve PD VR360')).toBeInTheDocument();
    expect(within(items[0]!).getByText('Repack, packing sheet #7')).toBeInTheDocument();
    expect(within(items[0]!).getByText(/Eca Rigger/)).toBeInTheDocument();
    expect(within(items[0]!).getByText('2026-09-10')).toBeInTheDocument();
    expect(within(items[1]!).getByText('Grounding cleared')).toBeInTheDocument();
    expect(within(items[3]!).getByText('AAD service')).toBeInTheDocument();
  });

  test('groups the events by month', async () => {
    renderTimeline();

    expect(await screen.findByRole('heading', { name: 'September 2026' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'May 2026' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'August 2025' })).toBeInTheDocument();
  });

  test('a repack recorded by a packing sheet links to that sheet', async () => {
    renderTimeline();

    const link = await screen.findByRole('link', { name: 'Packing sheet #7' });
    expect(link).toHaveAttribute('href', '/app/gear/tandem-1/packing/sheet-7/print');
    expect(packingApi.listSheets).toHaveBeenCalledWith('token-1', { rigId: 'tandem-1' });
  });

  test('says whether work is verified, waiting for verification, or void with its reason', async () => {
    renderTimeline();

    expect(await screen.findByText('Reported by the owner, not verified yet')).toBeInTheDocument();
    expect(screen.getByText('Verified by a rigger')).toBeInTheDocument();
    expect(screen.getByText('Void: Wrong date')).toBeInTheDocument();
  });

  test('shows when the rig was grounded and when it was cleared', async () => {
    renderTimeline();

    expect(await screen.findByText('Grounded')).toBeInTheDocument();
    expect(screen.getByText('Frayed cutaway handle')).toBeInTheDocument();
    expect(screen.getByText('Grounding cleared')).toBeInTheDocument();
    expect(screen.getByText(/Handle replaced/)).toBeInTheDocument();
  });

  test('a photo linked to work sits under it, and another photo is an event of its own', async () => {
    renderTimeline({
      photos: [photo({ id: 'linked', entryId: 'repack-1', caption: 'Packed reserve' }), photo({ id: 'loose' })],
    });

    const items = within(await screen.findByRole('list', { name: 'Rig history' })).getAllByRole('listitem');
    expect(items).toHaveLength(7);
    expect(within(items[0]!).getByText('Photo')).toBeInTheDocument();
    expect(within(items[0]!).getByRole('img', { name: 'Front view' })).toBeInTheDocument();
    expect(within(items[1]!).getByRole('img', { name: 'Packed reserve' })).toBeInTheDocument();
  });

  test('a photo opens larger', async () => {
    const user = userEvent.setup();
    renderTimeline({ photos: [photo()] });

    await user.click(await screen.findByRole('button', { name: 'Open photo: Front view' }));

    expect(within(screen.getByRole('dialog')).getByText('Added by Ana on 2026-09-15')).toBeInTheDocument();
  });

  test('narrows to repacks, services, groundings or photos, and back to everything', async () => {
    const user = userEvent.setup();
    renderTimeline({ photos: [photo()] });
    const list = await screen.findByRole('list', { name: 'Rig history' });

    await user.click(screen.getByRole('button', { name: 'Repacks' }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Services' }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Groundings' }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Photos' }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(7);
  });

  test('says so when there is no history, and when a filter matches nothing', async () => {
    const user = userEvent.setup();
    renderTimeline({ entries: [], groundings: [], photos: [] });

    expect(await screen.findByText('Nothing has been recorded for this rig yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Repacks' })).not.toBeInTheDocument();
    void user;
  });

  test('a filter with nothing in it says so', async () => {
    const user = userEvent.setup();
    renderTimeline({ groundings: [] });
    await screen.findByRole('list', { name: 'Rig history' });

    await user.click(screen.getByRole('button', { name: 'Groundings' }));

    expect(screen.getByText('Nothing matches this filter.')).toBeInTheDocument();
  });

  test('still shows the history when the packing sheets cannot be loaded', async () => {
    jest.mocked(packingApi.listSheets).mockRejectedValue(new Error('down'));
    renderTimeline();

    await waitFor(() => expect(screen.getByRole('list', { name: 'Rig history' })).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: /Packing sheet/ })).not.toBeInTheDocument();
  });
});
