import { Box, ButtonBase, Chip, Link, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  TIMELINE_CATEGORIES,
  TIMELINE_CATEGORY_LABELS,
  buildRigTimeline,
  filterTimeline,
  type GroundingView,
  type MaintenanceEntryView,
  type PackingSheetSummary,
  type RigPhotoView,
  type TimelineCategory,
  type TimelineEvent,
} from '@bendike/shared';
import { ENTRY_KIND_LABELS } from '../gear/entry-kinds';
import { listSheets } from '../packing/packing-api';
import { AuthedImage } from '../rigphotos/AuthedImage';
import { PhotoViewer } from '../rigphotos/PhotoViewer';
import { workLabel } from '../rigphotos/work-labels';

const MARKER_COLORS: Record<TimelineCategory, string> = {
  repack: '#1F4E8C',
  service: '#E0A406',
  inspection: '#2E7D32',
  grounding: '#C62828',
  photo: '#6A1B9A',
  other: '#78909C',
};

function monthOf(date: string): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

function Thumb({ photo, onOpen }: { photo: RigPhotoView; onOpen: (photo: RigPhotoView) => void }) {
  return (
    <ButtonBase
      aria-label={`Open photo: ${photo.caption || photo.fileName}`}
      onClick={() => onOpen(photo)}
      sx={{ width: 84, height: 64, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}
    >
      <AuthedImage photoId={photo.id} alt={photo.caption || 'Rig photo'} />
    </ButtonBase>
  );
}

function workStatus(entry: MaintenanceEntryView): string | null {
  if (entry.voidedAt !== null) return `Void: ${entry.voidReason ?? ''}`;
  if (!entry.ownerReported) return null;
  return entry.verifiedAt ? 'Verified by a rigger' : 'Reported by the owner, not verified yet';
}

function EventBody({
  event,
  rigId,
  onOpen,
}: {
  event: TimelineEvent;
  rigId: string;
  onOpen: (photo: RigPhotoView) => void;
}) {
  if (event.type === 'work') {
    const { entry } = event;
    const status = workStatus(entry);
    const voided = entry.voidedAt !== null;
    return (
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} alignItems="baseline" sx={{ flexWrap: 'wrap' }}>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            {ENTRY_KIND_LABELS[entry.kind]}
          </Typography>
          {entry.result && (
            <Typography component="span" variant="body2">{`: ${entry.result.replace('_', ' ')}`}</Typography>
          )}
          {event.componentLabel && (
            <Typography component="span" variant="body2" color="text.secondary">
              {event.componentLabel}
            </Typography>
          )}
        </Stack>
        <Typography variant="body2" sx={{ textDecoration: voided ? 'line-through' : 'none' }}>
          {entry.description}
        </Typography>
        <Typography variant="caption" color="text.secondary">{`Done by ${entry.performedByName}`}</Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
          {status && (
            <Chip
              size="small"
              variant="outlined"
              label={status}
              color={voided ? 'default' : entry.verifiedAt ? 'success' : 'warning'}
            />
          )}
          {event.sheet && (
            <Link component={RouterLink} to={`/app/gear/${rigId}/packing/${event.sheet.id}/print`} variant="body2">
              {`Packing sheet #${event.sheet.sheetNo}`}
            </Link>
          )}
        </Stack>
        {event.photos.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ pt: 0.5, flexWrap: 'wrap', rowGap: 1 }}>
            {event.photos.map((photo) => (
              <Thumb key={photo.id} photo={photo} onOpen={onOpen} />
            ))}
          </Stack>
        )}
      </Stack>
    );
  }
  if (event.type === 'grounding') {
    const { grounding } = event;
    return (
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 700 }}>{event.phase === 'opened' ? 'Grounded' : 'Grounding cleared'}</Typography>
        {event.phase === 'opened' ? (
          <>
            <Typography variant="body2">{grounding.reason}</Typography>
            <Typography variant="caption" color="text.secondary">{`Opened by ${grounding.openedByName}`}</Typography>
          </>
        ) : (
          <Typography variant="body2">{`Cleared by ${grounding.closedByName ?? ''}: ${grounding.closeNote ?? ''}`}</Typography>
        )}
      </Stack>
    );
  }
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Thumb photo={event.photo} onOpen={onOpen} />
      <Stack spacing={0.25}>
        <Typography sx={{ fontWeight: 700 }}>Photo</Typography>
        {event.photo.caption && <Typography variant="body2">{event.photo.caption}</Typography>}
        <Typography variant="caption" color="text.secondary">{`Added by ${event.photo.addedByName}`}</Typography>
      </Stack>
    </Stack>
  );
}

