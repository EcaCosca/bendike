import { Alert, Box, Card, CardActionArea, CardContent, Container, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import type { ExchangeRates, ServiceSummary } from '@bendike/shared';
import { pickLocalized } from '@bendike/shared';
import { SitePage } from '../../components/site/SitePage';
import { useLocale } from '../../i18n/useLocale';
import { getExchangeRates } from '../shop/catalog-api';
import { ServicePrice } from './ServicePrice';
import { listServices } from './services-api';

export function ServicesPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [services, setServices] = useState<ServiceSummary[] | null>(null);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listServices()
      .then(setServices)
      .catch(() => setFailed(true));
    getExchangeRates()
      .then(setRates)
      .catch(() => undefined);
  }, []);

  return (
    <SitePage>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          {t('services.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
          {t('services.intro')}
        </Typography>

        {failed && <Alert severity="error">{t('services.loadError')}</Alert>}
        {!failed && services?.length === 0 && <Typography>{t('services.empty')}</Typography>}

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {services?.map((service) => (
            <Card key={service.id} variant="outlined">
              <CardActionArea component={RouterLink} to={`/${locale}/services/${service.slug}`} sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    {pickLocalized(service.name, locale)}
                  </Typography>
                  <Typography color="text.secondary" sx={{ flexGrow: 1 }}>
                    {pickLocalized(service.summary, locale)}
                  </Typography>
                  <ServicePrice priceAmount={service.priceAmount} priceCurrency={service.priceCurrency} rates={rates} />
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Container>
    </SitePage>
  );
}
