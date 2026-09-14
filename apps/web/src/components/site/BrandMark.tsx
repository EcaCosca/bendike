import { Box, type SxProps, type Theme } from '@mui/material';
import { SITE_NAME } from './site-content';

type Tone = 'gold' | 'white';

const SOURCES: Record<Tone, { small: string; medium: string; large: string }> = {
  gold: { small: '/brand/mark-gold-320.png', medium: '/brand/mark-gold-640.png', large: '/brand/mark-gold-1400.png' },
  white: {
    small: '/brand/mark-white-320.png',
    medium: '/brand/mark-white-640.png',
    large: '/brand/mark-white-1400.png',
  },
};

export function BrandMark({ tone = 'gold', height = 40, sx }: { tone?: Tone; height?: number; sx?: SxProps<Theme> }) {
  const source = SOURCES[tone];
  return (
    <Box
      component="img"
      src={source.medium}
      srcSet={`${source.small} 320w, ${source.medium} 640w, ${source.large} 1400w`}
      sizes={`${Math.round(height * 2)}px`}
      alt={SITE_NAME}
      sx={{ height, width: 'auto', display: 'block', ...sx }}
    />
  );
}
