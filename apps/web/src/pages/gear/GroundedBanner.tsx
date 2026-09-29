import { Alert, AlertTitle, Button, Link, List, ListItem, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import type { GroundingView, ReadinessReason } from '@bendike/shared';
import '../../i18n/i18n';
import { ENTRY_KIND_LABEL_KEYS } from './entry-kinds';

interface GroundedBannerProps {
  reasons: readonly ReadinessReason[];
  canVerify: boolean;
  onVerify: (entryId: string) => void;
  canClear?: boolean;
  onClear?: (grounding: GroundingView) => void;
}

export function GroundedBanner({ reasons, canVerify, onVerify, canClear = false, onClear }: GroundedBannerProps) {
  const { t } = useTranslation();
  const pending = reasons.flatMap((reason) => (reason.type === 'pending_verification' ? reason.entries : []));
  const inspections = reasons.flatMap((reason) => (reason.type === 'inspection_grounded' ? [reason.inspection] : []));
  const groundings = reasons.flatMap((reason) => (reason.type === 'grounding' ? [reason.grounding] : []));
  if (pending.length === 0 && inspections.length === 0 && groundings.length === 0) {
    return null;
  }
  const kinds = [pending.length > 0, inspections.length > 0, groundings.length > 0].filter(Boolean).length;
  const title =
    kinds > 1
      ? t('gear.banner.grounded')
      : pending.length > 0
        ? t('gear.banner.pendingTitle')
        : inspections.length > 0
          ? t('gear.banner.inspectionTitle')
          : t('gear.banner.grounded');
  return (
    <Alert
      severity="error"
      icon={false}
      sx={{ bgcolor: '#1B1B1F', color: '#fff', '& .MuiAlert-message': { width: '100%' } }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>
      {pending.length > 0 && <Typography variant="body2">{t('gear.banner.pendingBody')}</Typography>}
      {inspections.length > 0 && <Typography variant="body2">{t('gear.banner.inspectionBody')}</Typography>}
      {groundings.length > 0 && <Typography variant="body2">{t('gear.banner.groundingBody')}</Typography>}
      <List dense disablePadding sx={{ mt: 1 }}>
        {groundings.map((grounding) => (
          <ListItem key={grounding.id} disableGutters>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {grounding.reason} · {grounding.openedByName}, {grounding.openedAt.slice(0, 10)}
              </Typography>
              {canClear && grounding.source === 'manual' && (
                <Button size="small" variant="contained" color="secondary" onClick={() => onClear?.(grounding)}>
                  {t('gear.common.clear')}
                </Button>
              )}
              {canClear && grounding.source === 'bulletin' && (
                <Link component={RouterLink} to="/app/work/bulletins" color="inherit" variant="body2">
                  {t('gear.banner.resolveInBulletins')}
                </Link>
              )}
            </Stack>
          </ListItem>
        ))}
        {inspections.map((inspection) => (
          <ListItem key={inspection.entryId} disableGutters>
            <Typography variant="body2">
              {t('gear.banner.inspection', {
                date: inspection.performedOn,
                name: inspection.performedByName,
                description: inspection.description,
              })}
            </Typography>
          </ListItem>
        ))}
        {pending.map((entry) => (
          <ListItem key={entry.entryId} disableGutters>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {t('gear.banner.pending', {
                  kind: t(ENTRY_KIND_LABEL_KEYS[entry.kind]),
                  date: entry.performedOn,
                  name: entry.performedByName,
                })}
                {entry.performedByContact ? ` (${entry.performedByContact})` : ''}
              </Typography>
              {canVerify && (
                <Button size="small" variant="contained" color="secondary" onClick={() => onVerify(entry.entryId)}>
                  {t('gear.common.verify')}
                </Button>
              )}
            </Stack>
          </ListItem>
        ))}
      </List>
    </Alert>
  );
}
