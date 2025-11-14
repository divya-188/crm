import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  Shield,
  CreditCard,
} from 'lucide-react';
import { Sidebar, SidebarSection } from './Sidebar';
import { Header } from './Header';

const sidebarSections: SidebarSection[] = [
  {
    items: [
      {
        name: 'Dashboard',
        path: '/super-admin/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Platform Management',
    items: [
      {
        name: 'Tenants',
        path: '/super-admin/tenants',
        icon: Building2,
      },
      {
        name: 'Subscription Plans',
        path: '/super-admin/plans',
        icon: CreditCard,
      },
      {
        name: 'Users',
        path: '/super-admin/users',
        icon: Users,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        name: 'Analytics',
        path: '/super-admin/analytics',
        icon: BarChart3,
      },
      {
        name: 'Settings',
        path: '/super-admin/settings',
        icon: Settings,
      },
    ],
  },
];

export const SuperAdminLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-neutral-50">
      <Sidebar sections={sidebarSections} isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
