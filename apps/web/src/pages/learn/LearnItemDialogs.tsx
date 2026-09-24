import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  ListItemText,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type FormEvent, type ReactNode } from 'react';
import type {
  Brand,
  ContentLanguage,
  CreateLearnItemRequestBody,
  GearModelView,
  LearnCopyField,
  LearnFormat,
  LearnItemAdminDetail,
  LearnLevel,
  LearnLink,
  LearnTopic,
  Locale,
  ProductSummary,
  UpdateLearnItemRequestBody,
} from '@bendike/shared';
import {
  CONTENT_LANGUAGES,
  LEARN_COPY_FIELDS,
  LEARN_FORMATS,
  LEARN_LEVELS,
  LEARN_TOPICS,
  LOCALES,
  isHttpsUrl,
  parseEmbed,
  slugify,
  youtubeThumbnail,
} from '@bendike/shared';
import { replaceLearnLinks, updateLearnCopy, updateLearnItem } from './learn-admin-api';
import { PROVIDER_NAMES, TOPIC_LABELS } from './learn-labels';

const LANGUAGE_LABELS: Record<ContentLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  other: 'Other',
};

function toOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

interface DetailsState {
  url: string;
  format: LearnFormat;
  sourceName: string;
  author: string;
  contentLanguage: ContentLanguage;
  topics: LearnTopic[];
  level: LearnLevel;
  durationMinutes: string;
  publishedAt: string;
  buyUrl: string;
  affiliate: boolean;
  position: string;
}

function detailsOf(item?: LearnItemAdminDetail): DetailsState {
  return {
    url: item?.url ?? '',
    format: item?.format ?? 'video',
    sourceName: item?.sourceName ?? '',
    author: item?.author ?? '',
    contentLanguage: item?.contentLanguage ?? 'en',
    topics: item?.topics ?? [],
    level: item?.level ?? 'all',
    durationMinutes: item?.durationMinutes?.toString() ?? '',
    publishedAt: item?.publishedAt ?? '',
    buyUrl: item?.buyUrl ?? '',
    affiliate: item?.affiliate ?? false,
    position: item?.position?.toString() ?? '0',
  };
}

function EmbedPreview({ url }: { url: string }) {
  const embed = parseEmbed(url);
  if (!embed) {
    return url.trim() ? (
      <Typography variant="caption" color="text.secondary">
        No player recognised for this link; it will open at the source.
      </Typography>
    ) : null;
  }
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      {embed.provider === 'youtube' && (
        <img src={youtubeThumbnail(embed.id)} alt="" width={96} height={54} style={{ objectFit: 'cover' }} />
      )}
      <Typography variant="caption" color="text.secondary">
        {PROVIDER_NAMES[embed.provider]} {embed.kind} recognised: {embed.id}
      </Typography>
    </Stack>
  );
}

