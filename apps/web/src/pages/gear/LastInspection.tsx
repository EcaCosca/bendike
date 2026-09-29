import { Box, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { InspectionSummary, RiggerName } from '@bendike/shared';
import '../../i18n/i18n';
import { INSPECTION_RESULT_LABEL_KEYS } from './entry-kinds';

const RESULT_COLORS = { passed: 'success', needs_work: 'warning', grounded: 'error' } as const;

export function LastInspection({
  inspection,
  riggers,
}: {
  inspection: InspectionSummary | null;
  riggers: readonly RiggerName[];
}) {
  const { t } = useTranslation();
  return (
    <Box component="section" aria-label={t('gear.inspection.section')}>
      <Stack spacing={0.5}>
        {inspection ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">
              {t('gear.inspection.inspectedBy', { date: inspection.performedOn, name: inspection.performedByName })}
            </Typography>
            <Chip
              size="small"
              color={RESULT_COLORS[inspection.result]}
              label={t(INSPECTION_RESULT_LABEL_KEYS[inspection.result])}
            />
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('gear.inspection.never')}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {riggers.length > 0
            ? t('gear.inspection.riggers', { names: riggers.map((r) => r.displayName).join(', ') })
            : t('gear.inspection.noRigger')}
        </Typography>
      </Stack>
    </Box>
  );
}
