import { AppBar, Box, Button, Chip, Container, Toolbar, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
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
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
          >
            Bendike
          </Typography>
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
