import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { LearnCollectionDetail, LearnItemSummary, Page } from '@bendike/shared';
import {
  CONTENT_LANGUAGES,
  LEARN_FORMATS,
  LEARN_LEVELS,
  LEARN_SORTS,
  LEARN_TOPICS,
  pickLocalized,
} from '@bendike/shared';
import { SitePage } from '../../components/site/SitePage';
import { useLocale } from '../../i18n/useLocale';
import { LearnCard } from './LearnCard';
import { listLearnCollections, listLearnItems } from './learn-api';
import { applyLearnPatch, hasActiveFilters, parseLearnQuery, type LearnFilterPatch } from './learn-query';
import { SuggestionBox } from './SuggestionBox';

export function LearnPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => parseLearnQuery(params, locale), [params, locale]);

  const [result, setResult] = useState<Page<LearnItemSummary> | null>(null);
  const [startHere, setStartHere] = useState<LearnCollectionDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [searchText, setSearchText] = useState(query.q ?? '');

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    listLearnItems(query)
      .then((page) => {
        if (!cancelled) setResult(page);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    if (!query.topic) {
      setStartHere(null);
      return;
    }
    let cancelled = false;
    listLearnCollections(query.topic)
      .then((collections) => {
        if (!cancelled) setStartHere(collections.find((collection) => collection.startHere) ?? null);
      })
      .catch(() => {
        if (!cancelled) setStartHere(null);
      });
    return () => {
      cancelled = true;
    };
  }, [query.topic]);

  useEffect(() => {
    setSearchText(query.q ?? '');
  }, [query.q]);

  function update(patch: LearnFilterPatch) {
    setParams(applyLearnPatch(params, patch));
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
    update({ q: searchText.trim() });
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <SitePage>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          {t('learn.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: 720 }}>
          {t('learn.intro')}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: 'wrap', mb: 3 }}
          component="nav"
          aria-label={t('learn.topic')}
        >
          <Chip
            label={t('learn.allTopics')}
            color={query.topic ? 'default' : 'primary'}
            variant={query.topic ? 'outlined' : 'filled'}
            onClick={() => update({ topic: undefined })}
          />
          {LEARN_TOPICS.map((topic) => (
            <Chip
              key={topic}
              label={t(`learn.topics.${topic}`)}
              color={query.topic === topic ? 'primary' : 'default'}
              variant={query.topic === topic ? 'filled' : 'outlined'}
              onClick={() => update({ topic: query.topic === topic ? undefined : topic })}
            />
          ))}
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
          <Box component="form" role="search" onSubmit={submitSearch} sx={{ flexGrow: 1 }}>
            <TextField
              size="small"
              fullWidth
              type="search"
              placeholder={t('learn.searchPlaceholder')}
              inputProps={{ 'aria-label': t('learn.searchPlaceholder') }}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </Box>
          <Select
            size="small"
            displayEmpty
            value={query.type ?? ''}
            inputProps={{ 'aria-label': t('learn.formatLabel') }}
            onChange={(event) => update({ type: event.target.value })}
          >
            <MenuItem value="">{t('learn.allFormats')}</MenuItem>
            {LEARN_FORMATS.map((format) => (
              <MenuItem key={format} value={format}>
                {t(`learn.format.${format}`)}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            displayEmpty
            value={query.level ?? ''}
            inputProps={{ 'aria-label': t('learn.levelLabel') }}
            onChange={(event) => update({ level: event.target.value })}
          >
            <MenuItem value="">{t('learn.allLevels')}</MenuItem>
            {LEARN_LEVELS.map((level) => (
              <MenuItem key={level} value={level}>
                {t(`learn.level.${level}`)}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            displayEmpty
            value={query.lang ?? ''}
            inputProps={{ 'aria-label': t('learn.language') }}
            onChange={(event) => update({ lang: event.target.value })}
          >
            <MenuItem value="">{t('learn.allLanguages')}</MenuItem>
            {CONTENT_LANGUAGES.map((lang) => (
              <MenuItem key={lang} value={lang}>
                {t(`learn.lang.${lang}`)}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            displayEmpty
            value={query.sort ?? ''}
            inputProps={{ 'aria-label': t('learn.sortLabel') }}
            onChange={(event) => update({ sort: event.target.value })}
          >
            <MenuItem value="">{t('learn.sortLabel')}</MenuItem>
            {LEARN_SORTS.map((sort) => (
              <MenuItem key={sort} value={sort}>
                {t(`learn.sort.${sort}`)}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        {startHere && startHere.items.length > 0 && (
          <Box
            component="section"
            aria-label={t('learn.startHere')}
            sx={{ mb: 5, p: { xs: 2.5, md: 3 }, bgcolor: 'primary.main', color: 'common.white', borderRadius: 1 }}
          >
            <Typography variant="overline" sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: '0.14em' }}>
              {t('learn.startHere')}
            </Typography>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              {pickLocalized(startHere.title, locale)}
            </Typography>
            <Typography sx={{ mt: 1, mb: 2.5, opacity: 0.85, maxWidth: 720 }}>
              {pickLocalized(startHere.intro, locale)}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              }}
            >
              {startHere.items.map((item) => (
                <LearnCard key={item.id} item={item} locale={locale} compact />
              ))}
            </Box>
          </Box>
        )}

        {failed && <Alert severity="error">{t('learn.loadError')}</Alert>}

        {!failed && result && result.items.length === 0 && (
          <Stack spacing={2} alignItems="flex-start" sx={{ mb: 5 }}>
            <Typography>{t('learn.noResults')}</Typography>
            {hasActiveFilters(query) && (
              <Button variant="outlined" onClick={() => setParams(new URLSearchParams())}>
                {t('learn.clearFilters')}
              </Button>
            )}
          </Stack>
        )}

        {!failed && result && result.items.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              }}
            >
              {result.items.map((item) => (
                <LearnCard key={item.id} item={item} locale={locale} />
              ))}
            </Box>
            {totalPages > 1 && (
              <Stack alignItems="center" sx={{ mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={query.page ?? 1}
                  onChange={(_event, page) => goToPage(page)}
                  aria-label={t('learn.pagination')}
                />
              </Stack>
            )}
          </Box>
        )}

        <SuggestionBox locale={locale} />

        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 3 }}>
          {t('learn.affiliateDisclosure')}
        </Typography>
      </Container>
    </SitePage>
  );
}
