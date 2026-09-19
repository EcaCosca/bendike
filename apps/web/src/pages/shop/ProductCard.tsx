import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import type { ExchangeRates, Locale, ProductSummary } from '@bendike/shared';
import { pickLocalized } from '@bendike/shared';
import { Price } from '../../components/Price';

interface ProductCardProps {
  product: ProductSummary;
  locale: Locale;
  rates: ExchangeRates | null;
}

export function ProductCard({ product, locale, rates }: ProductCardProps) {
  const { t } = useTranslation();
  const name = pickLocalized(product.name, locale);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea
        component={RouterLink}
        to={`/${locale}/shop/${product.slug}`}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ position: 'relative' }}>
          {product.primaryImage ? (
            <CardMedia
              component="img"
              height="220"
              image={product.primaryImage.url}
              alt={product.primaryImage.alt || name}
              loading="lazy"
              sx={{ objectFit: 'contain', bgcolor: 'grey.50', opacity: product.sold ? 0.55 : 1 }}
            />
          ) : (
            <Box sx={{ height: 220, bgcolor: 'grey.100' }} />
          )}
          {product.sold && (
            <Chip
              size="small"
              color="error"
              label={t('product.soldLabel')}
              sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }}
            />
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {product.brand.name}
          </Typography>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
            {name}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
            {product.condition === 'used' && <Chip size="small" color="secondary" label={t('product.usedLabel')} />}
            {product.madeToOrder && <Chip size="small" label={t('shop.madeToOrder')} />}
          </Stack>
        </CardContent>
        <CardContent sx={{ pt: 0 }}>
          <Price
            listPriceUsd={product.listPriceUsd}
            markupPercent={product.markupPercent}
            priceAmount={product.priceAmount}
            priceCurrency={product.priceCurrency}
            rates={rates}
          />
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
