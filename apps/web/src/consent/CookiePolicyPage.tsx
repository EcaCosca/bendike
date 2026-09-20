import {
  Box,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { SitePage } from '../components/site/SitePage';
import { CONTACT_EMAIL } from '../components/site/site-content';
import { POLICY_UPDATED, STORAGE_INVENTORY } from './storage-inventory';
import { useConsent } from './use-consent';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section">
      <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Stack spacing={1.5}>{children}</Stack>
    </Box>
  );
}

export function CookiePolicyPage() {
  const { openSettings } = useConsent();

  return (
    <SitePage>
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h3" component="h1">
              Cookie policy
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {`Last updated: ${POLICY_UPDATED}`}
            </Typography>
          </Box>

          <Section title="What cookies and browser storage are">
            <Typography>
              Cookies are small text files a website asks your browser to keep. Browser storage does the same job
              without being sent to the server with every request. Bendike uses both, and only for the reasons below. It
              does not use advertising or analytics tools.
            </Typography>
          </Section>

          <Section title="What Bendike stores">
            <Typography>
              Necessary items are always used, because the site does not work without them. Everything else waits for
              your permission.
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" aria-label="Cookies and browser storage">
                <TableHead>
                  <TableRow>
                    {['Name', 'Type', 'Category', 'What it is for', 'How long'].map((heading) => (
                      <TableCell key={heading} sx={{ fontWeight: 700 }}>
                        {heading}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {STORAGE_INVENTORY.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>{item.name}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.purpose}</TableCell>
                      <TableCell>{item.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          <Section title="Third parties">
            <Typography>
              When you allow third-party services and open the login or sign-up page, your browser loads Google Identity
              Services from Google so you can continue with your Google account. Google may set its own cookies and sees
              that your browser loaded the script. Bendike receives only the sign-in result from Google. If you do not
              allow it, the script is never loaded and you can still sign in with your email and password.
            </Typography>
          </Section>

          <Section title="Changing your choice">
            <Typography>
              You can change your choice at any time. Withdrawing permission for preferences deletes the remembered gear
              view and licence number straight away.
            </Typography>
            <Box>
              <Button variant="contained" onClick={openSettings}>
                Open cookie settings
              </Button>
            </Box>
          </Section>

          <Section title="Removing what is stored">
            <Typography>
              You can delete cookies and site data for Bendike in your browser&apos;s settings. Signing out removes the
              sign-in token. Cookies that Google has already set are removed the same way, in your browser, for the
              google.com domain.
            </Typography>
          </Section>

          <Section title="Contact">
            <Typography>
              Questions about this policy? Write to Eca at <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>
              .
            </Typography>
          </Section>
        </Stack>
      </Container>
    </SitePage>
  );
}
