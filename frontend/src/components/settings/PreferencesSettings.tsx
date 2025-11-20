import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout, MessageCircle, Keyboard, Bell } from 'lucide-react';
import Button from '../ui/Button';
import Switch from '../ui/Switch';
import Select from '../ui/Select';
import toast from '../../lib/toast';
import apiClient from '../../lib/api-client';

interface UserPreferences {
  inbox?: {
    viewMode?: 'list' | 'compact' | 'comfortable';
    sortBy?: 'recent' | 'unread' | 'priority';
    showAvatars?: boolean;
    showPreview?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
  };
  conversation?: {
    showTimestamps?: boolean;
    timestampFormat?: '12h' | '24h';
    showReadReceipts?: boolean;
    enterToSend?: boolean;
    showTypingIndicator?: boolean;
    messageGrouping?: boolean;
  };
  keyboard?: {
    enabled?: boolean;
  };
  notifications?: {
    desktop?: boolean;
    sound?: boolean;
    email?: boolean;
    newMessage?: boolean;
    mentions?: boolean;
    assignments?: boolean;
  };
  theme?: 'light' | 'dark' | 'auto';
}

export const PreferencesSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const userId = 'current';

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await apiClient.get(`/users/${userId}/settings/preferences`);
      setPreferences(response.data);
    } catch (error: any) {
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/users/${userId}/settings/preferences`, preferences);
      toast.success('Preferences saved successfully');
    } catch (error: any) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inbox Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Layout className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Inbox Preferences</h3>
            <p className="text-sm text-gray-500">Customize your inbox view</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Show Avatars</span>
            <Switch
              checked={preferences.inbox?.showAvatars ?? true}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPreferences({
                  ...preferences,
                  inbox: { ...preferences.inbox, showAvatars: e.target.checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Show Message Preview</span>
            <Switch
              checked={preferences.inbox?.showPreview ?? true}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPreferences({
                  ...preferences,
                  inbox: { ...preferences.inbox, showPreview: e.target.checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Auto Refresh</span>
            <Switch
              checked={preferences.inbox?.autoRefresh ?? true}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPreferences({
                  ...preferences,
                  inbox: { ...preferences.inbox, autoRefresh: e.target.checked },
                })
              }
            />
          </div>
        </div>
      </motion.div>

      {/* Conversation Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Conversation Preferences</h3>
            <p className="text-sm text-gray-500">Customize message display</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Show Timestamps</span>
            <Switch
              checked={preferences.conversation?.showTimestamps ?? true}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPreferences({
                  ...preferences,
                  conversation: { ...preferences.conversation, showTimestamps: e.target.checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Show Read Receipts</span>
            <Switch
              checked={preferences.conversation?.showReadReceipts ?? true}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPreferences({
                  ...preferences,
                  conversation: { ...preferences.conversation, showReadReceipts: e.target.checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Enter to Send</span>
            <Switch
              checked={preferences.conversation?.enterToSend ?? true}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPreferences({
                  ...preferences,
                  conversation: { ...preferences.conversation, enterToSend: e.target.checked },
                })
              }
            />
          </div>
        </div>
      </motion.div>

      {/* Keyboard Shortcuts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Keyboard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
              <p className="text-sm text-gray-500">Enable keyboard navigation</p>
            </div>
          </div>
          <Switch
            checked={preferences.keyboard?.enabled ?? true}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPreferences({
                ...preferences,
                keyboard: { ...preferences.keyboard, enabled: e.target.checked },
              })
            }
          />
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-500">Manage notification preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Desktop Notifications</span>
            <Switch
              checked={preferences.notifications?.desktop ?? true}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPreferences({
                  ...preferences,
                  notifications: { ...preferences.notifications, desktop: e.target.checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Sound</span>
            <Switch
              checked={preferences.notifications?.sound ?? true}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPreferences({
                  ...preferences,
                  notifications: { ...preferences.notifications, sound: e.target.checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Email Notifications</span>
            <Switch
              checked={preferences.notifications?.email ?? false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPreferences({
                  ...preferences,
                  notifications: { ...preferences.notifications, email: e.target.checked },
                })
              }
            />
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default PreferencesSettings;
