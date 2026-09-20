import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import { Box, Skeleton } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/use-auth';
import { fetchPhotoBlob } from './rig-photos-api';

const urls = new Map<string, Promise<string>>();

function photoUrl(token: string, photoId: string): Promise<string> {
  let url = urls.get(photoId);
  if (!url) {
    url = fetchPhotoBlob(token, photoId).then((blob) => URL.createObjectURL(blob));
    url.catch(() => urls.delete(photoId));
    urls.set(photoId, url);
  }
  return url;
}

interface AuthedImageProps {
  photoId: string;
  alt: string;
  fit?: 'cover' | 'contain';
  sx?: SxProps<Theme>;
}

export function AuthedImage({ photoId, alt, fit = 'cover', sx }: AuthedImageProps) {
  const { token } = useAuth();
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setSrc(null);
    setFailed(false);
    photoUrl(token, photoId).then(
      (url) => !cancelled && setSrc(url),
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [token, photoId]);

  if (failed) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          bgcolor: 'action.hover',
          color: 'text.secondary',
          width: '100%',
          height: '100%',
          ...sx,
        }}
      >
        <ImageNotSupportedOutlinedIcon fontSize="small" />
        <span>Photo unavailable</span>
      </Box>
    );
  }
  if (!src) {
    return <Skeleton variant="rectangular" sx={{ width: '100%', height: '100%', ...sx }} />;
  }
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="lazy"
      sx={{ width: '100%', height: '100%', objectFit: fit, display: 'block', ...sx }}
    />
  );
}
