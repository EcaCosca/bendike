import { Role } from '@bendike/shared';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';
import { AboutStoryPage } from './pages/about/story/AboutStoryPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutStoryPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<DashboardPage />} />
        <Route element={<RequireRole roles={[Role.Admin]} />}>
          <Route path="/app/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
