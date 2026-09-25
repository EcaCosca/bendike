import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ExchangeRates, Money, PriceCurrency } from '@bendike/shared';
import { bendikePriceUsd, displayFigures, formatMoney } from '@bendike/shared';
import { useCurrency } from '../currency/use-currency';
import '../i18n/i18n';

interface PriceProps {
  listPriceUsd: number | null;
  markupPercent: number;
  priceAmount: number | null;
  priceCurrency: PriceCurrency | null;
  rates: ExchangeRates | null;
}

function format(money: Money): string {
  return formatMoney(money.amount, money.currency);
}

export function Price({ listPriceUsd, markupPercent, priceAmount, priceCurrency, rates }: PriceProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  const entered: Money | null =
    priceAmount !== null && priceCurrency !== null
      ? { amount: priceAmount, currency: priceCurrency }
      : listPriceUsd !== null
        ? { amount: bendikePriceUsd(listPriceUsd, markupPercent), currency: 'USD' }
        : null;

  if (!entered) {
    return <Typography color="text.secondary">{t('shop.priceOnRequest')}</Typography>;
  }

  const figures = displayFigures(entered, rates, currency ?? entered.currency);
  const indicative = rates ? t('shop.indicative', { date: new Date(rates.ARS.fetchedAt).toLocaleDateString() }) : '';

  return (
    <Box>
      <Typography
        data-testid="price-primary"
        data-converted={figures.primaryConverted ? 'true' : undefined}
        variant="h6"
        component="p"
        sx={{ fontWeight: 700 }}
      >
        {format(figures.primary)}
      </Typography>
      {figures.derived.length > 0 && (
        <Typography data-testid="price-local" variant="caption" color="text.secondary" component="p">
          {figures.derived.map(format).join(' · ')}
          {' · '}
          {indicative}
        </Typography>
      )}
    </Box>
  );
}
