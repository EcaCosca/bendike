import { Box, Chip, Stack, Typography } from '@mui/material';
import type { InspectionSummary, RiggerName } from '@bendike/shared';
import { INSPECTION_RESULT_LABELS } from './entry-kinds';

const RESULT_COLORS = { passed: 'success', needs_work: 'warning', grounded: 'error' } as const;

export function LastInspection({
  inspection,
  riggers,
}: {
  inspection: InspectionSummary | null;
  riggers: readonly RiggerName[];
}) {
  return (
    <Box component="section" aria-label="Last inspection">
      <Stack spacing={0.5}>
        {inspection ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">
              Inspected {inspection.performedOn} by {inspection.performedByName}
            </Typography>
            <Chip
              size="small"
              color={RESULT_COLORS[inspection.result]}
              label={INSPECTION_RESULT_LABELS[inspection.result]}
            />
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Never inspected
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {riggers.length > 0 ? `Riggers: ${riggers.map((r) => r.displayName).join(', ')}` : 'No rigger linked yet'}
        </Typography>
      </Stack>
    </Box>
  );
}
