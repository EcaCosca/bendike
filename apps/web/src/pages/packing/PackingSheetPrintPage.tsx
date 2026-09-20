import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, Navigate, useParams } from 'react-router-dom';
import {
  PACKING_CHECKLIST,
  PACKING_ELEMENT_KINDS,
  Role,
  describeProblem,
  type ChecklistItem,
  type PackingElementKind,
  type PackingSheetView,
} from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { getSheet } from './packing-api';
import { VoidSheetDialog } from './VoidSheetDialog';

const ELEMENT_LABELS: Record<PackingElementKind, string> = { reserve: 'RESERVA', container: 'CONTENEDOR', aad: 'AAD' };
const BORDER = '1px solid #777';
const CELL = { border: BORDER, padding: '4px 8px', verticalAlign: 'top', textAlign: 'left' } as const;
const PRINT_CSS = `
@page { size: A4; margin: 9mm; }
@media print {
  .sheet-form { font-size: 10.5px !important; }
  .sheet-form h1 { font-size: 16px !important; }
  .sheet-form td, .sheet-form th { padding: 1.5px 5px !important; }
  .sheet-form br { display: none; }
  .sheet-form [role='img'] { font-size: 12px !important; margin-right: 4px !important; line-height: 1 !important; }
  .sheet-form td, .sheet-form th { line-height: 1.15 !important; }
  .sheet-form .sheet-es { margin-left: 6px !important; font-size: 9px !important; }
  .sheet-form .sheet-es::before { content: '/ '; }
  .sheet-form table { margin-bottom: 6px !important; }
}
`;
const yesNo = (value: boolean | null, yes: boolean) => (value === yes ? '☒' : '☐');

function Ticked({ on }: { on: boolean }) {
  return (
    <span role="img" aria-label={on ? 'Ticked' : 'Not ticked'} style={{ marginRight: 6, fontSize: 18 }}>
      {on ? '☒' : '☐'}
    </span>
  );
}

function ChecklistCell({ item, checked }: { item: ChecklistItem | undefined; checked: Set<string> }) {
  if (!item) return <td style={CELL} />;
  return (
    <td style={CELL}>
      <Ticked on={checked.has(item.id)} />
      <span>{item.en}</span>
      <br />
      <span className="sheet-es" style={{ marginLeft: 26, color: '#555', fontSize: 12 }}>
        {item.es}
      </span>
    </td>
  );
}

function FormLine({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th style={{ ...CELL, width: '25%', fontWeight: 400 }}>{label}</th>
      <td style={CELL}>{value || '—'}</td>
    </tr>
  );
}

