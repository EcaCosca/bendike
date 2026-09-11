import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Fab, Tooltip } from '@mui/material';
import { WHATSAPP_HREF, WHATSAPP_LABEL } from './site-content';

const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_GREEN_DARK = '#1DA851';

export function WhatsAppFab() {
  return (
    <Tooltip title={WHATSAPP_LABEL} placement="left">
      <Fab
        component="a"
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={WHATSAPP_LABEL}
        sx={{
          position: 'fixed',
          right: { xs: 16, md: 28 },
          bottom: { xs: 16, md: 28 },
          bgcolor: WHATSAPP_GREEN,
          color: 'common.white',
          '&:hover': { bgcolor: WHATSAPP_GREEN_DARK },
          zIndex: (theme) => theme.zIndex.speedDial,
        }}
      >
        <WhatsAppIcon fontSize="large" />
      </Fab>
    </Tooltip>
  );
}
