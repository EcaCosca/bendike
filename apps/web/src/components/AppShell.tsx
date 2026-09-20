import { AppBar, Box, Button, Chip, Container, Toolbar, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Role } from '@bendike/shared';
import { useAuth } from '../auth/use-auth';
import { BrandMark } from './site/BrandMark';
import { WhatsAppFab } from './site/WhatsAppFab';

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} sx={{ '@media print': { display: 'none' } }}>
        <Toolbar sx={{ gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', py: { xs: 1, sm: 0 } }}>
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
              {user.role === Role.Authority ? (
                <>
                  <Button color="inherit" component={RouterLink} to="/app/authority/riggers">
                    Riggers
                  </Button>
                  <Button color="inherit" component={RouterLink} to="/app/authority/rigs">
                    Rigs
                  </Button>
                </>
              ) : (
                <>
                  <Button color="inherit" component={RouterLink} to="/app/gear">
                    Gear
                  </Button>
                  {(user.role === Role.Rigger || user.role === Role.Admin) && (
                    <Button color="inherit" component={RouterLink} to="/app/work">
                      Work
                    </Button>
                  )}
                  {(user.role === Role.Rigger || user.role === Role.Admin) && (
                    <Button color="inherit" component={RouterLink} to="/app/library">
                      Library
                    </Button>
                  )}
                  <Button color="inherit" component={RouterLink} to="/app/riggers">
                    {user.role === Role.Rigger ? 'Customers' : 'Riggers'}
                  </Button>
                </>
              )}
              <Chip label={user.role} color="secondary" size="small" sx={{ textTransform: 'capitalize' }} />
              <Button
                color="inherit"
                component={RouterLink}
                to="/app/profile"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                {user.displayName}
              </Button>
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
      <Container maxWidth={wide ? 'xl' : 'md'} sx={{ pt: 4, pb: 12 }}>
        {children}
      </Container>
      <Box sx={{ '@media print': { display: 'none' } }}>
        <WhatsAppFab />
      </Box>
    </Box>
  );
}
