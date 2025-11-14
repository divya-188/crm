import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Bell, Globe, Building2, Palette } from 'lucide-react';
import Card from '../components/ui/Card';
import ProfileSettings from '../components/settings/ProfileSettings';
import PasswordSettings from '../components/settings/PasswordSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import LanguageSettings from '../components/settings/LanguageSettings';
import BusinessProfileSettings from '../components/settings/BusinessProfileSettings';
import BrandingSettings from '../components/settings/BrandingSettings';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'language', label: 'Language & Timezone', icon: Globe },
  { id: 'business', label: 'Business Profile', icon: Building2 },
  { id: 'branding', label: 'Branding', icon: Palette },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'password':
        return <PasswordSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'language':
        return <LanguageSettings />;
      case 'business':
        return <BusinessProfileSettings />;
      case 'branding':
        return <BrandingSettings />;
      default:
        return null;
    }
  };

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
            <nav className="space-y-1">
              {tabs.map((tab) => {
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
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
