import { Box, Checkbox, FormControlLabel, Paper, Stack, Typography } from '@mui/material';
import { PACKING_CHECKLIST } from '@bendike/shared';
import { YesNo } from './YesNo';

interface ChecklistSectionProps {
  checkedIds: string[];
  mardConnected: boolean | null;
  onToggle: (id: string, checked: boolean) => void;
  onMardChange: (value: boolean) => void;
}

export function ChecklistSection({ checkedIds, mardConnected, onToggle, onMardChange }: ChecklistSectionProps) {
  const checked = new Set(checkedIds);
  return (
    <Paper variant="outlined" component="section" aria-label="Checklist" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          Checklist
        </Typography>
        <YesNo label="MARD connected" value={mardConnected} onChange={onMardChange} />
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
          {(['left', 'right'] as const).map((column) => (
            <Stack key={column}>
              {PACKING_CHECKLIST.filter((item) => item.column === column).map((item) => (
                <FormControlLabel
                  key={item.id}
                  control={
                    <Checkbox checked={checked.has(item.id)} onChange={(e) => onToggle(item.id, e.target.checked)} />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                        {item.en}
                      </Typography>
                      <Typography variant="caption" component="span" color="text.secondary" sx={{ display: 'block' }}>
                        {item.es}
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', py: 0.25 }}
                />
              ))}
            </Stack>
          ))}
        </Box>
      </Stack>
    </Paper>
  );
}
