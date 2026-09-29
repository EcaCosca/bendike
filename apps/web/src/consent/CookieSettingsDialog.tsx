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
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import '../i18n/i18n';
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
  const { t } = useTranslation();
  const { save } = useConsent();
  const [selection, setSelection] = useState<ConsentSelection>(initial);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="cookie-settings-title">
      <DialogTitle id="cookie-settings-title">{t('consent.settings.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            {t('consent.settings.intro')}{' '}
            <Link component={RouterLink} to="/cookies" onClick={onClose}>
              {t('consent.settings.policyLink')}
            </Link>{' '}
            {t('consent.settings.introTail')}
          </Typography>
          <CategoryRow
            title={t('consent.category.necessary.title')}
            description={t('consent.category.necessary.description')}
            checked
            disabled
          />
          <CategoryRow
            title={t('consent.category.preferences.title')}
            description={t('consent.category.preferences.description')}
            checked={selection.preferences}
            onChange={(preferences) => setSelection({ ...selection, preferences })}
          />
          <CategoryRow
            title={t('consent.category.thirdParty.title')}
            description={t('consent.category.thirdParty.description')}
            checked={selection.thirdParty}
            onChange={(thirdParty) => setSelection({ ...selection, thirdParty })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('consent.settings.cancel')}</Button>
        <Button variant="outlined" onClick={() => save(REJECT_ALL)}>
          {t('consent.settings.reject')}
        </Button>
        <Button variant="outlined" onClick={() => save(ACCEPT_ALL)}>
          {t('consent.settings.accept')}
        </Button>
        <Button variant="contained" onClick={() => save(selection)}>
          {t('consent.settings.save')}
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
