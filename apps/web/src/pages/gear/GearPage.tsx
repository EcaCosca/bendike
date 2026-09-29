import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Link,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Role, type GearOverview, type RigCovers, type RigView } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import '../../i18n/i18n';
import { getCovers } from '../rigphotos/rig-photos-api';
import { RigCover } from '../rigphotos/RigCover';
import { inspectionLine } from './entry-kinds';
import { getOverview } from './gear-api';
import { filterRigs, filterSpares, sortRigs, type RigSort, type StatusFilter } from './gear-filters';
import { readGearView, saveGearView, type GearView } from './gear-view';
import { GearGrid } from './GearGrid';
import { STATUS_LABEL_KEYS } from './gear-status';
import { GearItemDialog } from './GearItemDialog';
import { KIND_LABEL_KEYS, identityLine } from './item-details';
import { RigDialog } from './RigDialog';
import { DueLine, GroundedBadge, StatusBadge } from './StatusBadge';
import { mostUrgentDue } from './gear-status';
import { GEAR_KINDS, type GearKind } from '@bendike/shared';

const SUMMARY: { key: StatusFilter; labelKey: string }[] = [
  { key: 'overdue', labelKey: STATUS_LABEL_KEYS.overdue },
  { key: 'due_soon', labelKey: STATUS_LABEL_KEYS.due_soon },
  { key: 'no_data', labelKey: STATUS_LABEL_KEYS.no_data },
  { key: 'grounded', labelKey: 'gear.page.grounded' },
];

