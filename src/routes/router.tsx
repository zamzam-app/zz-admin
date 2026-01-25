import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Lazy load pages
const Login = lazy(() => import('../pages/Login'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Listings = lazy(() => import('../pages/Listings')); // mapped to /university based on Sidebar
const NotFound = lazy(() => import('../pages/NotFound'));

// Placeholder for other pages to avoid crash
const PlaceholderPage = lazy(() => import('../pages/PlaceholderPage'));

const router = createBrowserRouter([
  // Public Routes (Auth)
  {
    element: <AuthLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPassword />,
      },
    ],
  },
  // Protected Application Routes
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/',
            element: <Navigate to='/dashboard' replace />,
          },
          {
            path: '/dashboard',
            element: <Dashboard />,
          },
          {
            path: '/university',
            element: <Listings />,
          },
          {
            path: '/resources',
            element: <PlaceholderPage title='Resources' />,
          },
          {
            path: '/finance',
            element: <PlaceholderPage title='Finance' />,
          },
          {
            path: '/settings',
            element: <PlaceholderPage title='Settings' />,
          },
        ],
      },
    ],
  },
  // Catch-all 404
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
