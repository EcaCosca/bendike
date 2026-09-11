import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { IconButton, Stack } from '@mui/material';
import type { ReactElement } from 'react';
import { SOCIAL_LINKS } from './site-content';

const SOCIAL_ICONS: Record<(typeof SOCIAL_LINKS)[number]['id'], ReactElement> = {
  instagram: <InstagramIcon />,
  linkedin: <LinkedInIcon />,
};

export function SocialLinks({ color = 'primary' }: { color?: 'primary' | 'inherit' }) {
  return (
    <Stack direction="row" spacing={1}>
      {SOCIAL_LINKS.map((link) => (
        <IconButton
          key={link.id}
          component="a"
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          color={color}
        >
          {SOCIAL_ICONS[link.id]}
        </IconButton>
      ))}
    </Stack>
  );
}
