import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Container,
  Link,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams } from 'react-router-dom';
import type { ExchangeRates, LearnItemDetail, LearnItemSummary, ProductSummary } from '@bendike/shared';
import { pickLocalized } from '@bendike/shared';
import { ApiError } from '../../api/http';
import { SitePage } from '../../components/site/SitePage';
import { useLocale } from '../../i18n/useLocale';
import { getExchangeRates, listProducts } from '../shop/catalog-api';
import { ProductCard } from '../shop/ProductCard';
import { EmbedPlayer } from './EmbedPlayer';
import { FormatIcon } from './FormatIcon';
import { getLearnItem, listRelatedLearnItems } from './learn-api';
import { LearnSection } from './LearnSection';

type Status = 'loading' | 'ready' | 'not-found' | 'error';

const RELATED_PRODUCTS = 4;

export function LearnItemPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<LearnItemDetail | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [related, setRelated] = useState<LearnItemSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setStatus('loading');
    setRelated([]);
    setProducts([]);
    getLearnItem(slug)
      .then((detail) => {
        if (cancelled) return;
        setItem(detail);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus(error instanceof ApiError && error.status === 404 ? 'not-found' : 'error');
      });
    listRelatedLearnItems(slug)
      .then((items) => {
        if (!cancelled) setRelated(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!item) return;
    const productIds = item.links.filter((link) => link.kind === 'product').map((link) => link.targetId);
    const brandIds = item.links.filter((link) => link.kind === 'brand').map((link) => link.targetId);
    if (productIds.length === 0 && brandIds.length === 0) return;
    let cancelled = false;
    getExchangeRates()
      .then((value) => {
        if (!cancelled) setRates(value);
      })
      .catch(() => undefined);
    listProducts({ pageSize: 48, locale })
      .then((page) => {
        if (cancelled) return;
        const own = page.items.filter((product) => productIds.includes(product.id));
        const ofBrand = page.items.filter(
          (product) => brandIds.includes(product.brand.id) && !productIds.includes(product.id),
        );
        setProducts([...own, ...ofBrand].slice(0, RELATED_PRODUCTS));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [item, locale]);

  if (status === 'loading') {
    return (
      <SitePage>
        <Stack alignItems="center" sx={{ py: 10 }}>
          <CircularProgress />
        </Stack>
      </SitePage>
    );
  }

  if (status !== 'ready' || !item) {
    return (
      <SitePage>
        <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
          {status === 'error' ? (
            <Alert severity="error">{t('learn.loadError')}</Alert>
          ) : (
            <>
              <Typography variant="h4" component="h1" gutterBottom>
                {t('learn.notFoundTitle')}
              </Typography>
              <Typography color="text.secondary" paragraph>
                {t('learn.notFoundBody')}
              </Typography>
            </>
          )}
          <Button component={RouterLink} to={`/${locale}/learn`} variant="contained" sx={{ mt: 2 }}>
            {t('learn.backToLearn')}
          </Button>
        </Container>
      </SitePage>
    );
  }

  const title = pickLocalized(item.title, locale);
  const pageUrl = typeof window === 'undefined' ? '' : window.location.href;
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`${title}\n${pageUrl}`)}`;

  function copyLink() {
    void navigator.clipboard?.writeText(pageUrl).then(() => setCopied(true));
  }

  return (
    <SitePage>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to={`/${locale}/learn`} underline="hover" color="inherit">
            {t('learn.title')}
          </Link>
          {item.topics[0] && (
            <Link
              component={RouterLink}
              to={`/${locale}/learn?topic=${item.topics[0]}`}
              underline="hover"
              color="inherit"
            >
              {t(`learn.topics.${item.topics[0]}`)}
            </Link>
          )}
          <Typography color="text.primary">{title}</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'grid',
            gap: 5,
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 7fr) minmax(0, 5fr)' },
            alignItems: 'start',
          }}
        >
          <Box>
            {item.embed ? (
              <EmbedPlayer embed={item.embed} title={title} thumbnailUrl={item.thumbnailUrl} />
            ) : item.thumbnailUrl ? (
              <Box
                component="img"
                src={item.thumbnailUrl}
                alt=""
                sx={{ width: '100%', borderRadius: 1, bgcolor: 'grey.100', maxHeight: 480, objectFit: 'cover' }}
              />
            ) : (
              <Box
                sx={{
                  aspectRatio: '16 / 9',
                  bgcolor: 'primary.main',
                  color: 'secondary.main',
                  borderRadius: 1,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <FormatIcon format={item.format} sx={{ fontSize: 72 }} />
              </Box>
            )}
          </Box>

          <Stack spacing={2.5}>
            <div>
              <Typography variant="caption" color="text.secondary">
                {item.sourceName}
              </Typography>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
                {title}
              </Typography>
              {item.author && (
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {t('learn.by', { author: item.author })}
                </Typography>
              )}
            </div>
            <Typography>{pickLocalized(item.summary, locale)}</Typography>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Chip
                size="small"
                icon={<FormatIcon format={item.format} fontSize="small" />}
                label={t(`learn.format.${item.format}`)}
              />
              {item.durationMinutes !== null && (
                <Chip size="small" variant="outlined" label={t('learn.minutes', { n: item.durationMinutes })} />
              )}
              <Chip size="small" variant="outlined" label={t(`learn.lang.${item.contentLanguage}`)} />
              <Chip size="small" variant="outlined" label={t(`learn.level.${item.level}`)} />
              {item.topics.map((topic) => (
                <Chip
                  key={topic}
                  size="small"
                  component={RouterLink}
                  to={`/${locale}/learn?topic=${topic}`}
                  clickable
                  label={t(`learn.topics.${topic}`)}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon />}
              >
                {t('learn.openAtSource')}
              </Button>
              {item.buyUrl && (
                <Button
                  variant="contained"
                  color="secondary"
                  href={item.buyUrl}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  startIcon={<ShoppingCartOutlinedIcon />}
                >
                  {t('learn.buy')}
                </Button>
              )}
              <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copyLink}>
                {t('learn.copyLink')}
              </Button>
              <Button
                variant="outlined"
                href={whatsappShare}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<WhatsAppIcon />}
              >
                {t('learn.shareWhatsapp')}
              </Button>
            </Stack>
            {item.buyUrl && item.affiliate && (
              <Typography variant="caption" color="text.secondary">
                {t('learn.affiliateDisclosure')}
              </Typography>
            )}
          </Stack>
        </Box>

        {products.length > 0 && (
          <Box component="section" aria-label={t('learn.relatedShop')} sx={{ mt: 8 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
              {t('learn.relatedShop')}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              }}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} rates={rates} />
              ))}
            </Box>
          </Box>
        )}

        {related.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <LearnSection title={t('learn.moreOnTopic')} items={related} locale={locale} />
          </Box>
        )}
      </Container>
      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        message={t('learn.linkCopied')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </SitePage>
  );
}
