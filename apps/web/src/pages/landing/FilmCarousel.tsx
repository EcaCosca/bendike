import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { Box, Container, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { LearnItemSummary } from '@bendike/shared';
import { isLocale, pickLocalized } from '@bendike/shared';
import { detectLocaleFromEnvironment } from '../../i18n/detect-locale';
import { listFilms } from '../learn/learn-api';
import { FILMS_HEADING, FILMS_INTRO } from './landing-content';

const CARD_WIDTH = { xs: 248, md: 300 };
/** Enough to feel deep without asking anyone to scroll past sixty-seven cards. */
const MAX_CARDS = 18;

/**
 * Footage that sells without teaching: season reels, trip films, one notable
 * jump. Shuffled once per load so a returning visitor does not meet the same
 * three every time.
 *
 * These are thumbnails and links, never embedded players — the carousel renders
 * no iframe at all, so there is nothing for a consent gate to hold back. Anyone
 * who wants to watch leaves for YouTube in a new tab, which is their choice to
 * make rather than ours to make silently.
 */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap] as T, copy[index] as T];
  }
  return copy;
}

export function FilmCarousel() {
  const { locale } = useParams<{ locale: string }>();
  const activeLocale = isLocale(locale) ? locale : detectLocaleFromEnvironment();
  const [films, setFilms] = useState<LearnItemSummary[]>([]);

  useEffect(() => {
    let live = true;
    listFilms()
      .then((result) => {
        if (live) {
          setFilms(result);
        }
      })
      .catch(() => {
        // A landing page is not the place to report that a decorative strip is missing.
        if (live) {
          setFilms([]);
        }
      });
    return () => {
      live = false;
    };
  }, []);

  const shuffled = useMemo(() => shuffle(films).slice(0, MAX_CARDS), [films]);

  if (shuffled.length === 0) {
    return null;
  }

  return (
    <Box
      component="section"
      aria-labelledby="films-heading"
      sx={{ py: { xs: 5, md: 7 }, bgcolor: 'primary.main', color: 'common.white' }}
    >
      <Container maxWidth="lg">
        <Typography
          id="films-heading"
          variant="overline"
          component="h2"
          sx={{ display: 'block', mb: 0.5, letterSpacing: '0.16em', color: 'secondary.main' }}
        >
          {FILMS_HEADING}
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.72)', maxWidth: '60ch' }}>
          {FILMS_INTRO}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            pb: 1.5,
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.28)', borderRadius: 99 },
          }}
        >
          {shuffled.map((film) => (
            <Box
              key={film.id}
              component="a"
              href={film.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                flex: `0 0 auto`,
                width: CARD_WIDTH,
                scrollSnapAlign: 'start',
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: 1.5,
                overflow: 'hidden',
                bgcolor: 'rgba(255,255,255,0.06)',
                '&:hover .film-thumb, &:focus-visible .film-thumb': { transform: 'scale(1.04)' },
                '&:hover .film-play, &:focus-visible .film-play': { opacity: 1 },
              }}
            >
              <Box sx={{ position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', bgcolor: '#000' }}>
                <Box
                  className="film-thumb"
                  component="img"
                  src={film.thumbnailUrl ?? ''}
                  alt=""
                  loading="lazy"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.3s',
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                  }}
                />
                <PlayCircleOutlineIcon
                  className="film-play"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    m: 'auto',
                    fontSize: 46,
                    opacity: 0.75,
                    transition: 'opacity 0.2s',
                  }}
                />
                {film.durationMinutes !== null && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      right: 6,
                      bottom: 6,
                      px: 0.75,
                      borderRadius: 0.5,
                      bgcolor: 'rgba(0,0,0,0.78)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {`${film.durationMinutes} min`}
                  </Typography>
                )}
              </Box>
              <Stack spacing={0.5} sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={0.5} alignItems="flex-start">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
                    {pickLocalized(film.title, activeLocale)}
                  </Typography>
                  <OpenInNewIcon sx={{ fontSize: 15, mt: 0.25, opacity: 0.6 }} />
                </Stack>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.68)', lineHeight: 1.45 }}>
                  {pickLocalized(film.summary, activeLocale)}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
