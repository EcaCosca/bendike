import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { SiteFooter } from './SiteFooter';
import { SiteNav } from './SiteNav';

export function SitePage({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <SiteNav />
      <Box component="main">{children}</Box>
      <SiteFooter />
    </Box>
  );
}