function SheetForm({ sheet }: { sheet: PackingSheetView }) {
  const checked = new Set(sheet.checkedIds);
  const left = PACKING_CHECKLIST.filter((item) => item.column === 'left');
  const right = PACKING_CHECKLIST.filter((item) => item.column === 'right');
  return (
    <Box
      className="sheet-form"
      sx={{
        position: 'relative',
        bgcolor: '#fff',
        color: '#000',
        p: { xs: 2, sm: 4 },
        border: '1px solid #ccc',
        fontSize: 14,
        '@media print': { border: 'none', p: 0 },
      }}
    >
      <style>{PRINT_CSS}</style>
      {sheet.voided && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: { xs: 72, sm: 140 },
              fontWeight: 800,
              color: 'rgba(200,0,0,0.25)',
              transform: 'rotate(-25deg)',
            }}
          >
            VOID
          </Typography>
        </Box>
      )}
      {sheet.voided && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {`This sheet was voided: ${sheet.voidReason ?? ''}`}
        </Alert>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#1F3F7A' }}>
            PLANILLA PLEGADOS CIAC / ANAC
          </Typography>
          <Typography sx={{ fontWeight: 700, color: '#1F3F7A' }}>REGISTRO PARACAÍDAS EMERGENCIA</Typography>
        </Box>
        <Typography sx={{ fontWeight: 700 }}>{`HOJA #: ${sheet.sheetNo ?? ''}`}</Typography>
      </Stack>

      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 12 }}>
        <tbody>
          <FormLine label="NOMBRE" value={sheet.ownerName} />
          <FormLine label="DIRECCIÓN" value={sheet.ownerAddress} />
          <FormLine label="TEL" value={sheet.ownerPhone} />
          <FormLine label="EMAIL" value={sheet.ownerEmail} />
        </tbody>
      </table>

      <Stack direction="row" spacing={4} sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 0.5 }}>
        <span>{`BOLETÍN SERVICIO CHEQUEADOS: SÍ ${yesNo(sheet.bulletinsChecked, true)} / NO ${yesNo(sheet.bulletinsChecked, false)}`}</span>
        <span>{`M.A.R.D conectado: SÍ ${yesNo(sheet.mardConnected, true)} / NO ${yesNo(sheet.mardConnected, false)}`}</span>
      </Stack>

      <table aria-label="Elementos" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 12 }}>
        <thead>
          <tr>
            {['ELEMENTO', 'MARCA / modelo', 'N SERIE', 'DOM / FECHA FABRIC'].map((header) => (
              <th key={header} style={{ ...CELL, fontWeight: 400 }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PACKING_ELEMENT_KINDS.map((kind) => {
            const element = sheet.elements?.[kind] ?? null;
            return (
              <tr key={kind}>
                <td style={CELL}>{ELEMENT_LABELS[kind]}</td>
                <td style={CELL}>{element ? `${element.manufacturer} ${element.model}` : '—'}</td>
                <td style={CELL}>{element?.serial ?? '—'}</td>
                <td style={CELL}>{element?.manufacturedOn ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <table aria-label="Checklist" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 12 }}>
        <tbody>
          {left.map((item, index) => (
            <tr key={item.id}>
              <ChecklistCell item={item} checked={checked} />
              <ChecklistCell item={right[index]} checked={checked} />
            </tr>
          ))}
        </tbody>
      </table>

      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 12 }}>
        <tbody>
          <tr>
            <th style={{ ...CELL, width: '25%', fontWeight: 400 }}>NOTAS / Notes</th>
            <td style={{ ...CELL, whiteSpace: 'pre-wrap' }}>
              <div>{sheet.notes || '—'}</div>
              {sheet.missing && sheet.missing.length > 0 && (
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: '#333' }}>
                  {sheet.missing.map((problem, index) => (
                    <li key={index}>{describeProblem(problem)}</li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
          <FormLine label="MANUAL SEGUIDO / Manual followed" value={sheet.manualLabel ?? ''} />
          <FormLine label="FECHA / Date" value={sheet.performedOn} />
          <FormLine label="PLEGADOR / Rigger" value={sheet.riggerName} />
          <FormLine label="LICENCIA N° / Licence" value={sheet.riggerLicence ?? ''} />
          <tr>
            <th style={{ ...CELL, fontWeight: 400, height: 70 }}>Firma</th>
            <td style={CELL} />
          </tr>
        </tbody>
      </table>
      <Typography variant="caption" color="text.secondary">
        {`Bendike digital sheet · checklist ${sheet.checklistVersion} · signed ${sheet.signedAt?.slice(0, 16).replace('T', ' ') ?? ''} UTC`}
      </Typography>
    </Box>
  );
}

export function PackingSheetPrintPage() {
  const { rigId = '', sheetId = '' } = useParams();
  const { token, user } = useAuth();
  const [sheet, setSheet] = useState<PackingSheetView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    getSheet(token, sheetId).then(
      (job) => setSheet(job.sheet),
      (err: unknown) => setError(err instanceof Error ? err.message : 'Could not load the packing sheet'),
    );
  }, [token, sheetId]);

  useEffect(load, [load]);

  if (!token || !user) return null;
  if (sheet?.status === 'draft') {
    return <Navigate to={`/app/gear/${rigId}/packing/${sheetId}`} replace />;
  }
  const canVoid = sheet !== null && !sheet.voided && (user.role === Role.Admin || user.id === sheet.riggerId);

  return (
    <AppShell>
      <Stack spacing={2}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ flexWrap: 'wrap', rowGap: 1, '@media print': { display: 'none' } }}
        >
          <Link component={RouterLink} to={`/app/gear/${rigId}`} underline="hover" sx={{ flexGrow: 1 }}>
            Back to the rig
          </Link>
          {canVoid && (
            <Button color="error" variant="outlined" onClick={() => setVoiding(true)}>
              Void sheet
            </Button>
          )}
          {sheet && (
            <Button variant="contained" onClick={() => window.print()}>
              Print
            </Button>
          )}
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {sheet && <SheetForm sheet={sheet} />}
      </Stack>
      {voiding && sheet && (
        <VoidSheetDialog
          token={token}
          sheetId={sheet.id}
          sheetNo={sheet.sheetNo}
          onClose={() => setVoiding(false)}
          onVoided={load}
        />
      )}
    </AppShell>
  );
}
