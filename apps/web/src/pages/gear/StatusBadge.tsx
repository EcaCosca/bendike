import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Chip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { DueItem, DueStatus } from '@bendike/shared';
import '../../i18n/i18n';
import { STATUS_LABEL_KEYS, STATUS_META, dueText, type StatusIcon } from './gear-status';

const ICONS: Record<StatusIcon, typeof ErrorOutlineIcon> = {
  overdue: ErrorOutlineIcon,
  due_soon: WarningAmberIcon,
  ok: CheckCircleOutlineIcon,
  no_data: HelpOutlineIcon,
};

export function StatusBadge({ status, size = 'small' }: { status: DueStatus; size?: 'small' | 'medium' }) {
  const { t } = useTranslation();
  const meta = STATUS_META[status];
  const Icon = ICONS[meta.icon];
  return (
    <Chip
      size={size}
      color={meta.color}
      variant={status === 'no_data' ? 'outlined' : 'filled'}
      icon={<Icon />}
      label={t(STATUS_LABEL_KEYS[status])}
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
  const { t } = useTranslation();
  return (
    <Chip
      size={size}
      icon={<BlockIcon />}
      label={t('gear.common.grounded')}
      sx={{ bgcolor: '#1B1B1F', color: '#fff', fontWeight: 700, '& .MuiChip-icon': { color: '#fff' } }}
    />
  );
}

export function DueLine({ due }: { due: DueItem }) {
  const { t } = useTranslation();
  return (
    <Typography variant="body2" color={due.status === 'overdue' ? 'error' : 'text.secondary'}>
      {dueText(due, t)}
    </Typography>
  );
}
