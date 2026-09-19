import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ExchangeRates, Money, PriceCurrency } from '@bendike/shared';
import { bendikePriceUsd, convert, formatMoney, priceFigures } from '@bendike/shared';
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
  const direct = priceFigures(priceAmount, priceCurrency, rates);

  if (direct) {
    return (
      <Box>
        <Typography data-testid="price-primary" variant="h6" component="p" sx={{ fontWeight: 700 }}>
          {format(direct.primary)}
        </Typography>
        {direct.derived.length > 0 && rates && (
          <Typography data-testid="price-local" variant="caption" color="text.secondary" component="p">
            {direct.derived.map(format).join(' · ')}
            {' · '}
            {t('shop.indicative', { date: new Date(rates.ARS.fetchedAt).toLocaleDateString() })}
          </Typography>
        )}
      </Box>
    );
  }

  if (listPriceUsd === null) {
    return <Typography color="text.secondary">{t('shop.priceOnRequest')}</Typography>;
  }

  const usd = bendikePriceUsd(listPriceUsd, markupPercent);

  return (
    <Box>
      <Typography data-testid="price-usd" variant="h6" component="p" sx={{ fontWeight: 700 }}>
        {formatMoney(usd, 'USD')}
      </Typography>
      {rates && (
        <Typography data-testid="price-local" variant="caption" color="text.secondary" component="p">
          {formatMoney(convert(usd, rates.ARS.usdRate), 'ARS')} · {formatMoney(convert(usd, rates.BRL.usdRate), 'BRL')}
          {' · '}
          {t('shop.indicative', { date: new Date(rates.ARS.fetchedAt).toLocaleDateString() })}
        </Typography>
      )}
    </Box>
  );
}
