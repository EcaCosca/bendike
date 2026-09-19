import { Navigate, useLocation } from 'react-router-dom';
import { detectLocaleFromEnvironment } from './detect-locale';

export function RedirectToLocale() {
  const location = useLocation();
  const locale = detectLocaleFromEnvironment();

  return <Navigate to={`/${locale}${location.pathname}${location.search}`} replace />;
}
