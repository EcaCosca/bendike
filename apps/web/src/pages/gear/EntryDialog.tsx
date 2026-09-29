import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  INSPECTION_RESULTS,
  type CreateMaintenanceEntryRequestBody,
  type GearItemView,
  type InspectionResult,
  type MaintenanceEntryView,
  type MaintenanceKind,
  type Role,
} from '@bendike/shared';
import '../../i18n/i18n';
import {
  ENTRY_KIND_LABEL_KEYS,
  INSPECTION_RESULT_LABEL_KEYS,
  canSignOff,
  entryKindsFor,
  isSafetyKind,
  outsideRiggersFrom,
} from './entry-kinds';
import { addEntry } from './gear-api';

interface EntryDialogProps {
  token: string;
  item: Pick<GearItemView, 'id' | 'kind' | 'manufacturer' | 'model'>;
  role: Role;
  today: string;
  previousEntries: readonly MaintenanceEntryView[];
  onClose: () => void;
  onSaved: (entry: MaintenanceEntryView) => void;
}

export function EntryDialog({ token, item, role, today, previousEntries, onClose, onSaved }: EntryDialogProps) {
  const { t } = useTranslation();
  const signsOff = canSignOff(role);
  const kinds = entryKindsFor(item.kind, role);
  const [kind, setKind] = useState<MaintenanceKind>(kinds[0] ?? 'other');
  const [performedOn, setPerformedOn] = useState(today);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<InspectionResult | ''>('');
  const [nextService, setNextService] = useState('');
  const [someoneElse, setSomeoneElse] = useState(false);
  const [riggerName, setRiggerName] = useState('');
  const [contact, setContact] = useState('');
  const [licence, setLicence] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const known = useMemo(() => outsideRiggersFrom(previousEntries), [previousEntries]);

  const outsideRequired = !signsOff && isSafetyKind(kind);
  const showOutside = !signsOff && (outsideRequired || someoneElse);

  function chooseRigger(name: string) {
    setRiggerName(name);
    const match = known.find((r) => r.name === name);
    if (match) {
      setContact(match.contact);
      setLicence(match.licence);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!description.trim()) {
      setError(t('gear.entry.describeWork'));
      return;
    }
    if (kind === 'inspection' && !result) {
      setError(t('gear.entry.chooseResult'));
      return;
    }
    if (showOutside && !riggerName.trim()) {
      setError(t('gear.entry.riggerRequired'));
      return;
    }
    const body: CreateMaintenanceEntryRequestBody = { kind, performedOn, description: description.trim() };
    if (kind === 'inspection' && result) {
      body.result = result;
    }
    if (kind === 'aad_service' && nextService) {
      body.nextServiceDueOn = nextService;
    }
    if (showOutside) {
      body.performedByName = riggerName.trim();
      if (contact.trim()) body.performedByContact = contact.trim();
      if (licence.trim()) body.performedByLicence = licence.trim();
    }
    setError(null);
    setSaving(true);
    try {
      onSaved(await addEntry(token, item.id, body));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('gear.entry.saveFailed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{t('gear.entry.title', { item: `${item.manufacturer} ${item.model}` })}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            select
            label={t('gear.entry.kindOfWork')}
            value={kind}
            onChange={(e) => setKind(e.target.value as MaintenanceKind)}
          >
            {kinds.map((k) => (
              <MenuItem key={k} value={k}>
                {t(ENTRY_KIND_LABEL_KEYS[k])}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t('gear.common.date')}
            type="date"
            value={performedOn}
            onChange={(e) => setPerformedOn(e.target.value)}
            required
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
          />
          <TextField
            label={t('gear.common.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
            required
          />
          {kind === 'inspection' && (
            <TextField
              select
              label={t('gear.entry.result')}
              value={result}
              onChange={(e) => setResult(e.target.value as InspectionResult)}
            >
              {INSPECTION_RESULTS.map((r) => (
                <MenuItem key={r} value={r}>
                  {t(INSPECTION_RESULT_LABEL_KEYS[r])}
                </MenuItem>
              ))}
            </TextField>
          )}
          {kind === 'aad_service' && (
            <TextField
              label={t('gear.entry.nextServiceDue')}
              type="date"
              value={nextService}
              onChange={(e) => setNextService(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText={t('gear.entry.nextServiceHint')}
            />
          )}
          {!signsOff && !outsideRequired && (
            <FormControlLabel
              control={<Switch checked={someoneElse} onChange={(e) => setSomeoneElse(e.target.checked)} />}
              label={t('gear.entry.someoneElse')}
            />
          )}
          {showOutside && (
            <>
              <Alert severity="warning">{t('gear.entry.outsideWarning')}</Alert>
              <Autocomplete
                freeSolo
                options={known.map((r) => r.name)}
                inputValue={riggerName}
                onInputChange={(_, value) => chooseRigger(value)}
                renderInput={(params) => (
                  <TextField {...params} label={t('gear.entry.riggerName')} helperText={t('gear.entry.required')} />
                )}
              />
              <TextField
                label={t('gear.entry.contact')}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                helperText={t('gear.entry.contactHint')}
              />
              <TextField label={t('gear.entry.licence')} value={licence} onChange={(e) => setLicence(e.target.value)} />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('gear.common.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {t('gear.entry.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
