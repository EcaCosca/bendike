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
import {
  INSPECTION_RESULTS,
  type CreateMaintenanceEntryRequestBody,
  type GearItemView,
  type InspectionResult,
  type MaintenanceEntryView,
  type MaintenanceKind,
  type Role,
} from '@bendike/shared';
import {
  ENTRY_KIND_LABELS,
  INSPECTION_RESULT_LABELS,
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
      setError('Describe the work.');
      return;
    }
    if (kind === 'inspection' && !result) {
      setError('Choose the result of the inspection.');
      return;
    }
    if (showOutside && !riggerName.trim()) {
      setError('Say who packed it: their name is required.');
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
      setError(err instanceof Error ? err.message : 'Could not save the entry');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>
        Log work: {item.manufacturer} {item.model}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            select
            label="Kind of work"
            value={kind}
            onChange={(e) => setKind(e.target.value as MaintenanceKind)}
          >
            {kinds.map((k) => (
              <MenuItem key={k} value={k}>
                {ENTRY_KIND_LABELS[k]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Date"
            type="date"
            value={performedOn}
            onChange={(e) => setPerformedOn(e.target.value)}
            required
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
            required
          />
          {kind === 'inspection' && (
            <TextField
              select
              label="Result"
              value={result}
              onChange={(e) => setResult(e.target.value as InspectionResult)}
            >
              {INSPECTION_RESULTS.map((r) => (
                <MenuItem key={r} value={r}>
                  {INSPECTION_RESULT_LABELS[r]}
                </MenuItem>
              ))}
            </TextField>
          )}
          {kind === 'aad_service' && (
            <TextField
              label="Next service due"
              type="date"
              value={nextService}
              onChange={(e) => setNextService(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Leave empty when the manufacturer has no further service date"
            />
          )}
          {!signsOff && !outsideRequired && (
            <FormControlLabel
              control={<Switch checked={someoneElse} onChange={(e) => setSomeoneElse(e.target.checked)} />}
              label="Someone outside Bendike did this work"
            />
          )}
          {showOutside && (
            <>
              <Alert severity="warning">
                Work by a rigger outside Bendike is recorded as unverified: the rig shows as GROUNDED until a Bendike
                rigger verifies it.
              </Alert>
              <Autocomplete
                freeSolo
                options={known.map((r) => r.name)}
                inputValue={riggerName}
                onInputChange={(_, value) => chooseRigger(value)}
                renderInput={(params) => <TextField {...params} label="Name of the rigger" helperText="Required" />}
              />
              <TextField
                label="Phone or email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                helperText="So the record says how to reach them later"
              />
              <TextField label="Licence number" value={licence} onChange={(e) => setLicence(e.target.value)} />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          Save entry
        </Button>
      </DialogActions>
    </Dialog>
  );
}