function RigCard({ rig, cover }: { rig: RigView; cover: string | undefined }) {
  const { t } = useTranslation();
  const grounded = rig.readiness.state === 'grounded';
  return (
    <Card variant="outlined" data-testid="rig-card">
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <RigCover photoId={cover} rigName={rig.name} size={56} />
            <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
              <Link component={RouterLink} to={`/app/gear/${rig.id}`} color="inherit" underline="hover">
                {rig.name}
              </Link>
            </Typography>
            {grounded && <GroundedBadge />}
            {rig.active && <StatusBadge status={rig.status} />}
          </Stack>
          {rig.readiness.reasons.some((r) => r.type === 'pending_verification') && (
            <Typography variant="body2" color="text.secondary">
              {t('gear.page.awaitingVerification')}
            </Typography>
          )}
          {rig.readiness.reasons.map((r) =>
            r.type === 'grounding' ? (
              <Typography key={r.grounding.id} variant="body2" color="text.secondary">
                {r.grounding.source === 'bulletin'
                  ? r.grounding.reason
                  : t('gear.page.groundedByRigger', { reason: r.grounding.reason })}
              </Typography>
            ) : null,
          )}
          {rig.readiness.reasons.some((r) => r.type === 'inspection_grounded') && (
            <Typography variant="body2" color="text.secondary">
              {t('gear.page.groundedAtInspection')}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {inspectionLine(rig.lastInspection, t)}
          </Typography>
          {GEAR_KINDS.map((kind) => {
            const item = rig.slots[kind];
            const due = item ? mostUrgentDue(item.dues) : null;
            return (
              <Box key={kind}>
                <Typography variant="body2">
                  <strong>{t(KIND_LABEL_KEYS[kind])}</strong>:{' '}
                  {item ? identityLine(item, t) : <em>{t('gear.common.empty')}</em>}
                </Typography>
                {due && <DueLine due={due} />}
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section" aria-label={title}>
      <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export function GearPage() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const otherOwner = searchParams.get('ownerId') ?? undefined;
  const viewingOther = otherOwner !== undefined && otherOwner !== user?.id;
  const canAdd = !viewingOther || user?.role === Role.Admin;
  const [overview, setOverview] = useState<GearOverview | null>(null);
  const [covers, setCovers] = useState<RigCovers>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter | ''>('');
  const [kind, setKind] = useState<GearKind | ''>('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<RigSort>('urgent');
  const [dialog, setDialog] = useState<'rig' | 'component' | null>(null);
  const [view, setView] = useState<GearView>(readGearView);

  const chooseView = (next: GearView | null) => {
    if (next) {
      setView(next);
      saveGearView(next);
    }
  };

  const reload = useCallback(async () => {
    if (!token) return;
    setOverview(await getOverview(token, otherOwner));
  }, [token, otherOwner]);

  useEffect(() => {
    if (!token) return;
    getCovers(token, otherOwner).then(setCovers, () => setCovers({}));
  }, [token, otherOwner]);

  useEffect(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : t('gear.page.loadFailed')));
  }, [reload, t]);

  const filters = useMemo(
    () => ({ ...(status ? { status } : {}), ...(kind ? { kind } : {}), search }),
    [status, kind, search],
  );
  const title = viewingOther || user?.role === Role.Dropzone ? t('gear.page.fleet') : t('gear.page.myGear');
  const activeRigs = useMemo(
    () => sortRigs(filterRigs(overview?.rigs.filter((r) => r.active) ?? [], filters), sort),
    [overview, filters, sort],
  );
  const inactiveRigs = useMemo(
    () => sortRigs(filterRigs(overview?.rigs.filter((r) => !r.active) ?? [], filters), sort),
    [overview, filters, sort],
  );
  const spares = useMemo(() => filterSpares(overview?.spares ?? [], filters), [overview, filters]);

  if (!token) return null;

  return (
    <AppShell wide={view === 'grid'}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {canAdd && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setDialog('component')}>
                {t('gear.page.addComponent')}
              </Button>
              <Button variant="contained" onClick={() => setDialog('rig')}>
                {t('gear.page.addRig')}
              </Button>
            </Stack>
          )}
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {overview && (
          <>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {SUMMARY.map(({ key, labelKey }) => {
                const count = key === 'grounded' ? overview.summary.grounded : overview.summary[key];
                return (
                  <Chip
                    key={key}
                    label={`${t(labelKey)} ${count}`}
                    onClick={() => setStatus(status === key ? '' : key)}
                    color={status === key ? 'primary' : 'default'}
                    variant={status === key ? 'filled' : 'outlined'}
                  />
                );
              })}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('gear.page.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flexGrow: 1 }}
                size="small"
              />
              <TextField
                select
                label={t('gear.common.status')}
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter | '')}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">{t('gear.page.anyStatus')}</MenuItem>
                <MenuItem value="overdue">{t(STATUS_LABEL_KEYS.overdue)}</MenuItem>
                <MenuItem value="due_soon">{t(STATUS_LABEL_KEYS.due_soon)}</MenuItem>
                <MenuItem value="no_data">{t(STATUS_LABEL_KEYS.no_data)}</MenuItem>
                <MenuItem value="ok">{t(STATUS_LABEL_KEYS.ok)}</MenuItem>
                <MenuItem value="grounded">{t('gear.page.grounded')}</MenuItem>
              </TextField>
              <TextField
                select
                label={t('gear.common.component')}
                value={kind}
                onChange={(e) => setKind(e.target.value as GearKind | '')}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">{t('gear.page.anyComponent')}</MenuItem>
                {GEAR_KINDS.map((k) => (
                  <MenuItem key={k} value={k}>
                    {t(KIND_LABEL_KEYS[k])}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t('gear.page.sortBy')}
                value={sort}
                onChange={(e) => setSort(e.target.value as RigSort)}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="urgent">{t('gear.page.mostUrgent')}</MenuItem>
                <MenuItem value="name">{t('gear.page.name')}</MenuItem>
              </TextField>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={view}
                onChange={(_, next: GearView | null) => chooseView(next)}
                aria-label={t('gear.page.view')}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              >
                <ToggleButton value="grid">
                  <GridViewIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {t('gear.page.grid')}
                </ToggleButton>
                <ToggleButton value="cards">
                  <ViewAgendaOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {t('gear.page.cards')}
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {overview.rigs.length === 0 && overview.spares.length === 0 && (
              <Typography color="text.secondary">{t('gear.page.empty')}</Typography>
            )}

            {view === 'grid' && (overview.rigs.length > 0 || overview.spares.length > 0) && (
              <GearGrid overview={overview} filters={filters} sort={sort} covers={covers} />
            )}

            {view === 'cards' && activeRigs.length > 0 && (
              <Section title={t('gear.page.rigs')}>
                <Box
                  sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}
                >
                  {activeRigs.map((rig) => (
                    <RigCard key={rig.id} rig={rig} cover={covers[rig.id]} />
                  ))}
                </Box>
              </Section>
            )}

            {view === 'cards' && spares.length > 0 && (
              <Section title={t('gear.page.spareGear')}>
                <Stack spacing={1}>
                  {spares.map((item) => (
                    <Card key={item.id} variant="outlined">
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" sx={{ flexGrow: 1 }}>
                            <strong>{t(KIND_LABEL_KEYS[item.kind])}</strong>:{' '}
                            <Link
                              component={RouterLink}
                              to={`/app/gear/items/${item.id}`}
                              color="inherit"
                              underline="hover"
                            >
                              {identityLine(item, t)}
                            </Link>
                          </Typography>
                          {item.dues.length > 0 && <StatusBadge status={item.status} />}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Section>
            )}

            {view === 'cards' && inactiveRigs.length > 0 && (
              <Section title={t('gear.page.inactive')}>
                <Box
                  sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}
                >
                  {inactiveRigs.map((rig) => (
                    <RigCard key={rig.id} rig={rig} cover={covers[rig.id]} />
                  ))}
                </Box>
              </Section>
            )}
          </>
        )}
      </Stack>
      {dialog === 'rig' && (
        <RigDialog
          token={token}
          {...(otherOwner ? { ownerId: otherOwner } : {})}
          onClose={() => setDialog(null)}
          onSaved={() => void reload()}
        />
      )}
      {dialog === 'component' && (
        <GearItemDialog
          token={token}
          {...(otherOwner ? { ownerId: otherOwner } : {})}
          rigs={overview?.rigs.filter((r) => r.active) ?? []}
          onClose={() => setDialog(null)}
          onSaved={() => void reload()}
        />
      )}
    </AppShell>
  );
}