function DetailsFields({
  value,
  onChange,
  children,
}: {
  value: DetailsState;
  onChange: (next: DetailsState) => void;
  children?: ReactNode;
}) {
  const set = <K extends keyof DetailsState>(key: K, next: DetailsState[K]) => onChange({ ...value, [key]: next });
  return (
    <>
      <TextField label="Link (https)" value={value.url} onChange={(e) => set('url', e.target.value)} required />
      <EmbedPreview url={value.url} />
      {children}
      <Stack direction="row" spacing={2}>
        <TextField
          select
          label="Format"
          value={value.format}
          onChange={(e) => set('format', e.target.value as LearnFormat)}
          sx={{ flex: 1 }}
        >
          {LEARN_FORMATS.map((format) => (
            <MenuItem key={format} value={format}>
              {format}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Level"
          value={value.level}
          onChange={(e) => set('level', e.target.value as LearnLevel)}
          sx={{ flex: 1 }}
        >
          {LEARN_LEVELS.map((level) => (
            <MenuItem key={level} value={level}>
              {level}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Content language"
          value={value.contentLanguage}
          onChange={(e) => set('contentLanguage', e.target.value as ContentLanguage)}
          sx={{ flex: 1 }}
        >
          {CONTENT_LANGUAGES.map((lang) => (
            <MenuItem key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <TextField
        select
        label="Topics"
        value={value.topics}
        onChange={(e) => set('topics', e.target.value as unknown as LearnTopic[])}
        slotProps={{
          select: {
            multiple: true,
            renderValue: (selected) => (selected as LearnTopic[]).map((topic) => TOPIC_LABELS[topic]).join(', '),
          },
        }}
      >
        {LEARN_TOPICS.map((topic) => (
          <MenuItem key={topic} value={topic}>
            <Checkbox size="small" checked={value.topics.includes(topic)} />
            <ListItemText primary={TOPIC_LABELS[topic]} />
          </MenuItem>
        ))}
      </TextField>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Source name"
          value={value.sourceName}
          onChange={(e) => set('sourceName', e.target.value)}
          required
          sx={{ flex: 1 }}
        />
        <TextField
          label="Author (optional)"
          value={value.author}
          onChange={(e) => set('author', e.target.value)}
          sx={{ flex: 1 }}
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Duration in minutes (optional)"
          value={value.durationMinutes}
          onChange={(e) => set('durationMinutes', e.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Published on (optional)"
          type="date"
          value={value.publishedAt}
          onChange={(e) => set('publishedAt', e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Position"
          value={value.position}
          onChange={(e) => set('position', e.target.value)}
          sx={{ width: 110 }}
        />
      </Stack>
      <TextField
        label="Buy link (optional, https)"
        value={value.buyUrl}
        onChange={(e) => set('buyUrl', e.target.value)}
        helperText="An Amazon Associates link goes here. Tick the box below so the disclosure is shown."
      />
      <FormControlLabel
        control={<Checkbox checked={value.affiliate} onChange={(e) => set('affiliate', e.target.checked)} />}
        label="The buy link is an affiliate link"
      />
    </>
  );
}

function validateDetails(value: DetailsState): string | null {
  if (!isHttpsUrl(value.url)) return 'The link must start with https://.';
  if (value.topics.length === 0) return 'Pick at least one topic.';
  if (!value.sourceName.trim()) return 'Enter the source name.';
  if (value.buyUrl.trim() && !isHttpsUrl(value.buyUrl)) return 'The buy link must start with https://.';
  if (value.durationMinutes.trim() && toOptionalNumber(value.durationMinutes) === null) {
    return 'Duration must be a whole number of minutes.';
  }
  return null;
}

function detailsBody(value: DetailsState): UpdateLearnItemRequestBody {
  return {
    url: value.url.trim(),
    format: value.format,
    sourceName: value.sourceName.trim(),
    contentLanguage: value.contentLanguage,
    topics: value.topics,
    level: value.level,
    author: value.author.trim() || null,
    durationMinutes: toOptionalNumber(value.durationMinutes),
    publishedAt: value.publishedAt.trim() || null,
    buyUrl: value.buyUrl.trim() || null,
    affiliate: value.affiliate,
    position: Number.parseInt(value.position, 10) || 0,
  };
}

interface LearnItemCreateDialogProps {
  onClose: () => void;
  onCreate: (body: CreateLearnItemRequestBody) => Promise<void>;
}

export function LearnItemCreateDialog({ onClose, onCreate }: LearnItemCreateDialogProps) {
  const [details, setDetails] = useState<DetailsState>(detailsOf());
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const problem = validateDetails(details);
    if (problem) {
      setError(problem);
      return;
    }
    const finalSlug = slug.trim() || slugify(title);
    if (!finalSlug) {
      setError('Enter a title or a slug.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body = detailsBody(details);
      await onCreate({
        slug: finalSlug,
        url: body.url ?? details.url,
        format: details.format,
        title: title.trim(),
        summary: summary.trim(),
        sourceName: details.sourceName.trim(),
        contentLanguage: details.contentLanguage,
        topics: details.topics,
        level: details.level,
        author: body.author,
        durationMinutes: body.durationMinutes,
        publishedAt: body.publishedAt,
        buyUrl: body.buyUrl,
        affiliate: details.affiliate,
        position: body.position,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the item');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>Add item</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Alert severity="info">
            Paste the link first. YouTube, Spotify and Vimeo players are recognised from it. Write the title and summary
            in English; Spanish and Portuguese are translated automatically and can be edited afterwards.
          </Alert>
          <DetailsFields value={details} onChange={setDetails}>
            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <TextField
              label="Summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              multiline
              minRows={2}
              required
            />
            <TextField
              label="Slug (optional, from the title if empty)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              helperText={slug.trim() ? '' : slugify(title) || ' '}
            />
          </DetailsFields>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          Add item
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface LearnItemEditDialogProps {
  item: LearnItemAdminDetail;
  token: string;
  onClose: () => void;
  onSaved: (updated: LearnItemAdminDetail) => void;
}

type CopyValues = Record<Locale, Record<LearnCopyField, string>>;

function initialCopy(item: LearnItemAdminDetail): CopyValues {
  const values = {} as CopyValues;
  for (const locale of LOCALES) {
    values[locale] = { title: item.title[locale], summary: item.summary[locale] };
  }
  return values;
}

export function LearnItemEditDialog({ item, token, onClose, onSaved }: LearnItemEditDialogProps) {
  const [details, setDetails] = useState<DetailsState>(detailsOf(item));
  const [locale, setLocale] = useState<Locale>('en');
  const [copy, setCopy] = useState<CopyValues>(() => initialCopy(item));
  const [saved, setSaved] = useState<LearnItemAdminDetail>(item);
  const [message, setMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);

  async function saveDetails() {
    const problem = validateDetails(details);
    if (problem) {
      setMessage({ severity: 'error', text: problem });
      return;
    }
    try {
      const updated = await updateLearnItem(token, item.id, detailsBody(details));
      setSaved(updated);
      onSaved(updated);
      setMessage({ severity: 'success', text: 'Details saved.' });
    } catch (err) {
      setMessage({ severity: 'error', text: err instanceof Error ? err.message : 'Could not save' });
    }
  }

  async function saveCopy() {
    let latest = saved;
    try {
      for (const field of LEARN_COPY_FIELDS) {
        const value = copy[locale][field].trim();
        if (value && value !== latest[field][locale]) {
          latest = await updateLearnCopy(token, item.id, { field, locale, value });
        }
      }
      setSaved(latest);
      onSaved(latest);
      setMessage({ severity: 'success', text: `${locale.toUpperCase()} copy saved.` });
    } catch (err) {
      setMessage({ severity: 'error', text: err instanceof Error ? err.message : 'Could not save the copy' });
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit: {item.title.en}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {message && <Alert severity={message.severity}>{message.text}</Alert>}
          <DetailsFields value={details} onChange={setDetails} />
          <Button variant="contained" onClick={() => void saveDetails()} sx={{ alignSelf: 'flex-start' }}>
            Save details
          </Button>
          <Divider />
          <Typography variant="subtitle1">Title and summary</Typography>
          <Tabs value={locale} onChange={(_event, next: Locale) => setLocale(next)} aria-label="Copy language">
            {LOCALES.map((option) => (
              <Tab key={option} value={option} label={option.toUpperCase()} />
            ))}
          </Tabs>
          <TextField
            label={`Title (${locale.toUpperCase()})`}
            value={copy[locale].title}
            onChange={(e) => setCopy({ ...copy, [locale]: { ...copy[locale], title: e.target.value } })}
          />
          <TextField
            label={`Summary (${locale.toUpperCase()})`}
            value={copy[locale].summary}
            onChange={(e) => setCopy({ ...copy, [locale]: { ...copy[locale], summary: e.target.value } })}
            multiline
            minRows={2}
          />
          <Button variant="outlined" onClick={() => void saveCopy()} sx={{ alignSelf: 'flex-start' }}>
            Save {locale.toUpperCase()} copy
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

interface LearnLinksDialogProps {
  item: LearnItemAdminDetail;
  token: string;
  products: ProductSummary[];
  brands: Brand[];
  models: GearModelView[];
  onClose: () => void;
  onSaved: (updated: LearnItemAdminDetail) => void;
}

function idsOf(links: LearnLink[], kind: LearnLink['kind']): string[] {
  return links.filter((link) => link.kind === kind).map((link) => link.targetId);
}

export function LearnLinksDialog({ item, token, products, brands, models, onClose, onSaved }: LearnLinksDialogProps) {
  const [productIds, setProductIds] = useState<string[]>(() => idsOf(item.links, 'product'));
  const [brandIds, setBrandIds] = useState<string[]>(() => idsOf(item.links, 'brand'));
  const [modelIds, setModelIds] = useState<string[]>(() => idsOf(item.links, 'gear_model'));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await replaceLearnLinks(token, item.id, {
        links: [
          ...productIds.map((targetId) => ({ kind: 'product' as const, targetId })),
          ...brandIds.map((targetId) => ({ kind: 'brand' as const, targetId })),
          ...modelIds.map((targetId) => ({ kind: 'gear_model' as const, targetId })),
        ],
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the links');
      setSaving(false);
    }
  }

  const multi = (renderValue: (selected: string[]) => string) => ({
    select: { multiple: true, renderValue: (selected: unknown) => renderValue(selected as string[]) },
  });

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Links: {item.title.en}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2" color="text.secondary">
            Linked products show this item under &quot;Learn before you buy&quot;. Brand links cover every product of
            the brand. Gear model links show it on rigs with that model under &quot;Learn about your gear&quot;.
          </Typography>
          <TextField
            select
            label="Products"
            value={productIds}
            onChange={(e) => setProductIds(e.target.value as unknown as string[])}
            slotProps={multi((selected) =>
              selected.map((id) => products.find((p) => p.id === id)?.name.en ?? id).join(', '),
            )}
          >
            {products.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                <Checkbox size="small" checked={productIds.includes(product.id)} />
                <ListItemText primary={product.name.en} secondary={product.brand.name} />
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Brands"
            value={brandIds}
            onChange={(e) => setBrandIds(e.target.value as unknown as string[])}
            slotProps={multi((selected) =>
              selected.map((id) => brands.find((b) => b.id === id)?.name ?? id).join(', '),
            )}
          >
            {brands.map((brand) => (
              <MenuItem key={brand.id} value={brand.id}>
                <Checkbox size="small" checked={brandIds.includes(brand.id)} />
                <ListItemText primary={brand.name} />
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Gear models"
            value={modelIds}
            onChange={(e) => setModelIds(e.target.value as unknown as string[])}
            slotProps={multi((selected) =>
              selected
                .map((id) => {
                  const model = models.find((m) => m.id === id);
                  return model ? `${model.manufacturer} ${model.model}` : id;
                })
                .join(', '),
            )}
          >
            {models.map((model) => (
              <MenuItem key={model.id} value={model.id}>
                <Checkbox size="small" checked={modelIds.includes(model.id)} />
                <ListItemText primary={`${model.manufacturer} ${model.model}`} secondary={model.kind} />
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => void save()} disabled={saving}>
          Save links
        </Button>
      </DialogActions>
    </Dialog>
  );
}
