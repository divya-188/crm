import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Megaphone,
  FileText,
  Workflow,
  Zap,
  BarChart3,
  Settings,
  Phone,
  Webhook,
  Key,
} from 'lucide-react';
import { Sidebar, SidebarSection } from './Sidebar';
import { Header } from './Header';

const sidebarSections: SidebarSection[] = [
  {
    items: [
      {
        name: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        name: 'Inbox',
        path: '/inbox',
        icon: MessageSquare,
        badge: 5,
      },
    ],
  },
  {
    title: 'Contacts & Campaigns',
    items: [
      {
        name: 'Contacts',
        path: '/contacts',
        icon: Users,
      },
      {
        name: 'Campaigns',
        path: '/campaigns',
        icon: Megaphone,
      },
      {
        name: 'Templates',
        path: '/templates',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Automation',
    items: [
      {
        name: 'Flow Builder',
        path: '/flows',
        icon: Workflow,
      },
      {
        name: 'Automations',
        path: '/automations',
        icon: Zap,
      },
    ],
  },
  {
    title: 'Analytics & Settings',
    items: [
      {
        name: 'Analytics',
        path: '/analytics',
        icon: BarChart3,
      },
      {
        name: 'WhatsApp',
        path: '/whatsapp',
        icon: Phone,
      },
      {
        name: 'Webhooks',
        path: '/webhooks',
        icon: Webhook,
      },
      {
        name: 'API Keys',
        path: '/api-keys',
        icon: Key,
      },
      {
        name: 'Settings',
        path: '/settings',
        icon: Settings,
      },
    ],
  },
];

export const UserLayout: React.FC = () => {
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
