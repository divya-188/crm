import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/routes/ProtectedRoute';
import { RoleBasedRoute } from '@/components/routes/RoleBasedRoute';
import { PublicRoute } from '@/components/routes/PublicRoute';

// Layouts
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { UserLayout } from '@/components/layouts/UserLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { AgentLayout } from '@/components/layouts/AgentLayout';

// Auth Pages
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';

// User Pages
import { Dashboard } from '@/pages/Dashboard';
import { Inbox } from '@/pages/Inbox';
import { Contacts } from '@/pages/Contacts';
import FlowBuilder from '@/pages/FlowBuilder';
import Templates from '@/pages/Templates';
import { TemplateAnalytics } from '@/pages/TemplateAnalytics';
import Campaigns from '@/pages/Campaigns';
import CampaignDetail from '@/pages/CampaignDetail';
import Automations from '@/pages/Automations';
import { WhatsAppConnections } from '@/pages/WhatsAppConnections';
import Webhooks from '@/pages/Webhooks';
import ApiKeys from '@/pages/ApiKeys';
import Users from '@/pages/Users';
import Settings from '@/pages/Settings';

// Analytics Pages
import {
  ConversationAnalytics,
  CampaignAnalytics,
  AgentPerformance,
  FlowAnalytics,
} from '@/pages/analytics';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import Tenants from '@/pages/admin/Tenants';
import AdminSubscriptionPlans from '@/pages/admin/SubscriptionPlans';

// Super Admin Pages
import { SuperAdminDashboard } from '@/pages/super-admin/SuperAdminDashboard';
import SubscriptionPlans from '@/pages/super-admin/SubscriptionPlans';

// Agent Pages
import { AgentDashboard } from '@/pages/agent/AgentDashboard';

// Subscription Pages
import SubscriptionSuccess from '@/pages/subscription/SubscriptionSuccess';
import SubscriptionCancel from '@/pages/subscription/SubscriptionCancel';
import MySubscription from '@/pages/MySubscription';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/subscription/success',
    element: (
      <ProtectedRoute>
        <SubscriptionSuccess />
      </ProtectedRoute>
    ),
  },
  {
    path: '/subscription/cancel',
    element: (
      <ProtectedRoute>
        <SubscriptionCancel />
      </ProtectedRoute>
    ),
  },
  {
    path: '/my-subscription',
    element: (
      <ProtectedRoute>
        <MySubscription />
      </ProtectedRoute>
    ),
  },
  {
    path: '/auth',
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RoleBasedRoute allowedRoles={['user']}>
          <UserLayout />
        </RoleBasedRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'inbox',
        element: <Inbox />,
      },
      {
        path: 'contacts',
        element: <Contacts />,
      },
      {
        path: 'campaigns',
        element: <Campaigns />,
      },
      {
        path: 'campaigns/:id',
        element: <CampaignDetail />,
      },
      {
        path: 'templates',
        element: <Templates />,
      },
      {
        path: 'templates/:id/analytics',
        element: <TemplateAnalytics />,
      },
      {
        path: 'flows',
        element: <FlowBuilder />,
      },
      {
        path: 'automations',
        element: <Automations />,
      },
      {
        path: 'analytics',
        element: <Navigate to="/analytics/conversations" replace />,
      },
      {
        path: 'analytics/conversations',
        element: <ConversationAnalytics />,
      },
      {
        path: 'analytics/campaigns',
        element: <CampaignAnalytics />,
      },
      {
        path: 'analytics/agents',
        element: <AgentPerformance />,
      },
      {
        path: 'analytics/flows',
        element: <FlowAnalytics />,
      },
      {
        path: 'whatsapp',
        element: <WhatsAppConnections />,
      },
      {
        path: 'webhooks',
        element: <Webhooks />,
      },
      {
        path: 'api-keys',
        element: <ApiKeys />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '/super-admin',
    element: (
      <ProtectedRoute>
        <RoleBasedRoute allowedRoles={['super_admin']}>
          <SuperAdminLayout />
        </RoleBasedRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/super-admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <SuperAdminDashboard />,
      },
      {
        path: 'tenants',
        element: <Tenants />,
      },
      {
        path: 'plans',
        element: <SubscriptionPlans />,
      },
      {
        path: 'users',
        element: <div className="text-center py-12">Users Management - Coming Soon</div>,
      },
      {
        path: 'analytics',
        element: <div className="text-center py-12">Platform Analytics - Coming Soon</div>,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <RoleBasedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </RoleBasedRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <AdminDashboard />,
      },
      {
        path: 'tenants',
        element: <Tenants />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'contacts',
        element: <Contacts />,
      },
      {
        path: 'plans',
        element: <AdminSubscriptionPlans />,
      },
      {
        path: 'analytics',
        element: <Navigate to="/admin/analytics/conversations" replace />,
      },
      {
        path: 'analytics/conversations',
        element: <ConversationAnalytics />,
      },
      {
        path: 'analytics/campaigns',
        element: <CampaignAnalytics />,
      },
      {
        path: 'analytics/agents',
        element: <AgentPerformance />,
      },
      {
        path: 'analytics/flows',
        element: <FlowAnalytics />,
      },
      {
        path: 'flows',
        element: <FlowBuilder />,
      },
      {
        path: 'automations',
        element: <Automations />,
      },
      {
        path: 'templates',
        element: <Templates />,
      },
      {
        path: 'templates/:id/analytics',
        element: <TemplateAnalytics />,
      },
      {
        path: 'campaigns',
        element: <Campaigns />,
      },
      {
        path: 'campaigns/:id',
        element: <CampaignDetail />,
      },
      {
        path: 'security',
        element: <div className="text-center py-12">Security - Coming Soon</div>,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '/agent',
    element: (
      <ProtectedRoute>
        <RoleBasedRoute allowedRoles={['agent']}>
          <AgentLayout />
        </RoleBasedRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/agent/inbox" replace />,
      },
      {
        path: 'dashboard',
        element: <AgentDashboard />,
      },
      {
        path: 'inbox',
        element: <Inbox />,
      },
      {
        path: 'contacts',
        element: <Contacts />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-neutral-900 mb-4">404</h1>
          <p className="text-xl text-neutral-600 mb-8">Page not found</p>
          <a
            href="/"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    ),
  },
]);
