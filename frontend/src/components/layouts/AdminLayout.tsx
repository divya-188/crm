import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  Settings,
  Shield,
  BarChart3,
  UserCircle,
} from 'lucide-react';
import { Sidebar, SidebarSection } from './Sidebar';
import { Header } from './Header';

const sidebarSections: SidebarSection[] = [
  {
    items: [
      {
        name: 'Dashboard',
        path: '/admin/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        name: 'Tenants',
        path: '/admin/tenants',
        icon: Building2,
      },
      {
        name: 'Subscription Plans',
        path: '/admin/plans',
        icon: CreditCard,
      },
      {
        name: 'Users',
        path: '/admin/users',
        icon: Users,
      },
      {
        name: 'Contacts',
        path: '/admin/contacts',
        icon: UserCircle,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        name: 'Analytics',
        path: '/admin/analytics',
        icon: BarChart3,
      },
      {
        name: 'Security',
        path: '/admin/security',
        icon: Shield,
      },
      {
        name: 'Settings',
        path: '/admin/settings',
        icon: Settings,
      },
    ],
  },
];

export const AdminLayout: React.FC = () => {
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
