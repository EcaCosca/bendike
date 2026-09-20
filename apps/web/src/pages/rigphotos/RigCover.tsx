import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { AuthedImage } from './AuthedImage';

interface RigCoverProps {
  photoId: string | undefined;
  rigName: string;
  size: number;
  sx?: SxProps<Theme>;
}

export function RigCover({ photoId, rigName, size, sx }: RigCoverProps) {
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
      {photoId ? <AuthedImage photoId={photoId} alt={`Photo of ${rigName}`} /> : <LandscapeOutlinedIcon aria-hidden />}
    </Box>
  );
}
