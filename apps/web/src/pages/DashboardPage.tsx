import { Role } from '@bendike/shared';
import { Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AppShell } from '../components/AppShell';
import '../i18n/i18n';

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          {t('app.dashboard.greeting', { name: user.displayName })}
        </Typography>
        <Typography color="text.secondary">{t(`app.dashboard.signedInAs.${user.role}`)}</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" color="secondary" component={RouterLink} to="/app/gear">
            {user.role === Role.Dropzone ? t('app.dashboard.fleet') : t('app.dashboard.myGear')}
          </Button>
          {(user.role === Role.Rigger || user.role === Role.Admin) && (
            <Button variant="contained" color="secondary" component={RouterLink} to="/app/work">
              {t('app.dashboard.workQueue')}
            </Button>
          )}
          <Button variant="outlined" component={RouterLink} to="/app/riggers">
            {user.role === Role.Rigger ? t('app.dashboard.customersAndDropzones') : t('app.dashboard.myRiggers')}
          </Button>
          <Button variant="outlined" component={RouterLink} to="/app/profile">
            {t('app.dashboard.yourDetails')}
          </Button>
        </Stack>
        {user.role === Role.Admin && (
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
            <Button variant="contained" component={RouterLink} to="/app/admin/users">
              {t('app.dashboard.manageAccounts')}
            </Button>
            <Button variant="contained" component={RouterLink} to="/app/admin/services">
              {t('app.dashboard.manageServices')}
            </Button>
            <Button variant="contained" component={RouterLink} to="/app/admin/used-gear">
              {t('app.dashboard.manageUsedGear')}
            </Button>
            <Button variant="contained" component={RouterLink} to="/app/admin/gear-models">
              {t('app.dashboard.gearModels')}
            </Button>
            <Button variant="contained" component={RouterLink} to="/app/admin/bulletins">
              {t('app.dashboard.serviceBulletins')}
            </Button>
            <Button variant="contained" component={RouterLink} to="/app/admin/learn">
              {t('app.dashboard.learnMaterial')}
            </Button>
          </Stack>
        )}
      </Stack>
    </AppShell>
  );
}
