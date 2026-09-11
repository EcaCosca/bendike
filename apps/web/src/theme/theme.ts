import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0B2545', light: '#1F4E8C', dark: '#061428' },
    secondary: { main: '#F26419', light: '#FF8A4C', dark: '#C24B0A', contrastText: '#FFFFFF' },
    background: { default: '#F7F9FC', paper: '#FFFFFF' },
    text: { primary: '#0B1B2B', secondary: '#4A5B6E' },
    divider: 'rgba(11, 37, 69, 0.12)',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { paddingInline: 20 } },
    },
    MuiCard: {
      styleOverrides: { root: { borderColor: 'rgba(11, 37, 69, 0.12)' } },
    },
  },
});
