import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams } from 'react-router-dom';
import type { ExchangeRates, ServiceDetail } from '@bendike/shared';
import { pickLocalized } from '@bendike/shared';
import { ApiError } from '../../api/http';
import { SimpleMarkdown } from '../../components/SimpleMarkdown';
import { SitePage } from '../../components/site/SitePage';
import { useLocale } from '../../i18n/useLocale';
import { getExchangeRates } from '../shop/catalog-api';
import { ServicePrice } from './ServicePrice';
import { buildServiceWhatsappUrl } from './service-whatsapp-message';
import { getService } from './services-api';

type Status = 'loading' | 'ready' | 'not-found' | 'error';

export function ServiceDetailPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    getExchangeRates()
      .then(setRates)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!slug) {
      return;
    }
    let cancelled = false;
    setStatus('loading');
    getService(slug)
      .then((detail) => {
        if (!cancelled) {
          setService(detail);
          setStatus('ready');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatus(error instanceof ApiError && error.status === 404 ? 'not-found' : 'error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const back = (
    <Button component={RouterLink} to={`/${locale}/services`} sx={{ mt: 2 }}>
      {t('services.backToServices')}
    </Button>
  );

  if (status === 'loading') {
    return (
      <SitePage>
        <Stack alignItems="center" sx={{ py: 10 }}>
          <CircularProgress />
        </Stack>
      </SitePage>
    );
  }

  if (status !== 'ready' || !service) {
    return (
      <SitePage>
        <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
          {status === 'error' ? (
            <Alert severity="error">{t('services.loadError')}</Alert>
          ) : (
            <>
              <Typography variant="h4" component="h1" gutterBottom>
                {t('services.notFoundTitle')}
              </Typography>
              <Typography color="text.secondary">{t('services.notFoundBody')}</Typography>
            </>
          )}
          {back}
        </Container>
      </SitePage>
    );
  }

  const name = pickLocalized(service.name, locale);
  const turnaround = service.turnaroundNote ? pickLocalized(service.turnaroundNote, locale) : '';

  return (
    <SitePage>
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
              {name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {pickLocalized(service.summary, locale)}
            </Typography>
          </Box>

          <ServicePrice priceAmount={service.priceAmount} priceCurrency={service.priceCurrency} rates={rates} />

          {turnaround && (
            <Typography>
              <strong>{t('services.turnaround')}:</strong> {turnaround}
            </Typography>
          )}

          <SimpleMarkdown source={pickLocalized(service.descriptionMd, locale)} />

          <Box>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              href={buildServiceWhatsappUrl(name, locale)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('services.askOnWhatsapp')}
            </Button>
            {back}
          </Box>
        </Stack>
      </Container>
    </SitePage>
  );
}
