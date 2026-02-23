import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import RoleGuard from './RoleGuard';
import CategoryGaurd from './CategoryGaurd';

/* ============================
   Lazy loaded pages
============================ */
const Login = lazy(() => import('../pages/Login'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const Overview = lazy(() => import('../pages/Overview'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Reviews = lazy(() => import('../pages/Reviews'));
const Infrastructure = lazy(() => import('../pages/Infrastructure'));
const FormBuilder = lazy(() => import('../pages/FormBuilder'));
const ManagersPage = lazy(() => import('../pages/Managers'));
const Orders = lazy(() => import('../pages/Orders'));
const Studio = lazy(() => import('../pages/Studio'));
const Validation = lazy(() => import('../pages/Validation'));
const Settings = lazy(() => import('../pages/Settings'));
const NotFound = lazy(() => import('../pages/NotFound'));

/* ============================
   Router
============================ */
const router = createBrowserRouter([
  /* ============================
     Public routes
  ============================ */
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

  /* ============================
     Protected app routes
  ============================ */
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/',
            element: <Navigate to='/overview' replace />,
          },

          /* ===== Common (ADMIN + STAFF) ===== */
          {
            path: '/overview',
            element: <Overview />,
          },
          {
            path: '/analytics/:id',
            element: <Analytics />,
          },
          {
            path: '/reviews',
            element: <Reviews />,
          },
          {
            path: '/settings',
            element: <Settings />,
          },

          /* ===== ADMIN only ===== */
          {
            path: '/infrastructure',
            element: (
              <RoleGuard allowed={['admin']}>
                <Infrastructure />
              </RoleGuard>
            ),
          },
          {
            path: '/form-builder',
            element: (
              <RoleGuard allowed={['admin']}>
                <FormBuilder />
              </RoleGuard>
            ),
          },
          {
            path: '/managers',
            element: (
              <RoleGuard allowed={['admin']}>
                <ManagersPage />
              </RoleGuard>
            ),
          },

          /* ===== ADMIN and CAFE only ===== */
          {
            path: '/studio',
            element: (
              <CategoryGaurd allowed={['cafe']}>
                <Studio />
              </CategoryGaurd>
            ),
          },
          {
            path: '/orders',
            element: (
              <CategoryGaurd allowed={['cafe']}>
                <Orders />
              </CategoryGaurd>
            ),
          },
          {
            path: '/validations',
            element: (
              <CategoryGaurd allowed={['cafe']}>
                <Validation />
              </CategoryGaurd>
            ),
          },
        ],
      },
    ],
  },

  /* ============================
     404
  ============================ */
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
