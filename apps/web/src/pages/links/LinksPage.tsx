import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Role, type RiggerLinkView, type RiggerSummary } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import '../../i18n/i18n';
import { confirmLink, createLink, declineLink, endLink, listLinks, searchRiggers } from './links-api';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" aria-label={title}>
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Stack spacing={1}>{children}</Stack>
    </Box>
  );
}

function LinkCard({ link, actions }: { link: RiggerLinkView; actions: ReactNode }) {
  const contact = [link.counterpart.phone, link.counterpart.email].filter(Boolean).join(' · ');
  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>{link.counterpart.displayName}</Typography>
            {contact && (
              <Typography variant="body2" color="text.secondary">
                {contact}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            {actions}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function LinksPage() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const [links, setLinks] = useState<RiggerLinkView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState('');
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<RiggerSummary[] | null>(null);

  const reload = useCallback(async () => {
    if (token) setLinks(await listLinks(token));
  }, [token]);

  useEffect(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : t('work.links.loadFailed')));
  }, [reload, t]);

  if (!token || !user) return null;
  const isRigger = user.role === Role.Rigger;

  const run = (work: () => Promise<unknown>) => {
    setError(null);
    work().then(
      () => reload().catch(() => undefined),
      (err: unknown) => setError(err instanceof Error ? err.message : t('work.links.failed')),
    );
  };

  const active = links.filter((l) => l.status === 'active');
  const incoming = links.filter((l) => l.status === 'pending' && l.direction === 'incoming');
  const outgoing = links.filter((l) => l.status === 'pending' && l.direction === 'outgoing');

  const addOwner = (event: FormEvent) => {
    event.preventDefault();
    const value = contact.trim();
    if (!value) return;
    run(async () => {
      await createLink(token, value.includes('@') ? { ownerEmail: value } : { ownerPhone: value });
      setContact('');
    });
  };

  const runSearch = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    searchRiggers(token, search.trim()).then(setFound, (err: unknown) =>
      setError(err instanceof Error ? err.message : t('work.links.searchFailed')),
    );
  };

  return (
    <AppShell>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          {isRigger ? t('work.links.titleRigger') : t('work.links.titleOwner')}
        </Typography>
        <Typography color="text.secondary">
          {isRigger ? t('work.links.introRigger') : t('work.links.introOwner')}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}

        {incoming.length > 0 && (
          <Section title={t('work.links.waitingForYou')}>
            {incoming.map((l) => (
              <LinkCard
                key={l.id}
                link={l}
                actions={
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      aria-label={t('work.links.confirmNamed', { name: l.counterpart.displayName })}
                      onClick={() => run(() => confirmLink(token, l.id))}
                    >
                      {t('work.links.confirm')}
                    </Button>
                    <Button
                      size="small"
                      aria-label={t('work.links.declineNamed', { name: l.counterpart.displayName })}
                      onClick={() => run(() => declineLink(token, l.id))}
                    >
                      {t('work.links.decline')}
                    </Button>
                  </>
                }
              />
            ))}
          </Section>
        )}

        <Section title={isRigger ? t('work.links.youLookAfter') : t('work.links.lookingAfterYourGear')}>
          {active.length === 0 && (
            <Typography color="text.secondary">
              {isRigger ? t('work.links.noCustomers') : t('work.links.noRigger')}
            </Typography>
          )}
          {active.map((l) => (
            <LinkCard
              key={l.id}
              link={l}
              actions={
                <Button
                  color="inherit"
                  size="small"
                  aria-label={t('work.links.endLinkNamed', { name: l.counterpart.displayName })}
                  onClick={() => run(() => endLink(token, l.id))}
                >
                  {t('work.links.endLink')}
                </Button>
              }
            />
          ))}
        </Section>

        {outgoing.length > 0 && (
          <Section title={t('work.links.waitingForOther')}>
            {outgoing.map((l) => (
              <LinkCard
                key={l.id}
                link={l}
                actions={
                  <Button
                    color="inherit"
                    size="small"
                    aria-label={t('work.links.cancelNamed', { name: l.counterpart.displayName })}
                    onClick={() => run(() => endLink(token, l.id))}
                  >
                    {t('work.links.cancel')}
                  </Button>
                }
              />
            ))}
          </Section>
        )}

        {isRigger ? (
          <Stack component="form" spacing={1} onSubmit={addOwner}>
            <Typography variant="h6" component="h2">
              {t('work.links.addTitle')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label={t('work.links.contact')}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                size="small"
                sx={{ flexGrow: 1 }}
                helperText={t('work.links.contactHint')}
              />
              <Button type="submit" variant="contained" sx={{ alignSelf: { sm: 'flex-start' } }}>
                {t('work.links.add')}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack component="form" spacing={1} onSubmit={runSearch}>
            <Typography variant="h6" component="h2">
              {t('work.links.findTitle')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label={t('work.links.findByName')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ flexGrow: 1 }}
              />
              <Button type="submit" variant="outlined">
                {t('work.links.search')}
              </Button>
            </Stack>
            {found?.length === 0 && <Typography color="text.secondary">{t('work.links.noRiggersFound')}</Typography>}
            {found?.map((rigger) => (
              <Stack key={rigger.id} direction="row" spacing={2} alignItems="center">
                <Typography sx={{ flexGrow: 1 }}>{rigger.displayName}</Typography>
                <Button
                  size="small"
                  variant="contained"
                  aria-label={t('work.links.askNamed', { name: rigger.displayName })}
                  onClick={() => run(() => createLink(token, { riggerId: rigger.id }))}
                >
                  {t('work.links.ask')}
                </Button>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </AppShell>
  );
}
