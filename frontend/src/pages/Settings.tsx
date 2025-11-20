import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  Bell, 
  Globe, 
  Building2, 
  Palette, 
  Smartphone,
  Users,
  CreditCard,
  Plug,
  Clock,
  Settings as SettingsIcon
} from 'lucide-react';
import Card from '../components/ui/Card';
import ProfileSettings from '../components/settings/ProfileSettings';
import PasswordSettings from '../components/settings/PasswordSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import LanguageSettings from '../components/settings/LanguageSettings';
import BusinessProfileSettings from '../components/settings/BusinessProfileSettings';
import BrandingSettings from '../components/settings/BrandingSettings';
import WhatsAppSettings from '../components/settings/WhatsAppSettings';
import TeamSettings from '../components/settings/TeamSettings';
import BillingSubscriptionSettings from '../components/settings/BillingSubscriptionSettings';
import IntegrationsSettings from '../components/settings/IntegrationsSettings';
import AvailabilitySettings from '../components/settings/AvailabilitySettings';
import PreferencesSettings from '../components/settings/PreferencesSettings';
import { useAuthStore } from '../lib/auth.store';
import { useSettingsSync } from '../hooks/useSettingsSync';
import toast from '../lib/toast';

interface Tab {
  id: string;
  label: string;
  icon: any;
  roles: string[];
  requiresWhiteLabel?: boolean;
}

const allTabs: Tab[] = [
  // User Settings (All Roles)
  { id: 'profile', label: 'Profile', icon: User, roles: ['user', 'agent', 'admin', 'super_admin'] },
  { id: 'password', label: 'Password', icon: Lock, roles: ['user', 'agent', 'admin', 'super_admin'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['user', 'agent', 'admin', 'super_admin'] },
  { id: 'language', label: 'Language & Timezone', icon: Globe, roles: ['user', 'agent', 'admin', 'super_admin'] },
  
  // Agent Settings
  { id: 'availability', label: 'Availability', icon: Clock, roles: ['agent', 'admin', 'super_admin'] },
  { id: 'preferences', label: 'Preferences', icon: SettingsIcon, roles: ['agent', 'admin', 'super_admin'] },
  
  // Admin Settings
  { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone, roles: ['admin', 'super_admin'] },
  { id: 'business', label: 'Business Profile', icon: Building2, roles: ['admin', 'super_admin'] },
  { id: 'branding', label: 'Branding', icon: Palette, roles: ['admin', 'super_admin'], requiresWhiteLabel: true },
  { id: 'team', label: 'Team', icon: Users, roles: ['admin', 'super_admin'] },
  { id: 'billing', label: 'Billing & Subscription', icon: CreditCard, roles: ['admin', 'super_admin'] },
  { id: 'integrations', label: 'Integrations', icon: Plug, roles: ['admin', 'super_admin'] },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  
  // Initialize real-time settings sync
  useSettingsSync();
  
  // Check if tenant has white-label enabled
  const hasWhiteLabel = useMemo(() => {
    // TODO: Get this from tenant settings or subscription plan
    // For now, assume admins and super_admins have white-label
    return user?.role === 'admin' || user?.role === 'super_admin';
  }, [user]);
  
  // Filter tabs based on user role and white-label status
  const tabs = useMemo(() => {
    if (!user) return allTabs.filter(tab => tab.roles.includes('user'));
    
    return allTabs.filter(tab => {
      // Check role permission
      if (!tab.roles.includes(user.role)) return false;
      
      // Check white-label requirement
      if (tab.requiresWhiteLabel && !hasWhiteLabel) return false;
      
      return true;
    });
  }, [user, hasWhiteLabel]);

  // Set initial tab based on available tabs
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const renderTabContent = () => {
    try {
      switch (activeTab) {
        case 'profile':
          return <ProfileSettings />;
        case 'password':
          return <PasswordSettings />;
        case 'notifications':
          return <NotificationSettings />;
        case 'language':
          return <LanguageSettings />;
        case 'availability':
          return <AvailabilitySettings />;
        case 'preferences':
          return <PreferencesSettings />;
        case 'whatsapp':
          return <WhatsAppSettings />;
        case 'business':
          return <BusinessProfileSettings />;
        case 'branding':
          return <BrandingSettings />;
        case 'team':
          return <TeamSettings />;
        case 'billing':
          return <BillingSubscriptionSettings />;
        case 'integrations':
          return <IntegrationsSettings />;
        default:
          return (
            <Card className="p-8 text-center">
              <p className="text-neutral-600">Select a settings category from the sidebar</p>
            </Card>
          );
      }
    } catch (error) {
      console.error('Error rendering settings tab:', error);
      toast.error('Failed to load settings', {
        description: 'Please try refreshing the page',
      });
      return (
        <Card className="p-8 text-center">
          <p className="text-red-600">Failed to load settings</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Refresh Page
          </button>
        </Card>
      );
    }
  };

  // Group tabs by category
  const groupedTabs = useMemo(() => {
    const groups: Record<string, Tab[]> = {
      'Personal': [],
      'Agent': [],
      'Organization': [],
    };

    tabs.forEach(tab => {
      if (['profile', 'password', 'notifications', 'language'].includes(tab.id)) {
        groups['Personal'].push(tab);
      } else if (['availability', 'preferences'].includes(tab.id)) {
        groups['Agent'].push(tab);
      } else {
        groups['Organization'].push(tab);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [tabs]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3">
          <Card className="p-2">
            <nav className="space-y-4">
              {Object.entries(groupedTabs).map(([groupName, groupTabs]) => (
                <div key={groupName}>
                  <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {groupName}
                  </div>
                  <div className="space-y-1">
                    {groupTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                            activeTab === tab.id
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="col-span-9">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <Card className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-neutral-600">Loading settings...</p>
              </Card>
            ) : (
              renderTabContent()
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
