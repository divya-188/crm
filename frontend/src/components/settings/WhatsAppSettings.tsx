import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { 
  Smartphone, 
  Key, 
  Globe, 
  Copy, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  Save,
  Edit2
} from 'lucide-react';
import toast from '../../lib/toast';
import whatsappSettingsService, { WhatsAppConfig } from '../../services/whatsapp-settings.service';

const WhatsAppSettings: React.FC = () => {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [formData, setFormData] = useState<Partial<WhatsAppConfig>>({
    name: '',
    phoneNumberId: '',
    accessToken: '',
    businessAccountId: '',
    webhookUrl: ''
  });

  // Default webhook URL using backend port 3000
  const defaultWebhookUrl = `${window.location.protocol}//${window.location.hostname}:3000/api/v1/webhooks/whatsapp`;

  useEffect(() => {
    loadWhatsAppConfig();
  }, []);

  const loadWhatsAppConfig = async () => {
    try {
      const data = await whatsappSettingsService.getConfig();
      setConfig(data);
      if (data) {
        setFormData({
          name: data.name,
          phoneNumberId: data.phoneNumberId,
          accessToken: data.accessToken,
          businessAccountId: data.businessAccountId,
          webhookUrl: data.webhookUrl || defaultWebhookUrl
        });
        setIsEditing(false);
      } else {
        setFormData(prev => ({
          ...prev,
          webhookUrl: defaultWebhookUrl
        }));
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Failed to load WhatsApp config:', error);
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const generateWebhookSecret = () => {
    return `whatsapp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phoneNumberId || !formData.accessToken || !formData.businessAccountId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name!,
        phoneNumberId: formData.phoneNumberId!,
        accessToken: formData.accessToken!,
        businessAccountId: formData.businessAccountId!,
        webhookSecret: formData.webhookSecret || generateWebhookSecret(),
        webhookUrl: formData.webhookUrl || defaultWebhookUrl
      };

      const savedConfig = config 
        ? await whatsappSettingsService.updateConfig(payload)
        : await whatsappSettingsService.createConfig(payload);
      
      setConfig(savedConfig);
      setIsEditing(false);
      toast.success('WhatsApp configuration saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save WhatsApp configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (config) {
      setFormData({
        name: config.name,
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        businessAccountId: config.businessAccountId
      });
      setIsEditing(false);
    }
  };

  const testConnection = async () => {
    if (!config) return;
    
    setTesting(true);
    try {
      const result = await whatsappSettingsService.testConnection();
      if (result.success) {
        toast.success(result.message);
        loadWhatsAppConfig();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'WhatsApp connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <RefreshCw className="w-4 h-4" />;
      case 'disconnected': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            WhatsApp Integration
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure your WhatsApp Business API connection for automated messaging
          </p>
        </div>
        
        {config && !isEditing && (
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(config.status)}`}>
              {getStatusIcon(config.status)}
              {config.status.charAt(0).toUpperCase() + config.status.slice(1)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Configuration Form/Display */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {!config && !isEditing ? (
          /* Empty State */
          <div className="text-center py-12">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              WhatsApp Not Configured
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Set up your WhatsApp Business API connection to start sending and receiving messages automatically.
            </p>
            <Button onClick={() => setIsEditing(true)}>
              <Smartphone className="w-4 h-4 mr-2" />
              Setup WhatsApp Integration
            </Button>
          </div>
        ) : isEditing ? (
          /* Edit Mode - Inline Form */
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Before you start:</h4>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>Create a Meta Developer account and WhatsApp Business app</li>
                    <li>Get your Phone Number ID and Access Token from Meta Dashboard</li>
                    <li>We'll generate a webhook secret for you</li>
                    <li>Configure the webhook URL in Meta Dashboard after saving</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Connection Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., My WhatsApp Business"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number ID <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.phoneNumberId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                  placeholder="From Meta Dashboard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={formData.accessToken || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
                  placeholder="Permanent access token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Account ID <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.businessAccountId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessAccountId: e.target.value }))}
                  placeholder="WhatsApp Business Account ID"
                />
              </div>
            </div>

            {/* Webhook Configuration */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-blue-900 mb-2">Webhook Configuration</h4>
              
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Webhook URL <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.webhookUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://your-domain.com/api/v1/webhooks/whatsapp"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(formData.webhookUrl || '', 'Webhook URL')}
                    title="Copy Webhook URL"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Configure this URL in your Meta Developer Dashboard
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Verify Token
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={formData.webhookSecret || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, webhookSecret: e.target.value }))}
                      placeholder="Enter manually or generate"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, webhookSecret: generateWebhookSecret() }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-blue-100 rounded transition-colors"
                      title="Generate Token"
                    >
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(formData.webhookSecret || '', 'Verify Token')}
                    title="Copy Verify Token"
                    disabled={!formData.webhookSecret}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Use this token to verify webhook requests in Meta Dashboard
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {config && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.phoneNumberId || !formData.accessToken || !formData.businessAccountId}
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {config ? 'Update Configuration' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode - Display Configuration */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Connection Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Connection Details
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Connection Name</label>
                    <p className="text-sm text-gray-900 mt-1">{config.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone Number ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {config.phoneNumberId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(config.phoneNumberId, 'Phone Number ID')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Business Account ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {config.businessAccountId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(config.businessAccountId, 'Business Account ID')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhook Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Webhook Configuration
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Webhook URL</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded flex-1 truncate">
                        {config.webhookUrl}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(config.webhookUrl, 'Webhook URL')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use this URL in your Meta Developer Dashboard
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Webhook Secret</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                        {showTokens ? config.webhookSecret : '••••••••••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTokens(!showTokens)}
                      >
                        {showTokens ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(config.webhookSecret, 'Webhook Secret')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use this as the Verify Token in Meta Dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
              <Button
                onClick={testConnection}
                disabled={testing || !config}
                variant="outline"
                title={!config ? 'Save configuration first before testing' : 'Test WhatsApp connection'}
              >
                {testing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Meta Developer Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppSettings;
