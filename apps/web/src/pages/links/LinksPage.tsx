import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Role, type RiggerLinkView, type RiggerSummary } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
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
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load your links'));
  }, [reload]);

  if (!token || !user) return null;
  const isRigger = user.role === Role.Rigger;

  const run = (work: () => Promise<unknown>) => {
    setError(null);
    work().then(
      () => reload().catch(() => undefined),
      (err: unknown) => setError(err instanceof Error ? err.message : 'Something went wrong'),
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
      setError(err instanceof Error ? err.message : 'Could not search'),
    );
  };

  return (
    <AppShell>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          {isRigger ? 'Customers and dropzones' : 'My riggers'}
        </Typography>
        <Typography color="text.secondary">
          {isRigger
            ? 'A dropzone or customer appears here once you both agree. You then see their gear and can log work on it.'
            : 'A rigger can see your gear, log work on it and reach you on WhatsApp once you both agree.'}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}

        {incoming.length > 0 && (
          <Section title="Waiting for your answer">
            {incoming.map((l) => (
              <LinkCard
                key={l.id}
                link={l}
                actions={
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      aria-label={`Confirm ${l.counterpart.displayName}`}
                      onClick={() => run(() => confirmLink(token, l.id))}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="small"
                      aria-label={`Decline ${l.counterpart.displayName}`}
                      onClick={() => run(() => declineLink(token, l.id))}
                    >
                      Decline
                    </Button>
                  </>
                }
              />
            ))}
          </Section>
        )}

        <Section title={isRigger ? 'You look after' : 'Looking after your gear'}>
          {active.length === 0 && (
            <Typography color="text.secondary">
              {isRigger ? 'No customers or dropzones yet.' : 'No rigger yet.'}
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
                  aria-label={`End link with ${l.counterpart.displayName}`}
                  onClick={() => run(() => endLink(token, l.id))}
                >
                  End link
                </Button>
              }
            />
          ))}
        </Section>

        {outgoing.length > 0 && (
          <Section title="Waiting for the other side">
            {outgoing.map((l) => (
              <LinkCard
                key={l.id}
                link={l}
                actions={
                  <Button
                    color="inherit"
                    size="small"
                    aria-label={`Cancel request to ${l.counterpart.displayName}`}
                    onClick={() => run(() => endLink(token, l.id))}
                  >
                    Cancel
                  </Button>
                }
              />
            ))}
          </Section>
        )}

        {isRigger ? (
          <Stack component="form" spacing={1} onSubmit={addOwner}>
            <Typography variant="h6" component="h2">
              Add a customer or dropzone
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label="Email or WhatsApp phone"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                size="small"
                sx={{ flexGrow: 1 }}
                helperText="They need a Bendike account. Phones with the country code, like +54 9 341 555 0000"
              />
              <Button type="submit" variant="contained" sx={{ alignSelf: { sm: 'flex-start' } }}>
                Add
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack component="form" spacing={1} onSubmit={runSearch}>
            <Typography variant="h6" component="h2">
              Find a rigger
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label="Find a rigger by name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ flexGrow: 1 }}
              />
              <Button type="submit" variant="outlined">
                Search
              </Button>
            </Stack>
            {found?.length === 0 && <Typography color="text.secondary">No riggers found.</Typography>}
            {found?.map((rigger) => (
              <Stack key={rigger.id} direction="row" spacing={2} alignItems="center">
                <Typography sx={{ flexGrow: 1 }}>{rigger.displayName}</Typography>
                <Button
                  size="small"
                  variant="contained"
                  aria-label={`Ask ${rigger.displayName}`}
                  onClick={() => run(() => createLink(token, { riggerId: rigger.id }))}
                >
                  Ask
                </Button>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </AppShell>
  );
}
