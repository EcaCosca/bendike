import {
  Box,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SitePage } from '../components/site/SitePage';
import { CONTACT_EMAIL } from '../components/site/site-content';
import { usePublicLanguage } from '../i18n/use-public-language';
import { POLICY_UPDATED, STORAGE_INVENTORY, type StorageCategory, type StorageItem } from './storage-inventory';
import { useConsent } from './use-consent';

const TYPE_KEYS: Record<StorageItem['type'], string> = {
  Cookie: 'consent.type.cookie',
  'Local storage': 'consent.type.browserStorage',
  'Third-party script': 'consent.type.thirdPartyScript',
};

const CATEGORY_KEYS: Record<StorageCategory, string> = {
  Necessary: 'consent.category.necessary.title',
  Preferences: 'consent.category.preferences.title',
  'Third-party services': 'consent.category.thirdParty.title',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section">
      <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Stack spacing={1.5}>{children}</Stack>
    </Box>
  );
}

export function CookiePolicyPage() {
  const { t } = useTranslation();
  usePublicLanguage();
  const { openSettings } = useConsent();

  return (
    <SitePage>
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h3" component="h1">
              {t('consent.policy.title')}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {t('consent.policy.lastUpdated', { date: POLICY_UPDATED })}
            </Typography>
          </Box>

          <Section title={t('consent.policy.what.title')}>
            <Typography>{t('consent.policy.what.body')}</Typography>
          </Section>

          <Section title={t('consent.policy.stores.title')}>
            <Typography>{t('consent.policy.stores.body')}</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" aria-label={t('consent.policy.stores.caption')}>
                <TableHead>
                  <TableRow>
                    {(['name', 'type', 'category', 'purpose', 'duration'] as const).map((heading) => (
                      <TableCell key={heading} sx={{ fontWeight: 700 }}>
                        {t(`consent.policy.stores.${heading}`)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {STORAGE_INVENTORY.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>{item.name}</TableCell>
                      <TableCell>{t(TYPE_KEYS[item.type])}</TableCell>
                      <TableCell>{t(CATEGORY_KEYS[item.category])}</TableCell>
                      <TableCell>{t(`consent.policy.inventory.${item.id}.purpose`)}</TableCell>
                      <TableCell>{t(`consent.policy.inventory.${item.id}.duration`)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          <Section title={t('consent.policy.thirdParties.title')}>
            <Typography>{t('consent.policy.thirdParties.body')}</Typography>
          </Section>

          <Section title={t('consent.policy.changing.title')}>
            <Typography>{t('consent.policy.changing.body')}</Typography>
            <Box>
              <Button variant="contained" onClick={openSettings}>
                {t('consent.policy.changing.button')}
              </Button>
            </Box>
          </Section>

          <Section title={t('consent.policy.removing.title')}>
            <Typography>{t('consent.policy.removing.body')}</Typography>
          </Section>

          <Section title={t('consent.policy.contact.title')}>
            <Typography>
              {t('consent.policy.contact.lead')} <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
            </Typography>
          </Section>
        </Stack>
      </Container>
    </SitePage>
  );
}
