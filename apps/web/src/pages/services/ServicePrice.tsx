import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ExchangeRates, Money, PriceCurrency } from '@bendike/shared';
import { formatMoney, priceFigures } from '@bendike/shared';
import '../../i18n/i18n';

interface ServicePriceProps {
  priceAmount: number | null;
  priceCurrency: PriceCurrency | null;
  rates: ExchangeRates | null;
}

function format(money: Money): string {
  return formatMoney(money.amount, money.currency);
}

export function ServicePrice({ priceAmount, priceCurrency, rates }: ServicePriceProps) {
  const { t } = useTranslation();
  const figures = priceFigures(priceAmount, priceCurrency, rates);

  if (!figures) {
    return <Typography color="text.secondary">{t('services.priceVaries')}</Typography>;
  }

  return (
    <Box>
      <Typography data-testid="service-price" variant="h6" component="p" sx={{ fontWeight: 700 }}>
        {format(figures.primary)}
      </Typography>
      {figures.derived.length > 0 && rates && (
        <Typography data-testid="service-price-derived" variant="caption" color="text.secondary" component="p">
          {figures.derived.map(format).join(' · ')}
          {' · '}
          {t('shop.indicative', { date: new Date(rates.ARS.fetchedAt).toLocaleDateString() })}
        </Typography>
      )}
    </Box>
  );
}
