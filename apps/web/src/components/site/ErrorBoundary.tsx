import { Button, Container, Stack, Typography } from '@mui/material';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  crashed: boolean;
}

/**
 * The last line before a white screen.
 *
 * Bendike is client-rendered, so an unhandled render error blanks the whole page:
 * a rigger halfway through logging a repack would have seen nothing at all and had
 * no way to know whether the work saved. This at least says what happened and
 * offers a way out.
 *
 * Deliberately not translated. It runs when React is already in a bad state, and
 * reaching for the i18n context here risks throwing inside the handler for a throw.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.crashed) {
      return this.props.children;
    }
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 10, md: 16 }, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Something broke on this page
          </Typography>
          <Typography color="text.secondary">
            Not your fault. Reloading usually fixes it — and if it does not, tell Eca what you were doing and he will
            look.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload the page
          </Button>
        </Stack>
      </Container>
    );
  }
}
