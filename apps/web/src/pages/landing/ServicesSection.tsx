import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import { Box, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material';
import type { ReactElement } from 'react';
import { SERVICES, SERVICES_HEADING } from './landing-content';

const SERVICE_ICONS: readonly ReactElement[] = [
  <BuildOutlinedIcon key="rigging" fontSize="large" color="secondary" />,
  <EventAvailableOutlinedIcon key="tracking" fontSize="large" color="secondary" />,
  <NotificationsActiveOutlinedIcon key="bulletins" fontSize="large" color="secondary" />,
  <CodeOutlinedIcon key="software" fontSize="large" color="secondary" />,
];

export function ServicesSection() {
  return (
    <Box component="section" id="services" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Stack spacing={5}>
          <Typography variant="h2" component="h2" sx={{ fontSize: { xs: '2rem', md: '2.75rem' } }}>
            {SERVICES_HEADING}
          </Typography>
          <Grid container spacing={3}>
            {SERVICES.map((service, index) => (
              <Grid key={service.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {SERVICE_ICONS[index]}
                      <Typography variant="h6" component="h3">
                        {service.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {service.body}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
