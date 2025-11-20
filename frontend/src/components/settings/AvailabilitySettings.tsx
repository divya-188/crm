import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Coffee, MessageSquare, Power } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Switch from '../ui/Switch';
import Select from '../ui/Select';
import toast from '../../lib/toast';
import apiClient from '../../lib/api-client';

type AgentStatus = 'available' | 'away' | 'busy' | 'offline';

interface AvailabilitySettings {
  status: AgentStatus;
  workingHours?: {
    [key: string]: { enabled: boolean; start: string; end: string };
  };
  breaks?: Array<{
    id: string;
    name: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
  autoReply?: {
    enabled: boolean;
    awayMessage?: string;
    offlineMessage?: string;
  };
  autoStatusChange?: {
    enabled: boolean;
    offlineAfterMinutes?: number;
  };
}

export const AvailabilitySettings: React.FC = () => {
  const [settings, setSettings] = useState<AvailabilitySettings>({
    status: 'available',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const userId = 'current'; // Replace with actual user ID from auth context

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const statusOptions = [
    { value: 'available', label: '🟢 Available', color: 'text-green-600' },
    { value: 'away', label: '🟡 Away', color: 'text-yellow-600' },
    { value: 'busy', label: '🔴 Busy', color: 'text-red-600' },
    { value: 'offline', label: '⚫ Offline', color: 'text-gray-600' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get(`/users/${userId}/settings/availability`);
      setSettings(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/users/${userId}/settings/availability`, settings);
      toast.success('Availability settings saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: AgentStatus) => {
    try {
      await apiClient.put(`/users/${userId}/settings/availability/status`, { status });
      setSettings({ ...settings, status });
      toast.success(`Status updated to ${status}`);
    } catch (error: any) {
      toast.error('Failed to update status');
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
      {/* Current Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Power className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
            <p className="text-sm text-gray-500">Set your availability status</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value as AgentStatus)}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.status === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-center font-medium ${option.color}`}>
                {option.label}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Working Hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Working Hours</h3>
            <p className="text-sm text-gray-500">Set your weekly schedule</p>
          </div>
        </div>

        <div className="space-y-3">
          {days.map((day) => {
            const daySettings = settings.workingHours?.[day] || { enabled: false, start: '09:00', end: '17:00' };
            return (
              <div key={day} className="flex items-center space-x-4">
                <div className="w-32">
                  <Switch
                    checked={daySettings.enabled}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings({
                        ...settings,
                        workingHours: {
                          ...settings.workingHours,
                          [day]: { ...daySettings, enabled: e.target.checked },
                        },
                      })
                    }
                    label={day.charAt(0).toUpperCase() + day.slice(1)}
                  />
                </div>
                {daySettings.enabled && (
                  <div className="flex items-center space-x-2 flex-1">
                    <Input
                      type="time"
                      value={daySettings.start}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSettings({
                          ...settings,
                          workingHours: {
                            ...settings.workingHours,
                            [day]: { ...daySettings, start: e.target.value },
                          },
                        })
                      }
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="time"
                      value={daySettings.end}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSettings({
                          ...settings,
                          workingHours: {
                            ...settings.workingHours,
                            [day]: { ...daySettings, end: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Auto-Reply Messages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Auto-Reply Messages</h3>
              <p className="text-sm text-gray-500">Automatic responses when unavailable</p>
            </div>
          </div>
          <Switch
            checked={settings.autoReply?.enabled ?? false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSettings({
                ...settings,
                autoReply: { ...settings.autoReply, enabled: e.target.checked },
              })
            }
          />
        </div>

        {settings.autoReply?.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Away Message
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                value={settings.autoReply?.awayMessage ?? ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoReply: { ...settings.autoReply, awayMessage: e.target.value },
                  })
                }
                placeholder="Message to send when you're away"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offline Message
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                value={settings.autoReply?.offlineMessage ?? ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoReply: { ...settings.autoReply, offlineMessage: e.target.value },
                  })
                }
                placeholder="Message to send when you're offline"
              />
            </div>
          </div>
        )}
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

export default AvailabilitySettings;
