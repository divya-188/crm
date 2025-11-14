import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Users, Settings } from 'lucide-react';
import { Sidebar, SidebarSection } from './Sidebar';
import { Header } from './Header';

const sidebarSections: SidebarSection[] = [
  {
    items: [
      {
        name: 'Dashboard',
        path: '/agent/dashboard',
        icon: LayoutDashboard,
      },
      {
        name: 'Inbox',
        path: '/agent/inbox',
        icon: MessageSquare,
        badge: 12,
      },
    ],
  },
  {
    title: 'Resources',
    items: [
      {
        name: 'Contacts',
        path: '/agent/contacts',
        icon: Users,
      },
      {
        name: 'Settings',
        path: '/agent/settings',
        icon: Settings,
      },
    ],
  },
];

export const AgentLayout: React.FC = () => {
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
