import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, Eye, EyeOff, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { toast } from '../../lib/toast';
import { apiClient } from '../../lib/api-client';

interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
  };
  sendgrid?: { apiKey: string };
  mailgun?: { apiKey: string; domain: string };
  from: { name: string; email: string };
}

export const EmailConfigSettings: React.FC = () => {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await apiClient.get('/super-admin/settings/email');
      setConfig(data);
    } catch (error) {
      toast.error('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/super-admin/settings/email', config);
      toast.success('Email settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const { data } = await apiClient.post('/super-admin/settings/email/test-connection', config);
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to test connection');
    } finally {
      setTesting(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }
    setSendingTest(true);
    try {
      const { data } = await apiClient.post('/super-admin/settings/email/send-test', { to: testEmail });
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Email Configuration</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure email provider for system notifications
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
      >
        <Select
          label="Email Provider"
          value={config.provider}
          onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
          options={[
            { value: 'smtp', label: 'SMTP' },
            { value: 'sendgrid', label: 'SendGrid' },
            { value: 'mailgun', label: 'Mailgun' },
          ]}
        />

        {config.provider === 'smtp' && (
          <div className="space-y-4 pt-4 border-t">
            <Input
              label="SMTP Host"
              value={config.smtp?.host || ''}
              onChange={(e) => setConfig({
                ...config,
                smtp: { ...config.smtp!, host: e.target.value }
              })}
              placeholder="smtp.gmail.com"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Port"
                type="number"
                value={config.smtp?.port || 587}
                onChange={(e) => setConfig({
                  ...config,
                  smtp: { ...config.smtp!, port: parseInt(e.target.value) }
                })}
              />
              <div className="flex items-center gap-2 pt-8">
                <Switch
                  checked={config.smtp?.secure || false}
                  onChange={(secure) => setConfig({
                    ...config,
                    smtp: { ...config.smtp!, secure }
                  })}
                />
                <span className="text-sm text-gray-700">Use SSL/TLS</span>
              </div>
            </div>
            <Input
              label="Username"
              value={config.smtp?.auth?.user || ''}
              onChange={(e) => setConfig({
                ...config,
                smtp: { ...config.smtp!, auth: { ...config.smtp!.auth, user: e.target.value } }
              })}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={config.smtp?.auth?.pass || ''}
                onChange={(e) => setConfig({
                  ...config,
                  smtp: { ...config.smtp!, auth: { ...config.smtp!.auth, pass: e.target.value } }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {config.provider === 'sendgrid' && (
          <div className="pt-4 border-t">
            <Input
              label="API Key"
              type={showPassword ? 'text' : 'password'}
              value={config.sendgrid?.apiKey || ''}
              onChange={(e) => setConfig({
                ...config,
                sendgrid: { apiKey: e.target.value }
              })}
              placeholder="SG...."
            />
          </div>
        )}

        {config.provider === 'mailgun' && (
          <div className="space-y-4 pt-4 border-t">
            <Input
              label="API Key"
              type={showPassword ? 'text' : 'password'}
              value={config.mailgun?.apiKey || ''}
              onChange={(e) => setConfig({
                ...config,
                mailgun: { ...config.mailgun!, apiKey: e.target.value }
              })}
            />
            <Input
              label="Domain"
              value={config.mailgun?.domain || ''}
              onChange={(e) => setConfig({
                ...config,
                mailgun: { ...config.mailgun!, domain: e.target.value }
              })}
              placeholder="mg.example.com"
            />
          </div>
        )}

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-gray-900">From Address</h3>
          <Input
            label="Name"
            value={config.from.name}
            onChange={(e) => setConfig({
              ...config,
              from: { ...config.from, name: e.target.value }
            })}
            placeholder="WhatsCRM"
          />
          <Input
            label="Email"
            type="email"
            value={config.from.email}
            onChange={(e) => setConfig({
              ...config,
              from: { ...config.from, email: e.target.value }
            })}
            placeholder="noreply@whatscrm.com"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
            ) : (
              'Test Connection'
            )}
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="font-semibold text-gray-900 mb-4">Send Test Email</h3>
        <div className="flex gap-2">
          <Input
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={handleSendTest}
            disabled={sendingTest}
          >
            {sendingTest ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Send</>
            )}
          </Button>
        </div>
      </motion.div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
};

export default EmailConfigSettings;
