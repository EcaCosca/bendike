import {
  Box,
  Chip,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import {
  GEAR_KINDS,
  paginate,
  type GearItemView,
  type GearOverview,
  type RigCovers,
  type RigView,
} from '@bendike/shared';
import '../../i18n/i18n';
import { RigCover } from '../rigphotos/RigCover';
import { inspectionLine } from './entry-kinds';
import type { GearFilters, RigSort } from './gear-filters';
import { equipmentRows, rigNextDue, rigRows, type EquipmentRow } from './gear-grid';
import { dueText, mostUrgentDue } from './gear-status';
import { KIND_LABEL_KEYS } from './item-details';
import { GroundedBadge, StatusBadge } from './StatusBadge';

type Mode = 'equipment' | 'rigs';

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const NOTES_CELL = { minWidth: 160, maxWidth: 280, whiteSpace: 'normal' } as const;

function Dash() {
  return (
    <Typography component="span" color="text.secondary">
      —
    </Typography>
  );
}

function InactiveChip() {
  const { t } = useTranslation();
  return <Chip size="small" variant="outlined" label={t('gear.common.inactive')} />;
}

function RigLink({ rig }: { rig: RigView }) {
  return (
    <Link component={RouterLink} to={`/app/gear/${rig.id}`} color="inherit" underline="hover" sx={{ fontWeight: 600 }}>
      {rig.name}
    </Link>
  );
}

function EquipmentLine({ row }: { row: EquipmentRow }) {
  const { t } = useTranslation();
  const { item, rig } = row;
  const due = mostUrgentDue(item.dues);
  return (
    <TableRow hover>
      <TableCell>
        {rig ? (
          <RigLink rig={rig} />
        ) : (
          <Typography component="span" color="text.secondary">
            {t('gear.grid.spare')}
          </Typography>
        )}
      </TableCell>
      <TableCell>{t(KIND_LABEL_KEYS[item.kind])}</TableCell>
      <TableCell>{item.manufacturer}</TableCell>
      <TableCell>
        <Link component={RouterLink} to={`/app/gear/items/${item.id}`} color="inherit" underline="hover">
          {item.model}
        </Link>
      </TableCell>
      <TableCell>{item.serial ?? <Dash />}</TableCell>
      <TableCell>{item.manufacturedOn ?? <Dash />}</TableCell>
      <TableCell>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
          {rig?.readiness.state === 'grounded' && <GroundedBadge />}
          {rig && !rig.active ? (
            <InactiveChip />
          ) : item.dues.length > 0 ? (
            <StatusBadge status={item.status} />
          ) : (
            <Dash />
          )}
        </Stack>
      </TableCell>
      <TableCell sx={{ minWidth: 200 }}>
        {due ? (
          <Typography
            variant="body2"
            color={due.status === 'overdue' && rig?.active !== false ? 'error' : 'text.primary'}
          >
            {dueText(due, t)}
          </Typography>
        ) : (
          <Dash />
        )}
      </TableCell>
      <TableCell sx={NOTES_CELL}>{item.notes || <Dash />}</TableCell>
    </TableRow>
  );
}

function SlotCell({ item }: { item: GearItemView | null }) {
  const { t } = useTranslation();
  if (!item) {
    return (
      <TableCell>
        <em>{t('gear.common.empty')}</em>
      </TableCell>
    );
  }
  return (
    <TableCell>
      <Link component={RouterLink} to={`/app/gear/items/${item.id}`} color="inherit" underline="hover">
        {`${item.manufacturer} ${item.model}${item.serial ? ` #${item.serial}` : ''}`}
      </Link>
    </TableCell>
  );
}

function RigLine({ rig, cover }: { rig: RigView; cover: string | undefined }) {
  const { t } = useTranslation();
  const next = rigNextDue(rig);
  return (
    <TableRow hover>
      <TableCell>
        <Stack direction="row" spacing={1} alignItems="center">
          <RigCover photoId={cover} rigName={rig.name} size={40} />
          <RigLink rig={rig} />
        </Stack>
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
          {rig.readiness.state === 'grounded' && <GroundedBadge />}
          {rig.active ? <StatusBadge status={rig.status} /> : <InactiveChip />}
        </Stack>
      </TableCell>
      {GEAR_KINDS.map((kind) => (
        <SlotCell key={kind} item={rig.slots[kind]} />
      ))}
      <TableCell sx={{ minWidth: 220 }}>
        {next ? (
          <Typography variant="body2" color={next.due.status === 'overdue' && rig.active ? 'error' : 'text.primary'}>
            {t('gear.grid.nextDueOf', { kind: t(KIND_LABEL_KEYS[next.kind]), due: dueText(next.due, t) })}
          </Typography>
        ) : (
          <Dash />
        )}
      </TableCell>
      <TableCell sx={{ minWidth: 200 }}>{inspectionLine(rig.lastInspection, t)}</TableCell>
      <TableCell sx={NOTES_CELL}>{rig.notes || <Dash />}</TableCell>
    </TableRow>
  );
}

const EQUIPMENT_HEADER_KEYS = [
  'gear.common.rig',
  'gear.common.component',
  'gear.common.manufacturer',
  'gear.common.model',
  'gear.common.serial',
  'gear.grid.manufactured',
  'gear.common.status',
  'gear.grid.nextDue',
  'gear.common.notes',
];
const RIG_HEADER_KEYS = [
  'gear.common.rig',
  'gear.common.status',
  ...GEAR_KINDS.map((k) => KIND_LABEL_KEYS[k]),
  'gear.grid.nextDue',
  'gear.grid.lastInspection',
  'gear.common.notes',
];

export function GearGrid({
  overview,
  filters,
  sort,
  covers = {},
}: {
  overview: Pick<GearOverview, 'rigs' | 'spares'>;
  filters: GearFilters;
  sort: RigSort;
  covers?: RigCovers;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('equipment');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const filterKey = JSON.stringify([filters, sort, mode]);
  useEffect(() => setPage(0), [filterKey]);

  const equipment = useMemo(() => equipmentRows(overview, filters, sort), [overview, filters, sort]);
  const rigs = useMemo(() => rigRows(overview.rigs, filters, sort), [overview, filters, sort]);

  const total = mode === 'equipment' ? equipment.length : rigs.length;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(total / pageSize) - 1));
  const equipmentPage = paginate(equipment, currentPage + 1, pageSize).page;
  const rigPage = paginate(rigs, currentPage + 1, pageSize).page;
  const headers = (mode === 'equipment' ? EQUIPMENT_HEADER_KEYS : RIG_HEADER_KEYS).map((key) => t(key));

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={mode}
        onChange={(_, next: Mode | null) => next && setMode(next)}
        aria-label={t('gear.grid.contents')}
        sx={{ alignSelf: 'flex-start' }}
      >
        <ToggleButton value="equipment">{t('gear.grid.equipment')}</ToggleButton>
        <ToggleButton value="rigs">{t('gear.grid.rigs')}</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <TableContainer>
          <Table
            size="small"
            stickyHeader
            aria-label={mode === 'equipment' ? t('gear.grid.equipment') : t('gear.grid.rigs')}
          >
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableCell key={header} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {total === 0 ? (
                <TableRow>
                  <TableCell colSpan={headers.length}>
                    <Typography color="text.secondary">
                      {mode === 'equipment' ? t('gear.grid.noEquipment') : t('gear.grid.noRigs')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : mode === 'equipment' ? (
                equipmentPage.map((row) => <EquipmentLine key={row.item.id} row={row} />)
              ) : (
                rigPage.map((rig) => <RigLine key={rig.id} rig={rig} cover={covers[rig.id]} />)
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={currentPage}
          rowsPerPage={pageSize}
          rowsPerPageOptions={PAGE_SIZES}
          labelRowsPerPage={t('gear.grid.rowsPerPage')}
          labelDisplayedRows={({ from, to, count }) => t('gear.grid.displayedRows', { from, to, total: count })}
          sx={{
            '.MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'flex-end', px: 1 },
            '.MuiTablePagination-spacer': { display: 'none' },
            '.MuiTablePagination-selectLabel': { display: { xs: 'none', sm: 'block' } },
          }}
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(0);
          }}
        />
      </Box>
    </Stack>
  );
}
