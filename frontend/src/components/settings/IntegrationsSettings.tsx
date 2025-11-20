import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, ExternalLink, Key, Webhook, Zap, MessageSquare } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Switch from '../ui/Switch';
import toast from '../../lib/toast';
import apiClient from '../../lib/api-client';

interface IntegrationSettings {
  oauth?: {
    google?: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
    };
    microsoft?: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
    };
  };
  apiKeys?: {
    enabled: boolean;
    maxKeys?: number;
  };
  webhooks?: {
    enabled: boolean;
    maxWebhooks?: number;
  };
  thirdParty?: {
    zapier?: {
      enabled: boolean;
      apiKey?: string;
    };
    slack?: {
      enabled: boolean;
      webhookUrl?: string;
    };
  };
}

export const IntegrationsSettings: React.FC = () => {
  const [settings, setSettings] = useState<IntegrationSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get('/tenants/current/settings/integrations');
      setSettings(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load integration settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/tenants/current/settings/integrations', settings);
      toast.success('Integration settings saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
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
      {/* API Keys Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
              <p className="text-sm text-gray-500">Manage API access for external integrations</p>
            </div>
          </div>
          <Switch
            checked={settings.apiKeys?.enabled ?? true}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSettings({
                ...settings,
                apiKeys: { enabled: e.target.checked, maxKeys: settings.apiKeys?.maxKeys },
              })
            }
          />
        </div>

        {settings.apiKeys?.enabled && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum API Keys
              </label>
              <Input
                type="number"
                value={settings.apiKeys?.maxKeys ?? 10}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSettings({
                    ...settings,
                    apiKeys: { enabled: settings.apiKeys?.enabled ?? true, maxKeys: parseInt(e.target.value) },
                  })
                }
                min={1}
                max={100}
              />
            </div>
            <a
              href="/api-keys"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
            >
              Manage API Keys
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        )}
      </motion.div>

      {/* Webhooks Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Webhook className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Webhooks</h3>
              <p className="text-sm text-gray-500">Configure webhook endpoints for events</p>
            </div>
          </div>
          <Switch
            checked={settings.webhooks?.enabled ?? true}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSettings({
                ...settings,
                webhooks: { enabled: e.target.checked, maxWebhooks: settings.webhooks?.maxWebhooks },
              })
            }
          />
        </div>

        {settings.webhooks?.enabled && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Webhooks
              </label>
              <Input
                type="number"
                value={settings.webhooks?.maxWebhooks ?? 20}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSettings({
                    ...settings,
                    webhooks: { enabled: settings.webhooks?.enabled ?? true, maxWebhooks: parseInt(e.target.value) },
                  })
                }
                min={1}
                max={100}
              />
            </div>
            <a
              href="/webhooks"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
            >
              Manage Webhooks
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        )}
      </motion.div>

      {/* OAuth Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Link className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">OAuth Integrations</h3>
            <p className="text-sm text-gray-500">Connect with third-party services</p>
          </div>
        </div>

        {/* Google OAuth */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Google OAuth</h4>
            <Switch
              checked={settings.oauth?.google?.enabled ?? false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings({
                  ...settings,
                  oauth: {
                    ...settings.oauth,
                    google: { 
                      enabled: e.target.checked,
                      clientId: settings.oauth?.google?.clientId,
                      clientSecret: settings.oauth?.google?.clientSecret,
                      redirectUri: settings.oauth?.google?.redirectUri,
                    },
                  },
                })
              }
            />
          </div>

          {settings.oauth?.google?.enabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID
                </label>
                <Input
                  value={settings.oauth?.google?.clientId ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({
                      ...settings,
                      oauth: {
                        ...settings.oauth,
                        google: { 
                          enabled: settings.oauth?.google?.enabled ?? false,
                          clientId: e.target.value,
                          clientSecret: settings.oauth?.google?.clientSecret,
                          redirectUri: settings.oauth?.google?.redirectUri,
                        },
                      },
                    })
                  }
                  placeholder="Enter Google Client ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Secret
                </label>
                <Input
                  type="password"
                  value={settings.oauth?.google?.clientSecret ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({
                      ...settings,
                      oauth: {
                        ...settings.oauth,
                        google: { 
                          enabled: settings.oauth?.google?.enabled ?? false,
                          clientId: settings.oauth?.google?.clientId,
                          clientSecret: e.target.value,
                          redirectUri: settings.oauth?.google?.redirectUri,
                        },
                      },
                    })
                  }
                  placeholder="Enter Google Client Secret"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redirect URI
                </label>
                <Input
                  value={settings.oauth?.google?.redirectUri ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({
                      ...settings,
                      oauth: {
                        ...settings.oauth,
                        google: { 
                          enabled: settings.oauth?.google?.enabled ?? false,
                          clientId: settings.oauth?.google?.clientId,
                          clientSecret: settings.oauth?.google?.clientSecret,
                          redirectUri: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="https://yourdomain.com/auth/google/callback"
                />
              </div>
            </div>
          )}
        </div>

        {/* Microsoft OAuth */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Microsoft OAuth</h4>
            <Switch
              checked={settings.oauth?.microsoft?.enabled ?? false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings({
                  ...settings,
                  oauth: {
                    ...settings.oauth,
                    microsoft: { 
                      enabled: e.target.checked,
                      clientId: settings.oauth?.microsoft?.clientId,
                      clientSecret: settings.oauth?.microsoft?.clientSecret,
                      redirectUri: settings.oauth?.microsoft?.redirectUri,
                    },
                  },
                })
              }
            />
          </div>

          {settings.oauth?.microsoft?.enabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID
                </label>
                <Input
                  value={settings.oauth?.microsoft?.clientId ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({
                      ...settings,
                      oauth: {
                        ...settings.oauth,
                        microsoft: { 
                          enabled: settings.oauth?.microsoft?.enabled ?? false,
                          clientId: e.target.value,
                          clientSecret: settings.oauth?.microsoft?.clientSecret,
                          redirectUri: settings.oauth?.microsoft?.redirectUri,
                        },
                      },
                    })
                  }
                  placeholder="Enter Microsoft Client ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Secret
                </label>
                <Input
                  type="password"
                  value={settings.oauth?.microsoft?.clientSecret ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({
                      ...settings,
                      oauth: {
                        ...settings.oauth,
                        microsoft: { 
                          enabled: settings.oauth?.microsoft?.enabled ?? false,
                          clientId: settings.oauth?.microsoft?.clientId,
                          clientSecret: e.target.value,
                          redirectUri: settings.oauth?.microsoft?.redirectUri,
                        },
                      },
                    })
                  }
                  placeholder="Enter Microsoft Client Secret"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redirect URI
                </label>
                <Input
                  value={settings.oauth?.microsoft?.redirectUri ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({
                      ...settings,
                      oauth: {
                        ...settings.oauth,
                        microsoft: { 
                          enabled: settings.oauth?.microsoft?.enabled ?? false,
                          clientId: settings.oauth?.microsoft?.clientId,
                          clientSecret: settings.oauth?.microsoft?.clientSecret,
                          redirectUri: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="https://yourdomain.com/auth/microsoft/callback"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Third-Party Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Zap className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Third-Party Integrations</h3>
            <p className="text-sm text-gray-500">Connect with external platforms</p>
          </div>
        </div>

        {/* Zapier */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <h4 className="text-md font-medium text-gray-900">Zapier</h4>
            </div>
            <Switch
              checked={settings.thirdParty?.zapier?.enabled ?? false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings({
                  ...settings,
                  thirdParty: {
                    ...settings.thirdParty,
                    zapier: { enabled: e.target.checked, apiKey: settings.thirdParty?.zapier?.apiKey },
                  },
                })
              }
            />
          </div>

          {settings.thirdParty?.zapier?.enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zapier API Key
              </label>
              <Input
                type="password"
                value={settings.thirdParty?.zapier?.apiKey ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSettings({
                    ...settings,
                    thirdParty: {
                      ...settings.thirdParty,
                      zapier: { enabled: settings.thirdParty?.zapier?.enabled ?? false, apiKey: e.target.value },
                    },
                  })
                }
                placeholder="Enter Zapier API Key"
              />
            </div>
          )}
        </div>

        {/* Slack */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              <h4 className="text-md font-medium text-gray-900">Slack</h4>
            </div>
            <Switch
              checked={settings.thirdParty?.slack?.enabled ?? false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings({
                  ...settings,
                  thirdParty: {
                    ...settings.thirdParty,
                    slack: { enabled: e.target.checked, webhookUrl: settings.thirdParty?.slack?.webhookUrl },
                  },
                })
              }
            />
          </div>

          {settings.thirdParty?.slack?.enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slack Webhook URL
              </label>
              <Input
                value={settings.thirdParty?.slack?.webhookUrl ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSettings({
                    ...settings,
                    thirdParty: {
                      ...settings.thirdParty,
                      slack: { enabled: settings.thirdParty?.slack?.enabled ?? false, webhookUrl: e.target.value },
                    },
                  })
                }
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
          )}
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

export default IntegrationsSettings;
