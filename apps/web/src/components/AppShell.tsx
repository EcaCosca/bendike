import { AppBar, Box, Button, Chip, Container, Toolbar, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { BrandMark } from './site/BrandMark';
import { WhatsAppFab } from './site/WhatsAppFab';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              color: 'inherit',
              textDecoration: 'none',
              flexGrow: 1,
            }}
          >
            <BrandMark tone="white" height={32} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 700, letterSpacing: '0.14em' }}>
              BENDIKE
            </Typography>
          </Box>
          {user ? (
            <>
              <Chip label={user.role} color="secondary" size="small" sx={{ textTransform: 'capitalize' }} />
              <Typography variant="body2">{user.displayName}</Typography>
              <Button color="inherit" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Log in
              </Button>
              <Button variant="contained" color="secondary" component={RouterLink} to="/register">
                Sign up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {children}
      </Container>
      <WhatsAppFab />
    </Box>
  );
}
