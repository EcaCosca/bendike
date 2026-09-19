import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useState, type FormEvent } from 'react';
import {
  BULLETIN_SEVERITIES,
  type BulletinSeverity,
  type BulletinTargetInput,
  type BulletinView,
  type CreateBulletinRequestBody,
} from '@bendike/shared';
import { createBulletin, updateBulletin } from './bulletins-api';
import { SEVERITY_LABELS } from './bulletin-labels';

interface TargetRow {
  model: string;
  serialFrom: string;
  serialTo: string;
  manufacturedFrom: string;
  manufacturedTo: string;
}

const EMPTY_ROW: TargetRow = { model: '', serialFrom: '', serialTo: '', manufacturedFrom: '', manufacturedTo: '' };

function toRow(target: BulletinTargetInput): TargetRow {
  return {
    model: target.model ?? '',
    serialFrom: target.serialFrom ?? '',
    serialTo: target.serialTo ?? '',
    manufacturedFrom: target.manufacturedFrom ?? '',
    manufacturedTo: target.manufacturedTo ?? '',
  };
}

function toTarget(row: TargetRow): BulletinTargetInput {
  const target: BulletinTargetInput = {};
  if (row.model.trim()) target.model = row.model.trim();
  if (row.serialFrom.trim()) target.serialFrom = row.serialFrom.trim();
  if (row.serialTo.trim()) target.serialTo = row.serialTo.trim();
  if (row.manufacturedFrom) target.manufacturedFrom = row.manufacturedFrom;
  if (row.manufacturedTo) target.manufacturedTo = row.manufacturedTo;
  return target;
}

interface BulletinDialogProps {
  token: string;
  bulletin?: BulletinView;
  onClose: () => void;
  onSaved: () => void;
}

export function BulletinDialog({ token, bulletin, onClose, onSaved }: BulletinDialogProps) {
  const [manufacturer, setManufacturer] = useState(bulletin?.manufacturer ?? '');
  const [reference, setReference] = useState(bulletin?.reference ?? '');
  const [title, setTitle] = useState(bulletin?.title ?? '');
  const [summary, setSummary] = useState(bulletin?.summary ?? '');
  const [requiredAction, setRequiredAction] = useState(bulletin?.requiredAction ?? '');
  const [sourceUrl, setSourceUrl] = useState(bulletin?.sourceUrl ?? '');
  const [issuedOn, setIssuedOn] = useState(bulletin?.issuedOn ?? '');
  const [severity, setSeverity] = useState<BulletinSeverity>(bulletin?.severity ?? 'mandatory');
  const [rows, setRows] = useState<TargetRow[]>(
    bulletin?.targets.length ? bulletin.targets.map(toRow) : [{ ...EMPTY_ROW }],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setRow = (index: number, patch: Partial<TargetRow>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (![manufacturer, reference, title, summary, requiredAction, issuedOn].every((v) => v.trim())) {
      setError('Fill in the manufacturer, reference, title, summary, required action and issue date.');
      return;
    }
    const body: CreateBulletinRequestBody = {
      manufacturer: manufacturer.trim(),
      reference: reference.trim(),
      title: title.trim(),
      summary: summary.trim(),
      requiredAction: requiredAction.trim(),
      issuedOn,
      severity,
      targets: rows.map(toTarget).filter((t) => Object.keys(t).length > 0),
      ...(sourceUrl.trim() ? { sourceUrl: sourceUrl.trim() } : {}),
    };
    setSaving(true);
    try {
      if (bulletin) {
        await updateBulletin(token, bulletin.id, body);
      } else {
        await createBulletin(token, body);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the bulletin');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{bulletin ? `Edit ${bulletin.reference}` : 'New bulletin'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Manufacturer"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              fullWidth
            />
            <TextField label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} fullWidth />
          </Stack>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField
            label="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            multiline
            minRows={2}
          />
          <TextField
            label="Required action"
            value={requiredAction}
            onChange={(e) => setRequiredAction(e.target.value)}
            multiline
            minRows={2}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Issued on"
              type="date"
              value={issuedOn}
              onChange={(e) => setIssuedOn(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              select
              label="Severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as BulletinSeverity)}
              fullWidth
            >
              {BULLETIN_SEVERITIES.map((s) => (
                <MenuItem key={s} value={s}>
                  {SEVERITY_LABELS[s]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Source link (optional)"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              fullWidth
            />
          </Stack>
          {severity === 'grounding' && (
            <Alert severity="warning">
              Publishing a grounding bulletin grounds every matched rig until its rigger resolves the match.
            </Alert>
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            What it applies to
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Each target narrows the manufacturer by model, serial range and date of manufacture. Serials that are not
            plain numbers are flagged for a rigger to review. Leave a target empty to cover the whole manufacturer.
          </Typography>
          {rows.map((row, index) => (
            <Stack key={index} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="flex-start">
              <TextField
                label="Model"
                value={row.model}
                onChange={(e) => setRow(index, { model: e.target.value })}
                size="small"
              />
              <TextField
                label="Serial from"
                value={row.serialFrom}
                onChange={(e) => setRow(index, { serialFrom: e.target.value })}
                size="small"
              />
              <TextField
                label="Serial to"
                value={row.serialTo}
                onChange={(e) => setRow(index, { serialTo: e.target.value })}
                size="small"
              />
              <TextField
                label="Made from"
                type="date"
                value={row.manufacturedFrom}
                onChange={(e) => setRow(index, { manufacturedFrom: e.target.value })}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Made to"
                type="date"
                value={row.manufacturedTo}
                onChange={(e) => setRow(index, { manufacturedTo: e.target.value })}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              {rows.length > 1 && (
                <IconButton
                  aria-label="Remove target"
                  onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              )}
            </Stack>
          ))}
          <Button
            size="small"
            onClick={() => setRows((current) => [...current, { ...EMPTY_ROW }])}
            sx={{ alignSelf: 'flex-start' }}
          >
            Add another target
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {bulletin ? 'Save changes' : 'Save draft'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
