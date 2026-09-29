import { Alert, Box, Button, Link, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import {
  PACKING_ELEMENT_KINDS,
  isHttpsUrl,
  type LibraryDocumentView,
  type PackingComponentInfo,
  type PackingComponents,
} from '@bendike/shared';
import '../../i18n/i18n';
import { KIND_LABEL_KEYS } from '../gear/item-details';
import { downloadDocument } from '../library/library-api';
import { setBulletinsLink } from './packing-api';
import { YesNo } from './YesNo';

const documentLabel = (doc: LibraryDocumentView) => `${doc.title}${doc.revision ? ` (${doc.revision})` : ''}`;

function BulletinsLink({ token, info, onSaved }: { token: string; info: PackingComponentInfo; onSaved: () => void }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!isHttpsUrl(url)) {
      setError(t('packing.components.linkMustBeHttps'));
      return;
    }
    try {
      await setBulletinsLink(token, info.modelId as string, url.trim());
      setError(null);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('packing.components.linkSaveFailed'));
    }
  }

  if (info.bulletinsLink) {
    return (
      <Box>
        <Link href={info.bulletinsLink.url} target="_blank" rel="noopener noreferrer">
          {t('packing.components.bulletinsPage')}
        </Link>
        {info.bulletinsLink.source === 'manufacturer' && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {t('packing.components.manufacturerPageNote')}
          </Typography>
        )}
      </Box>
    );
  }
  if (!info.modelId) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('packing.components.noModel')}
      </Typography>
    );
  }
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
      <TextField
        size="small"
        label={t('packing.components.linkLabel')}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        error={error !== null}
        helperText={error ?? t('packing.components.linkHint')}
        sx={{ flexGrow: 1 }}
      />
      <Button variant="outlined" onClick={() => void save()}>
        {t('packing.components.saveLink')}
      </Button>
    </Stack>
  );
}

function ComponentCard({
  token,
  kind,
  info,
  onLinkSaved,
  onError,
}: {
  token: string;
  kind: (typeof PACKING_ELEMENT_KINDS)[number];
  info: PackingComponentInfo | null;
  onLinkSaved: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useTranslation();
  const download = (doc: LibraryDocumentView) =>
    downloadDocument(token, doc).catch((err: unknown) =>
      onError(err instanceof Error ? err.message : t('packing.components.downloadFailed')),
    );

  return (
    <Paper variant="outlined" component="section" aria-label={t(KIND_LABEL_KEYS[kind])} sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
          {t(KIND_LABEL_KEYS[kind])}
        </Typography>
        {info ? (
          <>
            <Typography variant="body2">{`${info.manufacturer} ${info.model}`}</Typography>
            <Typography variant="body2" color="text.secondary">
              {[
                info.serial && t('packing.components.serial', { serial: info.serial }),
                info.manufacturedOn && t('packing.components.made', { date: info.manufacturedOn }),
              ]
                .filter(Boolean)
                .join(' · ') || t('packing.components.noSerialOrDate')}
            </Typography>
            <BulletinsLink token={token} info={info} onSaved={onLinkSaved} />
            {info.openBulletins.map((notice) => (
              <Alert key={notice.matchId} severity="warning" sx={{ py: 0 }}>
                {`${notice.reference}: ${notice.title}`}
              </Alert>
            ))}
            {info.manuals.map((doc) => (
              <Stack key={doc.id} direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {documentLabel(doc)}
                </Typography>
                <Button
                  size="small"
                  aria-label={t('packing.components.downloadDoc', { title: doc.title })}
                  onClick={() => void download(doc)}
                >
                  {t('packing.components.download')}
                </Button>
              </Stack>
            ))}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('packing.components.none')}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

interface ComponentsSectionProps {
  token: string;
  components: PackingComponents;
  bulletinsChecked: boolean | null;
  manualDocumentId: string | null;
  manualLabel: string | null;
  onBulletinsChange: (value: boolean) => void;
  onManualChange: (id: string | null) => void;
  onLinkSaved: () => void;
  onError: (message: string) => void;
}

export function ComponentsSection({
  token,
  components,
  bulletinsChecked,
  manualDocumentId,
  manualLabel,
  onBulletinsChange,
  onManualChange,
  onLinkSaved,
  onError,
}: ComponentsSectionProps) {
  const { t } = useTranslation();
  const manuals = new Map<string, LibraryDocumentView>();
  for (const kind of PACKING_ELEMENT_KINDS) {
    for (const doc of components[kind]?.manuals ?? []) manuals.set(doc.id, doc);
  }
  const chosenMissing = manualDocumentId !== null && !manuals.has(manualDocumentId);

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        {t('packing.components.title')}
      </Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
        {(['reserve', 'container', 'aad'] as const).map((kind) => (
          <ComponentCard
            key={kind}
            token={token}
            kind={kind}
            info={components[kind]}
            onLinkSaved={onLinkSaved}
            onError={onError}
          />
        ))}
      </Box>
      <YesNo label={t('packing.components.bulletinsChecked')} value={bulletinsChecked} onChange={onBulletinsChange} />
      {manuals.size > 0 || chosenMissing ? (
        <TextField
          select
          label={t('packing.components.manualFollowed')}
          value={manualDocumentId ?? ''}
          onChange={(e) => onManualChange(e.target.value === '' ? null : e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
        >
          <MenuItem value="">{t('packing.components.noneChosen')}</MenuItem>
          {chosenMissing && (
            <MenuItem value={manualDocumentId}>{manualLabel ?? t('packing.components.chosenDocument')}</MenuItem>
          )}
          {[...manuals.values()].map((doc) => (
            <MenuItem key={doc.id} value={doc.id}>
              {documentLabel(doc)}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('packing.components.noManual')}{' '}
          <Link component={RouterLink} to="/app/library">
            {t('packing.components.openLibrary')}
          </Link>{' '}
          {t('packing.components.toAddOne')}
        </Typography>
      )}
    </Stack>
  );
}
