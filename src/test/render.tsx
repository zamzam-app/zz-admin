import type { PropsWithChildren, ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { App as AntApp, ConfigProvider } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import { theme } from '../theme';
import { AuthProvider } from '../lib/context/AuthContext';
import { ForgotPasswordProvider } from '../lib/context/ForgotPasswordContext';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

type ProviderOptions = RenderOptions & {
  route?: string;
  withRouter?: boolean;
  withAuth?: boolean;
  localStorageSeed?: Record<string, string>;
};

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    withRouter = true,
    withAuth = false,
    localStorageSeed,
    ...renderOptions
  }: ProviderOptions = {},
) {
  const queryClient = createTestQueryClient();

  if (localStorageSeed) {
    for (const [key, value] of Object.entries(localStorageSeed)) {
      localStorage.setItem(key, value);
    }
  }

  function Wrapper({ children }: PropsWithChildren) {
    const routedChildren = withRouter ? (
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    ) : (
      children
    );
    const forgotPasswordAwareChildren = (
      <ForgotPasswordProvider>{routedChildren}</ForgotPasswordProvider>
    );
    const authAwareChildren = withAuth ? (
      <AuthProvider>{forgotPasswordAwareChildren}</AuthProvider>
    ) : (
      forgotPasswordAwareChildren
    );

    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ConfigProvider getPopupContainer={(node) => node?.parentElement ?? document.body}>
          <QueryClientProvider client={queryClient}>
            <AntApp>{authAwareChildren}</AntApp>
          </QueryClientProvider>
        </ConfigProvider>
      </ThemeProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
