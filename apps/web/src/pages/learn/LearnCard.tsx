import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import type { LearnItemSummary, Locale } from '@bendike/shared';
import { pickLocalized } from '@bendike/shared';
import { FormatIcon } from './FormatIcon';

interface LearnCardProps {
  item: LearnItemSummary;
  locale: Locale;
  compact?: boolean;
}

export function LearnCard({ item, locale, compact = false }: LearnCardProps) {
  const { t } = useTranslation();
  const title = pickLocalized(item.title, locale);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea
        component={RouterLink}
        to={`/${locale}/learn/${item.slug}`}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        {item.thumbnailUrl ? (
          <CardMedia
            component="img"
            height={compact ? 120 : 170}
            image={item.thumbnailUrl}
            alt=""
            loading="lazy"
            sx={{ objectFit: 'cover', bgcolor: 'grey.100' }}
          />
        ) : (
          <Box
            sx={{
              height: compact ? 120 : 170,
              bgcolor: 'primary.main',
              color: 'secondary.main',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <FormatIcon format={item.format} fontSize="large" />
          </Box>
        )}
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            {item.sourceName}
            {item.author && item.author !== item.sourceName ? ` · ${item.author}` : ''}
          </Typography>
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, lineHeight: 1.25 }}>
            {title}
          </Typography>
          {!compact && (
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
              {pickLocalized(item.summary, locale)}
            </Typography>
          )}
          <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap', mt: 'auto', pt: 0.5 }}>
            <Chip
              size="small"
              icon={<FormatIcon format={item.format} fontSize="small" />}
              label={t(`learn.format.${item.format}`)}
            />
            {item.durationMinutes !== null && (
              <Chip size="small" variant="outlined" label={t('learn.minutes', { n: item.durationMinutes })} />
            )}
            <Chip size="small" variant="outlined" label={t(`learn.lang.${item.contentLanguage}`)} />
            {item.level !== 'all' && <Chip size="small" variant="outlined" label={t(`learn.level.${item.level}`)} />}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
