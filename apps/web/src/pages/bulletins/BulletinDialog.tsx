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
import { useTranslation } from 'react-i18next';
import {
  BULLETIN_SEVERITIES,
  type BulletinSeverity,
  type BulletinTargetInput,
  type BulletinView,
  type CreateBulletinRequestBody,
} from '@bendike/shared';
import '../../i18n/i18n';
import { createBulletin, updateBulletin } from './bulletins-api';
import { SEVERITY_LABEL_KEYS } from './bulletin-labels';

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
  const { t } = useTranslation();
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
      setError(t('bulletins.dialog.fillRequired'));
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
      setError(err instanceof Error ? err.message : t('bulletins.dialog.saveFailed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>
        {bulletin ? t('bulletins.dialog.editTitle', { reference: bulletin.reference }) : t('bulletins.dialog.newTitle')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={t('bulletins.dialog.manufacturer')}
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              fullWidth
            />
            <TextField
              label={t('bulletins.dialog.reference')}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              fullWidth
            />
          </Stack>
          <TextField label={t('bulletins.dialog.title')} value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField
            label={t('bulletins.dialog.summary')}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            multiline
            minRows={2}
          />
          <TextField
            label={t('bulletins.dialog.requiredAction')}
            value={requiredAction}
            onChange={(e) => setRequiredAction(e.target.value)}
            multiline
            minRows={2}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={t('bulletins.dialog.issuedOn')}
              type="date"
              value={issuedOn}
              onChange={(e) => setIssuedOn(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              select
              label={t('bulletins.dialog.severity')}
              value={severity}
              onChange={(e) => setSeverity(e.target.value as BulletinSeverity)}
              fullWidth
            >
              {BULLETIN_SEVERITIES.map((s) => (
                <MenuItem key={s} value={s}>
                  {t(SEVERITY_LABEL_KEYS[s])}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('bulletins.dialog.sourceUrl')}
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              fullWidth
            />
          </Stack>
          {severity === 'grounding' && <Alert severity="warning">{t('bulletins.dialog.groundingWarning')}</Alert>}
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t('bulletins.dialog.targetsTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('bulletins.dialog.targetsHelp')}
          </Typography>
          {rows.map((row, index) => (
            <Stack key={index} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="flex-start">
              <TextField
                label={t('bulletins.dialog.model')}
                value={row.model}
                onChange={(e) => setRow(index, { model: e.target.value })}
                size="small"
              />
              <TextField
                label={t('bulletins.dialog.serialFrom')}
                value={row.serialFrom}
                onChange={(e) => setRow(index, { serialFrom: e.target.value })}
                size="small"
              />
              <TextField
                label={t('bulletins.dialog.serialTo')}
                value={row.serialTo}
                onChange={(e) => setRow(index, { serialTo: e.target.value })}
                size="small"
              />
              <TextField
                label={t('bulletins.dialog.madeFrom')}
                type="date"
                value={row.manufacturedFrom}
                onChange={(e) => setRow(index, { manufacturedFrom: e.target.value })}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label={t('bulletins.dialog.madeTo')}
                type="date"
                value={row.manufacturedTo}
                onChange={(e) => setRow(index, { manufacturedTo: e.target.value })}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              {rows.length > 1 && (
                <IconButton
                  aria-label={t('bulletins.dialog.removeTarget')}
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
            {t('bulletins.dialog.addTarget')}
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('bulletins.actions.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {bulletin ? t('bulletins.dialog.saveChanges') : t('bulletins.dialog.saveDraft')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
