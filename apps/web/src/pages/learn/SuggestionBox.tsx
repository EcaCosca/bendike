import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@bendike/shared';
import { isHttpsUrl, suggestionMessage, whatsappLink } from '@bendike/shared';
import { WHATSAPP_NUMBER } from '../../components/site/site-content';

export function SuggestionBox({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [reason, setReason] = useState('');
  const [name, setName] = useState('');
  const [invalid, setInvalid] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!isHttpsUrl(url)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    const message = suggestionMessage({ locale, url, reason, name });
    window.open(whatsappLink(`+${WHATSAPP_NUMBER}`, message), '_blank', 'noopener,noreferrer');
  }

  return (
    <Paper
      component="form"
      variant="outlined"
      onSubmit={submit}
      aria-labelledby="learn-suggest-title"
      sx={{ p: { xs: 2.5, md: 3 }, bgcolor: 'grey.50' }}
    >
      <Stack spacing={2}>
        <div>
          <Typography id="learn-suggest-title" variant="h6" component="h2" sx={{ fontWeight: 700 }}>
            {t('learn.suggest.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('learn.suggest.intro')}
          </Typography>
        </div>
        <TextField
          label={t('learn.suggest.url')}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          error={invalid}
          helperText={invalid ? t('learn.suggest.invalidUrl') : ' '}
          type="url"
          size="small"
          required
          fullWidth
        />
        <TextField
          label={t('learn.suggest.reason')}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          size="small"
          multiline
          minRows={2}
          fullWidth
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            label={t('learn.suggest.name')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
          />
          <Button type="submit" variant="contained" color="secondary" startIcon={<WhatsAppIcon />}>
            {t('learn.suggest.send')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
