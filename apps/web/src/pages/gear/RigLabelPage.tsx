import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { getRig } from './gear-api';

export function RigLabelPage() {
  const { rigId = '' } = useParams();
  const { token } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getRig(token, rigId)
      .then(async (rig) => {
        const svg = await QRCode.toString(`${window.location.origin}/app/gear/${rig.id}`, {
          type: 'svg',
          margin: 1,
          width: 240,
        });
        if (!cancelled) {
          setName(rig.name);
          setQr(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
        }
      })
      .catch(() => setUnavailable(true));
    return () => {
      cancelled = true;
    };
  }, [token, rigId]);

  return (
    <AppShell>
      <Stack spacing={3} alignItems="center">
        {unavailable && <Alert severity="warning">This rig is not available.</Alert>}
        {name && qr && (
          <>
            <Box
              sx={{
                textAlign: 'center',
                p: 3,
                border: '2px solid',
                borderColor: 'text.primary',
                borderRadius: 2,
                '@media print': { border: '2px solid #000' },
              }}
            >
              <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
                {name}
              </Typography>
              <Box component="img" src={qr} alt={`QR code for ${name}`} sx={{ width: 240, height: 240 }} />
              <Typography variant="body2" color="text.secondary">
                Scan to open this rig on Bendike
              </Typography>
            </Box>
            <Button variant="contained" onClick={() => window.print()} sx={{ '@media print': { display: 'none' } }}>
              Print label
            </Button>
          </>
        )}
      </Stack>
    </AppShell>
  );
}
