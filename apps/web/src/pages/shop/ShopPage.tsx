import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Link,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import type { Brand, Category, ExchangeRates, Page, ProductSummary } from '@bendike/shared';
import { pickLocalized } from '@bendike/shared';
import { SitePage } from '../../components/site/SitePage';
import { useLocale } from '../../i18n/useLocale';
import { getExchangeRates, listBrands, listCategories, listProducts } from './catalog-api';
import { applyFilterPatch, parseCatalogQuery, type FilterPatch } from './catalog-query';
import { childrenOf, pathTo, topLevel } from './category-tree';
import { ProductCard } from './ProductCard';

const SORT_OPTIONS = ['name', 'price-asc', 'price-desc'] as const;
const AVAILABILITY_OPTIONS = ['in-stock', 'made-to-order'] as const;
const CONDITION_OPTIONS = ['new', 'used'] as const;

export function ShopPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => parseCatalogQuery(params, locale), [params, locale]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [result, setResult] = useState<Page<ProductSummary> | null>(null);
  const [failed, setFailed] = useState(false);
  const [searchText, setSearchText] = useState(query.search ?? '');

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => undefined);
    listBrands()
      .then(setBrands)
      .catch(() => undefined);
    getExchangeRates()
      .then(setRates)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    listProducts(query)
      .then((page) => {
        if (!cancelled) {
          setResult(page);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    setSearchText(query.search ?? '');
  }, [query.search]);

  function updateFilters(patch: FilterPatch) {
    setParams(applyFilterPatch(params, patch));
  }

  function goToPage(page: number) {
    const next = new URLSearchParams(params);
    if (page <= 1) {
      next.delete('page');
    } else {
      next.set('page', String(page));
    }
    setParams(next);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    updateFilters({ search: searchText.trim() });
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  const trail = query.categorySlug ? pathTo(categories, query.categorySlug) : [];

  return (
    <SitePage>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs aria-label={t('shop.breadcrumb')} sx={{ mb: 2 }}>
          {trail.length === 0 ? (
            <Typography color="text.primary">{t('shop.title')}</Typography>
          ) : (
            <Link component={RouterLink} to={`/${locale}/shop`} underline="hover" color="inherit">
              {t('shop.title')}
            </Link>
          )}
          {trail.map((category, index) =>
            index === trail.length - 1 ? (
              <Typography key={category.id} color="text.primary">
                {pickLocalized(category.name, locale)}
              </Typography>
            ) : (
              <Link
                key={category.id}
                component={RouterLink}
                to={`/${locale}/shop?category=${category.slug}`}
                underline="hover"
                color="inherit"
              >
                {pickLocalized(category.name, locale)}
              </Link>
            ),
          )}
        </Breadcrumbs>

        <Box
          sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '240px minmax(0, 1fr)' } }}
        >
          <Stack spacing={3} component="aside">
            <Box component="nav" aria-label={t('shop.categories')}>
              <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('shop.categories')}
              </Typography>
              <List dense disablePadding>
                <ListItemButton selected={!query.categorySlug} onClick={() => updateFilters({ category: undefined })}>
                  <ListItemText primary={t('shop.allCategories')} />
                </ListItemButton>
                {topLevel(categories).map((category) => (
                  <Box key={category.id}>
                    <ListItemButton
                      selected={query.categorySlug === category.slug}
                      onClick={() => updateFilters({ category: category.slug })}
                    >
                      <ListItemText primary={pickLocalized(category.name, locale)} />
                    </ListItemButton>
                    {childrenOf(categories, category.id).map((child) => (
                      <ListItemButton
                        key={child.id}
                        selected={query.categorySlug === child.slug}
                        onClick={() => updateFilters({ category: child.slug })}
                        sx={{ pl: 4 }}
                      >
                        <ListItemText primary={pickLocalized(child.name, locale)} />
                      </ListItemButton>
                    ))}
                  </Box>
                ))}
              </List>
            </Box>

            <Select
              size="small"
              displayEmpty
              value={query.brandSlug ?? ''}
              inputProps={{ 'aria-label': t('shop.brand') }}
              onChange={(event) => updateFilters({ brand: event.target.value })}
            >
              <MenuItem value="">{t('shop.allBrands')}</MenuItem>
              {brands.map((brand) => (
                <MenuItem key={brand.id} value={brand.slug}>
                  {brand.name}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              displayEmpty
              value={query.condition ?? ''}
              inputProps={{ 'aria-label': t('shop.condition') }}
              onChange={(event) => updateFilters({ condition: event.target.value })}
            >
              <MenuItem value="">{t('shop.anyCondition')}</MenuItem>
              {CONDITION_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {t(`shop.conditionOptions.${option}`)}
                </MenuItem>
              ))}
            </Select>

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={query.includeSold === true}
                  onChange={(event) => updateFilters({ sold: event.target.checked ? '1' : undefined })}
                />
              }
              label={t('shop.includeSold')}
            />

            <Select
              size="small"
              displayEmpty
              value={query.availability ?? ''}
              inputProps={{ 'aria-label': t('shop.availability') }}
              onChange={(event) => updateFilters({ availability: event.target.value })}
            >
              <MenuItem value="">{t('shop.anyAvailability')}</MenuItem>
              {AVAILABILITY_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {t(`shop.availabilityOptions.${option}`)}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <Box component="form" onSubmit={submitSearch} sx={{ flexGrow: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  type="search"
                  placeholder={t('shop.searchPlaceholder')}
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </Box>
              <Select
                size="small"
                displayEmpty
                value={query.sort ?? ''}
                inputProps={{ 'aria-label': t('shop.sortLabel') }}
                onChange={(event) => updateFilters({ sort: event.target.value })}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">{t('shop.sortLabel')}</MenuItem>
                {SORT_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {t(`shop.sort.${option}`)}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            {failed && <Alert severity="error">{t('shop.loadError')}</Alert>}

            {!failed && result && result.items.length === 0 && (
              <Stack spacing={2} alignItems="flex-start">
                <Typography>{t('shop.noResults')}</Typography>
                <Button variant="outlined" onClick={() => setParams(new URLSearchParams())}>
                  {t('shop.clearFilters')}
                </Button>
              </Stack>
            )}

            {!failed && result && result.items.length > 0 && (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  }}
                >
                  {result.items.map((product) => (
                    <ProductCard key={product.id} product={product} locale={locale} rates={rates} />
                  ))}
                </Box>
                {totalPages > 1 && (
                  <Stack alignItems="center" sx={{ mt: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={query.page ?? 1}
                      onChange={(_event, page) => goToPage(page)}
                      aria-label={t('shop.pagination')}
                    />
                  </Stack>
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>
    </SitePage>
  );
}
