import { Role } from '@bendike/shared';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';
import { LocaleLayout } from './i18n/LocaleLayout';
import { RedirectToLocale } from './i18n/RedirectToLocale';
import { AboutStoryPage } from './pages/about/story/AboutStoryPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProductPage } from './pages/shop/ProductPage';
import { ServicesAdminPage } from './pages/services/ServicesAdminPage';
import { BulletinMatchesPage } from './pages/bulletins/BulletinMatchesPage';
import { BulletinsPage } from './pages/bulletins/BulletinsPage';
import { LibraryPage } from './pages/library/LibraryPage';
import { CustomersPage } from './pages/work/CustomersPage';
import { WorkQueuePage } from './pages/work/WorkQueuePage';
import { LinksPage } from './pages/links/LinksPage';
import { RigLabelPage } from './pages/gear/RigLabelPage';
import { ProfilePage } from './pages/ProfilePage';
import { GearModelsPage } from './pages/gear/GearModelsPage';
import { GearPage } from './pages/gear/GearPage';
import { ItemPage } from './pages/gear/ItemPage';
import { RigPage } from './pages/gear/RigPage';
import { UsedGearAdminPage } from './pages/usedgear/UsedGearAdminPage';
import { ServiceDetailPage } from './pages/services/ServiceDetailPage';
import { ServicesPage } from './pages/services/ServicesPage';
import { ShopPage } from './pages/shop/ShopPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutStoryPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/shop/*" element={<RedirectToLocale />} />
      <Route path="/services/*" element={<RedirectToLocale />} />
      <Route path="/:locale" element={<LocaleLayout />}>
        <Route path="shop" element={<ShopPage />} />
        <Route path="shop/:slug" element={<ProductPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:slug" element={<ServiceDetailPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/app/profile" element={<ProfilePage />} />
        <Route path="/app/gear" element={<GearPage />} />
        <Route path="/app/gear/items/:itemId" element={<ItemPage />} />
        <Route path="/app/gear/:rigId" element={<RigPage />} />
        <Route path="/app/gear/:rigId/label" element={<RigLabelPage />} />
        <Route path="/app/riggers" element={<LinksPage />} />
        <Route element={<RequireRole roles={[Role.Rigger, Role.Admin]} />}>
          <Route path="/app/work" element={<WorkQueuePage />} />
          <Route path="/app/work/customers" element={<CustomersPage />} />
          <Route path="/app/work/bulletins" element={<BulletinMatchesPage />} />
          <Route path="/app/library" element={<LibraryPage />} />
        </Route>
        <Route element={<RequireRole roles={[Role.Admin]} />}>
          <Route path="/app/admin/users" element={<AdminUsersPage />} />
          <Route path="/app/admin/services" element={<ServicesAdminPage />} />
          <Route path="/app/admin/used-gear" element={<UsedGearAdminPage />} />
          <Route path="/app/admin/gear-models" element={<GearModelsPage />} />
          <Route path="/app/admin/bulletins" element={<BulletinsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
