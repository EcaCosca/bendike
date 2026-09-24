import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { LearnEmbed } from '@bendike/shared';
import { embedSrc } from '@bendike/shared';
import { useConsent } from '../../consent/use-consent';
import { PROVIDER_NAMES } from './learn-labels';

interface EmbedPlayerProps {
  embed: LearnEmbed;
  title: string;
  thumbnailUrl: string | null;
}

export function EmbedPlayer({ embed, title, thumbnailUrl }: EmbedPlayerProps) {
  const { t } = useTranslation();
  const { allows, choice, save } = useConsent();
  const provider = PROVIDER_NAMES[embed.provider];
  const tall = embed.provider === 'spotify';

  if (!allows('thirdParty')) {
    return (
      <Box
        data-testid="embed-poster"
        sx={{
          position: 'relative',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'primary.main',
          color: 'common.white',
          aspectRatio: tall ? undefined : '16 / 9',
          minHeight: tall ? 220 : undefined,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {thumbnailUrl && (
          <Box
            component="img"
            src={thumbnailUrl}
            alt=""
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
          />
        )}
        <Stack spacing={1.5} alignItems="center" sx={{ position: 'relative', p: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            startIcon={<PlayCircleOutlineIcon />}
            onClick={() => save({ preferences: choice?.preferences ?? false, thirdParty: true })}
          >
            {t('learn.playHere', { provider })}
          </Button>
          <Typography variant="caption" sx={{ maxWidth: 420, opacity: 0.85 }}>
            {t('learn.playerNotice', { provider })}
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      component="iframe"
      src={embedSrc(embed)}
      title={title}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      sx={{
        width: '100%',
        border: 0,
        borderRadius: 1,
        aspectRatio: tall ? undefined : '16 / 9',
        height: tall ? 352 : undefined,
        display: 'block',
      }}
    />
  );
}
