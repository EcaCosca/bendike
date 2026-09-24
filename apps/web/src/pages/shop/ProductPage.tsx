import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Container,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams } from 'react-router-dom';
import type { Category, ExchangeRates, LearnItemSummary, ProductDetail, ProductSummary } from '@bendike/shared';
import { pickLocalized } from '@bendike/shared';
import { ApiError } from '../../api/http';
import { Price } from '../../components/Price';
import { SimpleMarkdown } from '../../components/SimpleMarkdown';
import { SitePage } from '../../components/site/SitePage';
import { useLocale } from '../../i18n/useLocale';
import { listLearnForProduct } from '../learn/learn-api';
import { LearnSection } from '../learn/LearnSection';
import { getExchangeRates, getProduct, listCategories, listProducts } from './catalog-api';
import { ProductCard } from './ProductCard';
import { buildProductWhatsappUrl } from './product-whatsapp-message';
import { findVariant, optionNames, type Selection } from './variant-options';
import { VariantPicker } from './VariantPicker';

type Status = 'loading' | 'ready' | 'not-found' | 'error';

const RELATED_COUNT = 4;

export function ProductPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [categories, setCategories] = useState<Category[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [related, setRelated] = useState<ProductSummary[]>([]);
  const [learnItems, setLearnItems] = useState<LearnItemSummary[]>([]);
  const [selection, setSelection] = useState<Selection>([]);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => undefined);
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
    setSelection([]);
    setImageIndex(0);
    getProduct(slug)
      .then((detail) => {
        if (!cancelled) {
          setProduct(detail);
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

  useEffect(() => {
    if (!product) {
      return;
    }
    let cancelled = false;
    setLearnItems([]);
    listLearnForProduct(product.id)
      .then((items) => {
        if (!cancelled) {
          setLearnItems(items);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [product]);

  const category = product ? categories.find((candidate) => candidate.id === product.categoryId) : undefined;

  useEffect(() => {
    if (!product || !category) {
      return;
    }
    let cancelled = false;
    listProducts({ categorySlug: category.slug, pageSize: RELATED_COUNT + 1, locale })
      .then((page) => {
        if (!cancelled) {
          setRelated(page.items.filter((item) => item.slug !== product.slug).slice(0, RELATED_COUNT));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [product, category, locale]);

  if (status === 'loading') {
    return (
      <SitePage>
        <Stack alignItems="center" sx={{ py: 10 }}>
          <CircularProgress />
        </Stack>
      </SitePage>
    );
  }

  if (status === 'not-found' || status === 'error' || !product) {
    return (
      <SitePage>
        <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
          {status === 'error' ? (
            <Alert severity="error">{t('product.loadError')}</Alert>
          ) : (
            <>
              <Typography variant="h4" component="h1" gutterBottom>
                {t('product.notFoundTitle')}
              </Typography>
              <Typography color="text.secondary" paragraph>
                {t('product.notFoundBody')}
              </Typography>
            </>
          )}
          <Button component={RouterLink} to={`/${locale}/shop`} variant="contained" sx={{ mt: 2 }}>
            {t('product.backToShop')}
          </Button>
        </Container>
      </SitePage>
    );
  }

  const name = pickLocalized(product.name, locale);
  const names = optionNames(product.variants);
  const chosenVariant = findVariant(product.variants, names, selection);
  const hasVariants = names.length > 0;
  const displayedListPrice = chosenVariant?.listPriceUsd ?? product.listPriceUsd;
  const mainImage = product.images[imageIndex];

  return (
    <SitePage>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs aria-label={t('shop.breadcrumb')} sx={{ mb: 3 }}>
          <Link component={RouterLink} to={`/${locale}/shop`} underline="hover" color="inherit">
            {t('shop.title')}
          </Link>
          {category && (
            <Link
              component={RouterLink}
              to={`/${locale}/shop?category=${category.slug}`}
              underline="hover"
              color="inherit"
            >
              {pickLocalized(category.name, locale)}
            </Link>
          )}
          <Typography color="text.primary">{name}</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'grid',
            gap: 5,
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <Box>
            {mainImage && (
              <Box
                component="img"
                data-testid="main-image"
                src={mainImage.url}
                alt={mainImage.alt || name}
                sx={{ width: '100%', maxHeight: 560, objectFit: 'contain', bgcolor: 'grey.50', borderRadius: 1 }}
              />
            )}
            {product.images.length > 1 && (
              <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: 'auto', pb: 1 }}>
                {product.images.map((image, index) => (
                  <ButtonBase
                    key={image.id}
                    aria-label={t('product.showImage', { n: index + 1 })}
                    onClick={() => setImageIndex(index)}
                    sx={{
                      flex: '0 0 auto',
                      border: 2,
                      borderColor: index === imageIndex ? 'primary.main' : 'transparent',
                      borderRadius: 1,
                    }}
                  >
                    <Box
                      component="img"
                      src={image.url}
                      alt=""
                      loading="lazy"
                      sx={{ height: 72, width: 72, objectFit: 'cover' }}
                    />
                  </ButtonBase>
                ))}
              </Stack>
            )}
          </Box>

          <Stack spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {product.brand.name}
              </Typography>
              {product.condition === 'used' && (
                <Chip size="small" color="secondary" label={t('product.usedLabel')} sx={{ ml: 1 }} />
              )}
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                {name}
              </Typography>
              <Typography color="text.secondary">{pickLocalized(product.summary, locale)}</Typography>
            </Box>

            <Price
              listPriceUsd={displayedListPrice}
              markupPercent={product.markupPercent}
              priceAmount={product.priceAmount}
              priceCurrency={product.priceCurrency}
              rates={rates}
            />

            {product.sold && <Alert severity="warning">{t('product.soldNotice')}</Alert>}
            {product.madeToOrder && <Alert severity="info">{t('product.madeToOrderNotice')}</Alert>}

            {product.condition === 'used' && !product.sold && (
              <Button
                variant="contained"
                color="secondary"
                size="large"
                href={buildProductWhatsappUrl(name, locale)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ alignSelf: 'flex-start' }}
              >
                {t('product.askOnWhatsapp')}
              </Button>
            )}

            {hasVariants && (
              <Stack spacing={1}>
                <VariantPicker variants={product.variants} selection={selection} onChange={setSelection} />
                {chosenVariant ? (
                  <Typography variant="caption" color="text.secondary">
                    {t('product.sku', { sku: chosenVariant.sku })}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {t('product.chooseAll')}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </Box>

        <Box sx={{ mt: 6, maxWidth: 800 }}>
          <SimpleMarkdown source={pickLocalized(product.descriptionMd, locale)} />
        </Box>

        {learnItems.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <LearnSection title={t('learn.beforeYouBuy')} items={learnItems} locale={locale} />
          </Box>
        )}

        {related.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
              {t('product.related')}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              }}
            >
              {related.map((item) => (
                <ProductCard key={item.id} product={item} locale={locale} rates={rates} />
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </SitePage>
  );
}
