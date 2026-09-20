import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ACCEPT_ALL, REJECT_ALL, type ConsentSelection } from './consent-storage';
import { useConsent } from './use-consent';

interface CategoryRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

function CategoryRow({ title, description, checked, disabled = false, onChange }: CategoryRowProps) {
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Switch
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          slotProps={{ input: { 'aria-label': title } }}
        />
      </Stack>
    </Box>
  );
}

function Settings({ initial, onClose }: { initial: ConsentSelection; onClose: () => void }) {
  const { save } = useConsent();
  const [selection, setSelection] = useState<ConsentSelection>(initial);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="cookie-settings-title">
      <DialogTitle id="cookie-settings-title">Cookie settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            Choose what Bendike may store on your device. You can change this at any time from the footer. Read the{' '}
            <Link component={RouterLink} to="/cookies" onClick={onClose}>
              cookie policy
            </Link>{' '}
            for the full list.
          </Typography>
          <CategoryRow
            title="Necessary"
            description="Keeps you signed in and remembers the language you chose. The site does not work without these, so they are always on."
            checked
            disabled
          />
          <CategoryRow
            title="Preferences"
            description="Remembers your gear view (grid or cards) and, for riggers, the licence number you type on a packing sheet."
            checked={selection.preferences}
            onChange={(preferences) => setSelection({ ...selection, preferences })}
          />
          <CategoryRow
            title="Third-party services"
            description="Loads Google's sign-in so you can continue with Google. Google may set its own cookies when it loads."
            checked={selection.thirdParty}
            onChange={(thirdParty) => setSelection({ ...selection, thirdParty })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="outlined" onClick={() => save(REJECT_ALL)}>
          Reject non-essential
        </Button>
        <Button variant="outlined" onClick={() => save(ACCEPT_ALL)}>
          Accept all
        </Button>
        <Button variant="contained" onClick={() => save(selection)}>
          Save my choices
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function CookieSettingsDialog() {
  const { settingsOpen, choice, closeSettings } = useConsent();
  if (!settingsOpen) return null;
  return (
    <Settings
      initial={{ preferences: choice?.preferences ?? false, thirdParty: choice?.thirdParty ?? false }}
      onClose={closeSettings}
    />
  );
}
