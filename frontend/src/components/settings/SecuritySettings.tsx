import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';
import { toast } from '../../lib/toast';
import { apiClient } from '../../lib/api-client';

interface SecurityConfig {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expiryDays: number;
    preventReuse: number;
  };
  sessionManagement: {
    maxSessions: number;
    sessionTimeout: number;
    idleTimeout: number;
    requireReauthForSensitive: boolean;
  };
  twoFactor: {
    enforceForAdmins: boolean;
    enforceForAll: boolean;
    allowedMethods: string[];
  };
  auditLog: {
    retentionDays: number;
    logFailedLogins: boolean;
    logPasswordChanges: boolean;
    logSettingsChanges: boolean;
  };
}

export const SecuritySettings: React.FC = () => {
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await apiClient.get('/super-admin/settings/security');
      setConfig(data);
    } catch (error) {
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/super-admin/settings/security', config);
      toast.success('Security settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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
        <h2 className="text-2xl font-bold text-gray-900">Security & Compliance</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure security policies and compliance settings
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
      >
        <h3 className="font-semibold text-gray-900">Password Policy</h3>
        <Input
          label="Minimum Length"
          type="number"
          value={config.passwordPolicy.minLength}
          onChange={(e) => setConfig({
            ...config,
            passwordPolicy: { ...config.passwordPolicy, minLength: parseInt(e.target.value) }
          })}
        />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={config.passwordPolicy.requireUppercase}
              onChange={(requireUppercase) => setConfig({
                ...config,
                passwordPolicy: { ...config.passwordPolicy, requireUppercase }
              })}
            />
            <span className="text-sm text-gray-700">Require uppercase letters</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.passwordPolicy.requireLowercase}
              onChange={(requireLowercase) => setConfig({
                ...config,
                passwordPolicy: { ...config.passwordPolicy, requireLowercase }
              })}
            />
            <span className="text-sm text-gray-700">Require lowercase letters</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.passwordPolicy.requireNumbers}
              onChange={(requireNumbers) => setConfig({
                ...config,
                passwordPolicy: { ...config.passwordPolicy, requireNumbers }
              })}
            />
            <span className="text-sm text-gray-700">Require numbers</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.passwordPolicy.requireSpecialChars}
              onChange={(requireSpecialChars) => setConfig({
                ...config,
                passwordPolicy: { ...config.passwordPolicy, requireSpecialChars }
              })}
            />
            <span className="text-sm text-gray-700">Require special characters</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Password Expiry (days)"
            type="number"
            value={config.passwordPolicy.expiryDays}
            onChange={(e) => setConfig({
              ...config,
              passwordPolicy: { ...config.passwordPolicy, expiryDays: parseInt(e.target.value) }
            })}
          />
          <Input
            label="Prevent Reuse (count)"
            type="number"
            value={config.passwordPolicy.preventReuse}
            onChange={(e) => setConfig({
              ...config,
              passwordPolicy: { ...config.passwordPolicy, preventReuse: parseInt(e.target.value) }
            })}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
      >
        <h3 className="font-semibold text-gray-900">Session Management</h3>
        <Input
          label="Max Concurrent Sessions"
          type="number"
          value={config.sessionManagement.maxSessions}
          onChange={(e) => setConfig({
            ...config,
            sessionManagement: { ...config.sessionManagement, maxSessions: parseInt(e.target.value) }
          })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Session Timeout (seconds)"
            type="number"
            value={config.sessionManagement.sessionTimeout}
            onChange={(e) => setConfig({
              ...config,
              sessionManagement: { ...config.sessionManagement, sessionTimeout: parseInt(e.target.value) }
            })}
          />
          <Input
            label="Idle Timeout (seconds)"
            type="number"
            value={config.sessionManagement.idleTimeout}
            onChange={(e) => setConfig({
              ...config,
              sessionManagement: { ...config.sessionManagement, idleTimeout: parseInt(e.target.value) }
            })}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={config.sessionManagement.requireReauthForSensitive}
            onChange={(requireReauthForSensitive) => setConfig({
              ...config,
              sessionManagement: { ...config.sessionManagement, requireReauthForSensitive }
            })}
          />
          <span className="text-sm text-gray-700">Require re-authentication for sensitive actions</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
      >
        <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={config.twoFactor.enforceForAdmins}
              onChange={(enforceForAdmins) => setConfig({
                ...config,
                twoFactor: { ...config.twoFactor, enforceForAdmins }
              })}
            />
            <span className="text-sm text-gray-700">Enforce for admins</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.twoFactor.enforceForAll}
              onChange={(enforceForAll) => setConfig({
                ...config,
                twoFactor: { ...config.twoFactor, enforceForAll }
              })}
            />
            <span className="text-sm text-gray-700">Enforce for all users</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
      >
        <h3 className="font-semibold text-gray-900">Audit Logging</h3>
        <Input
          label="Retention Period (days)"
          type="number"
          value={config.auditLog.retentionDays}
          onChange={(e) => setConfig({
            ...config,
            auditLog: { ...config.auditLog, retentionDays: parseInt(e.target.value) }
          })}
        />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={config.auditLog.logFailedLogins}
              onChange={(logFailedLogins) => setConfig({
                ...config,
                auditLog: { ...config.auditLog, logFailedLogins }
              })}
            />
            <span className="text-sm text-gray-700">Log failed login attempts</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.auditLog.logPasswordChanges}
              onChange={(logPasswordChanges) => setConfig({
                ...config,
                auditLog: { ...config.auditLog, logPasswordChanges }
              })}
            />
            <span className="text-sm text-gray-700">Log password changes</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.auditLog.logSettingsChanges}
              onChange={(logSettingsChanges) => setConfig({
                ...config,
                auditLog: { ...config.auditLog, logSettingsChanges }
              })}
            />
            <span className="text-sm text-gray-700">Log settings changes</span>
          </div>
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

export default SecuritySettings;
