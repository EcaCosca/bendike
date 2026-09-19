import { Box, Container, Link, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { BRANDS_HEADING, DEALER_BRANDS } from './landing-content';

const REPEATS_PER_HALF = 4;
const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

const scroll = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

const TRACK = Array.from({ length: 2 * REPEATS_PER_HALF * DEALER_BRANDS.length }, (_, index) => ({
  brand: DEALER_BRANDS[index % DEALER_BRANDS.length] ?? DEALER_BRANDS[0],
  visibleToAssistiveTech: index < DEALER_BRANDS.length,
}));

export function BrandCarousel() {
  return (
    <Box
      component="section"
      aria-labelledby="dealer-brands-heading"
      sx={{ py: { xs: 4, md: 5 }, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
    >
      <Container maxWidth="lg">
        <Typography
          id="dealer-brands-heading"
          variant="overline"
          component="h2"
          align="center"
          color="text.secondary"
          sx={{ display: 'block', mb: 3, letterSpacing: '0.16em' }}
        >
          {BRANDS_HEADING}
        </Typography>
      </Container>
      <Box
        sx={{
          overflow: 'hidden',
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          '&:hover > ul, &:focus-within > ul': { animationPlayState: 'paused' },
        }}
      >
        <Box
          component="ul"
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: 'max-content',
            listStyle: 'none',
            m: 0,
            p: 0,
            animation: `${scroll} 40s linear infinite`,
            [REDUCED_MOTION]: {
              animation: 'none',
              width: 'auto',
              justifyContent: 'center',
              flexWrap: 'wrap',
              rowGap: 3,
            },
          }}
        >
          {TRACK.map(({ brand, visibleToAssistiveTech }, index) => (
            <Box
              component="li"
              key={`${brand.slug}-${index}`}
              aria-hidden={visibleToAssistiveTech ? undefined : true}
              sx={{
                mr: { xs: 7, md: 10 },
                [REDUCED_MOTION]: { display: visibleToAssistiveTech ? 'list-item' : 'none' },
              }}
            >
              <Link
                component={RouterLink}
                to={`/shop?brand=${brand.slug}`}
                tabIndex={visibleToAssistiveTech ? undefined : -1}
                sx={{ display: 'block', lineHeight: 0 }}
              >
                <Box
                  component="img"
                  src={`/brands/${brand.file}`}
                  alt={brand.name}
                  height={brand.height}
                  sx={{
                    height: brand.height,
                    width: 'auto',
                    display: 'block',
                    filter: 'grayscale(1) brightness(0.65)',
                    opacity: 0.85,
                    transition: 'opacity 0.2s',
                    'a:hover &, a:focus-visible &': { opacity: 1 },
                  }}
                />
              </Link>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
