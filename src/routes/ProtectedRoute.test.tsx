import { screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { renderWithProviders } from '../test/render';
import { useAuth } from '../lib/context/AuthContext';

vi.mock('../lib/context/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../lib/context/AuthContext')>(
    '../lib/context/AuthContext',
  );
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe('ProtectedRoute', () => {
  it('shows a loading spinner while auth state is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const router = createMemoryRouter([{ path: '/', element: <ProtectedRoute /> }], {
      initialEntries: ['/'],
    });

    renderWithProviders(<RouterProvider router={router} />, { withRouter: false });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <ProtectedRoute />,
          children: [{ index: true, element: <div>Private page</div> }],
        },
        { path: '/login', element: <div>Login page</div> },
      ],
      { initialEntries: ['/'] },
    );

    renderWithProviders(<RouterProvider router={router} />, { withRouter: false });
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('renders protected children when authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <ProtectedRoute />,
          children: [{ index: true, element: <div>Private page</div> }],
        },
      ],
      { initialEntries: ['/'] },
    );

    renderWithProviders(<RouterProvider router={router} />, { withRouter: false });
    expect(await screen.findByText('Private page')).toBeInTheDocument();
  });
});
