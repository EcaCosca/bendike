import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './use-auth';

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress aria-label="Loading your session" />
      </Box>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
