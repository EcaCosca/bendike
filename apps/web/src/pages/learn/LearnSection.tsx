import { Box, Typography } from '@mui/material';
import type { LearnItemSummary, Locale } from '@bendike/shared';
import { LearnCard } from './LearnCard';

interface LearnSectionProps {
  title: string;
  items: LearnItemSummary[];
  locale: Locale;
  headingLevel?: 'h2' | 'h3';
}

export function LearnSection({ title, items, locale, headingLevel = 'h2' }: LearnSectionProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <Box component="section" aria-label={title}>
      <Typography variant={headingLevel === 'h2' ? 'h5' : 'h6'} component={headingLevel} sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        }}
      >
        {items.map((item) => (
          <LearnCard key={item.id} item={item} locale={locale} compact />
        ))}
      </Box>
    </Box>
  );
}
