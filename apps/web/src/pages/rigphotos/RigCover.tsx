import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import '../../i18n/i18n';
import { AuthedImage } from './AuthedImage';

interface RigCoverProps {
  photoId: string | undefined;
  rigName: string;
  size: number;
  sx?: SxProps<Theme>;
}

export function RigCover({ photoId, rigName, size, sx }: RigCoverProps) {
  const { t } = useTranslation();
  return (
    <Box
      data-testid="rig-cover"
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'action.hover',
        color: 'text.disabled',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
    >
      {photoId ? (
        <AuthedImage photoId={photoId} alt={t('gear.photos.photoOf', { name: rigName })} />
      ) : (
        <LandscapeOutlinedIcon aria-hidden />
      )}
    </Box>
  );
}
