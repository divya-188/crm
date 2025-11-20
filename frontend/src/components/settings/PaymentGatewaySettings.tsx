import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { toast } from '../../lib/toast';
import { paymentGatewaySettingsService } from '../../services/payment-gateway-settings.service';

interface PaymentGatewayConfig {
  stripe?: {
    enabled: boolean;
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  paypal?: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
  };
  razorpay?: {
    enabled: boolean;
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
}

export const PaymentGatewaySettings: React.FC = () => {
  const [config, setConfig] = useState<PaymentGatewayConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState({
    stripe: false,
    paypal: false,
    razorpay: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await paymentGatewaySettingsService.getSettings();
      setConfig(data);
    } catch (error) {
      toast.error('Failed to load payment gateway settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await paymentGatewaySettingsService.updateSettings(config);
      toast.success('Payment gateway settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider: 'stripe' | 'paypal' | 'razorpay') => {
    setTesting(provider);
    try {
      const credentials = config[provider];
      const result = await paymentGatewaySettingsService.testConnection(provider, credentials);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`Failed to test ${provider} connection`);
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payment Gateway Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure payment providers for subscription billing
        </p>
      </div>

      {/* Stripe */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stripe</h3>
              <p className="text-sm text-gray-600">Accept credit card payments</p>
            </div>
          </div>
          <Switch
            checked={config.stripe?.enabled || false}
            onChange={(enabled) => setConfig({
              ...config,
              stripe: { ...config.stripe!, enabled }
            })}
          />
        </div>

        {config.stripe?.enabled && (
          <div className="space-y-4 mt-4">
            <Input
              label="Publishable Key"
              value={config.stripe?.publicKey || ''}
              onChange={(e) => setConfig({
                ...config,
                stripe: { ...config.stripe!, publicKey: e.target.value }
              })}
              placeholder="pk_test_..."
            />
            <div className="relative">
              <Input
                label="Secret Key"
                type={showSecrets.stripe ? 'text' : 'password'}
                value={config.stripe?.secretKey || ''}
                onChange={(e) => setConfig({
                  ...config,
                  stripe: { ...config.stripe!, secretKey: e.target.value }
                })}
                placeholder="sk_test_..."
              />
              <button
                type="button"
                onClick={() => setShowSecrets({ ...showSecrets, stripe: !showSecrets.stripe })}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showSecrets.stripe ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Webhook Secret"
                type={showSecrets.stripe ? 'text' : 'password'}
                value={config.stripe?.webhookSecret || ''}
                onChange={(e) => setConfig({
                  ...config,
                  stripe: { ...config.stripe!, webhookSecret: e.target.value }
                })}
                placeholder="whsec_..."
              />
              <button
                type="button"
                onClick={() => setShowSecrets({ ...showSecrets, stripe: !showSecrets.stripe })}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showSecrets.stripe ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection('stripe')}
              disabled={testing === 'stripe'}
            >
              {testing === 'stripe' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
        )}
      </motion.div>

      {/* PayPal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">PayPal</h3>
              <p className="text-sm text-gray-600">Accept PayPal payments</p>
            </div>
          </div>
          <Switch
            checked={config.paypal?.enabled || false}
            onChange={(enabled) => setConfig({
              ...config,
              paypal: { ...config.paypal!, enabled }
            })}
          />
        </div>

        {config.paypal?.enabled && (
          <div className="space-y-4 mt-4">
            <Input
              label="Client ID"
              value={config.paypal?.clientId || ''}
              onChange={(e) => setConfig({
                ...config,
                paypal: { ...config.paypal!, clientId: e.target.value }
              })}
              placeholder="AYSq3RDGsmBLJE-otTkBtM-jBRd1TCQwFf9RGfwddNXWz0uFU9ztymylOhRS"
            />
            <div className="relative">
              <Input
                label="Client Secret"
                type={showSecrets.paypal ? 'text' : 'password'}
                value={config.paypal?.clientSecret || ''}
                onChange={(e) => setConfig({
                  ...config,
                  paypal: { ...config.paypal!, clientSecret: e.target.value }
                })}
                placeholder="EGnHDxD_qRPdaLdZz8iCr8N7_MzF-YHOGtauNzdetched9GASynRTRU6U16_"
              />
              <button
                type="button"
                onClick={() => setShowSecrets({ ...showSecrets, paypal: !showSecrets.paypal })}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showSecrets.paypal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Select
              label="Mode"
              value={config.paypal?.mode || 'sandbox'}
              onChange={(e) => setConfig({
                ...config,
                paypal: { ...config.paypal!, mode: e.target.value as 'sandbox' | 'live' }
              })}
              options={[
                { value: 'sandbox', label: 'Sandbox (Test)' },
                { value: 'live', label: 'Live (Production)' },
              ]}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection('paypal')}
              disabled={testing === 'paypal'}
            >
              {testing === 'paypal' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Razorpay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Razorpay</h3>
              <p className="text-sm text-gray-600">Accept payments in India</p>
            </div>
          </div>
          <Switch
            checked={config.razorpay?.enabled || false}
            onChange={(enabled) => setConfig({
              ...config,
              razorpay: { ...config.razorpay!, enabled }
            })}
          />
        </div>

        {config.razorpay?.enabled && (
          <div className="space-y-4 mt-4">
            <Input
              label="Key ID"
              value={config.razorpay?.keyId || ''}
              onChange={(e) => setConfig({
                ...config,
                razorpay: { ...config.razorpay!, keyId: e.target.value }
              })}
              placeholder="rzp_test_..."
            />
            <div className="relative">
              <Input
                label="Key Secret"
                type={showSecrets.razorpay ? 'text' : 'password'}
                value={config.razorpay?.keySecret || ''}
                onChange={(e) => setConfig({
                  ...config,
                  razorpay: { ...config.razorpay!, keySecret: e.target.value }
                })}
                placeholder="..."
              />
              <button
                type="button"
                onClick={() => setShowSecrets({ ...showSecrets, razorpay: !showSecrets.razorpay })}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showSecrets.razorpay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Webhook Secret"
                type={showSecrets.razorpay ? 'text' : 'password'}
                value={config.razorpay?.webhookSecret || ''}
                onChange={(e) => setConfig({
                  ...config,
                  razorpay: { ...config.razorpay!, webhookSecret: e.target.value }
                })}
                placeholder="..."
              />
              <button
                type="button"
                onClick={() => setShowSecrets({ ...showSecrets, razorpay: !showSecrets.razorpay })}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showSecrets.razorpay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection('razorpay')}
              disabled={testing === 'razorpay'}
            >
              {testing === 'razorpay' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Save Button */}
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

export default PaymentGatewaySettings;
