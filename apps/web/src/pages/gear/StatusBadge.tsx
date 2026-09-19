import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Chip, Typography } from '@mui/material';
import type { DueItem, DueStatus } from '@bendike/shared';
import { STATUS_META, dueText, type StatusIcon } from './gear-status';

const ICONS: Record<StatusIcon, typeof ErrorOutlineIcon> = {
  overdue: ErrorOutlineIcon,
  due_soon: WarningAmberIcon,
  ok: CheckCircleOutlineIcon,
  no_data: HelpOutlineIcon,
};

export function StatusBadge({ status, size = 'small' }: { status: DueStatus; size?: 'small' | 'medium' }) {
  const meta = STATUS_META[status];
  const Icon = ICONS[meta.icon];
  return (
    <Chip
      size={size}
      color={meta.color}
      variant={status === 'no_data' ? 'outlined' : 'filled'}
      icon={<Icon />}
      label={meta.label}
      data-status={status}
      sx={
        status === 'due_soon'
          ? { bgcolor: '#F5C400', color: '#3B2F00', '& .MuiChip-icon': { color: '#3B2F00' } }
          : undefined
      }
    />
  );
}

export function GroundedBadge({ size = 'small' }: { size?: 'small' | 'medium' }) {
  return (
    <Chip
      size={size}
      icon={<BlockIcon />}
      label="GROUNDED"
      sx={{ bgcolor: '#1B1B1F', color: '#fff', fontWeight: 700, '& .MuiChip-icon': { color: '#fff' } }}
    />
  );
}

export function DueLine({ due }: { due: DueItem }) {
  const text = dueText(due);
  return (
    <Typography variant="body2" color={due.status === 'overdue' ? 'error' : 'text.secondary'}>
      {text}
    </Typography>
  );
}