interface RigTimelineProps {
  token: string;
  rigId: string;
  entries: readonly MaintenanceEntryView[];
  groundings: readonly GroundingView[];
  photos: readonly RigPhotoView[];
  itemLabels: Record<string, string>;
}

export function RigTimeline({ token, rigId, entries, groundings, photos, itemLabels }: RigTimelineProps) {
  const [sheets, setSheets] = useState<PackingSheetSummary[]>([]);
  const [category, setCategory] = useState<TimelineCategory | null>(null);
  const [viewing, setViewing] = useState<RigPhotoView | null>(null);

  useEffect(() => {
    listSheets(token, { rigId }).then(setSheets, () => setSheets([]));
  }, [token, rigId]);

  const events = useMemo(
    () => buildRigTimeline({ entries, groundings, photos, sheets, itemLabels }),
    [entries, groundings, photos, sheets, itemLabels],
  );
  const shown = useMemo(() => filterTimeline(events, category), [events, category]);

  if (events.length === 0) {
    return <Typography color="text.secondary">Nothing has been recorded for this rig yet.</Typography>;
  }

  const rows: { month: string; events: TimelineEvent[] }[] = [];
  for (const event of shown) {
    const month = monthOf(event.date);
    const last = rows[rows.length - 1];
    if (last && last.month === month) last.events.push(event);
    else rows.push({ month, events: [event] });
  }
  const viewingEntry = viewing ? entries.find((entry) => entry.id === viewing.entryId) : undefined;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <Chip
          label="All"
          onClick={() => setCategory(null)}
          color={category === null ? 'primary' : 'default'}
          variant={category === null ? 'filled' : 'outlined'}
        />
        {TIMELINE_CATEGORIES.map((key) => (
          <Chip
            key={key}
            label={TIMELINE_CATEGORY_LABELS[key]}
            onClick={() => setCategory(category === key ? null : key)}
            color={category === key ? 'primary' : 'default'}
            variant={category === key ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>
      {shown.length === 0 ? (
        <Typography color="text.secondary">Nothing matches this filter.</Typography>
      ) : (
        <Box component="ul" aria-label="Rig history" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {rows.flatMap((row) => [
            <Box key={row.month} component="li" role="presentation" sx={{ listStyle: 'none' }}>
              <Typography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }}>
                {row.month}
              </Typography>
            </Box>,
            ...row.events.map((event) => (
              <Box
                key={event.id}
                component="li"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '84px 1fr', sm: '110px 1fr' },
                  columnGap: 2,
                  py: 1.25,
                  borderLeft: `3px solid ${MARKER_COLORS[event.category]}`,
                  pl: 1.5,
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  {event.date}
                </Typography>
                <EventBody event={event} rigId={rigId} onOpen={setViewing} />
              </Box>
            )),
          ])}
        </Box>
      )}
      {viewing && (
        <PhotoViewer
          token={token}
          photo={viewing}
          work={viewingEntry ? workLabel(viewingEntry, itemLabels) : null}
          canRemove={false}
          onClose={() => setViewing(null)}
          onRemoved={() => setViewing(null)}
        />
      )}
    </Stack>
  );
}
