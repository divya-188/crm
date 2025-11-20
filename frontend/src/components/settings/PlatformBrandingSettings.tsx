import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Upload, X, Image as ImageIcon, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import toast from '../../lib/toast';
import apiClient from '../../lib/api-client';
import { useSocket } from '../../hooks/useSocket';

interface BrandingConfig {
  logo?: string;
  favicon?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  customCSS?: string;
  companyName: string;
  tagline?: string;
}

export const PlatformBrandingSettings: React.FC = () => {
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const socket = useSocket();

  useEffect(() => {
    loadSettings();
  }, []);

  // Monitor WebSocket connection status
  useEffect(() => {
    if (socket) {
      setRealtimeConnected(socket.connected);

      const handleConnect = () => setRealtimeConnected(true);
      const handleDisconnect = () => setRealtimeConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [socket]);

  // Listen for real-time branding updates from other users
  useEffect(() => {
    if (!socket) return;

    const handleBrandingUpdate = (data: { branding: BrandingConfig }) => {
      console.log('Received real-time branding update:', data);
      setConfig(data.branding);
      toast.success('Branding updated by another user', {
        description: 'The preview has been refreshed with the latest changes.',
      });
    };

    socket.on('branding:updated', handleBrandingUpdate);

    return () => {
      socket.off('branding:updated', handleBrandingUpdate);
    };
  }, [socket]);

  const loadSettings = async () => {
    try {
      const { data } = await apiClient.get('/super-admin/settings/branding');
      setConfig(data);
    } catch (error) {
      toast.error('Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/super-admin/settings/branding', config);
      toast.success('Branding settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Logo must be PNG, JPG, or SVG format');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await apiClient.post('/super-admin/settings/branding/upload/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setConfig({ ...config!, logo: data.url });
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Favicon file size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/x-icon', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Favicon must be ICO, PNG, or JPG format');
      return;
    }

    setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await apiClient.post('/super-admin/settings/branding/upload/favicon', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setConfig({ ...config!, favicon: data.url });
      toast.success('Favicon uploaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) {
        faviconInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setConfig({ ...config!, logo: undefined });
  };

  const handleRemoveFavicon = () => {
    setConfig({ ...config!, favicon: undefined });
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const PreviewPanel = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Live Preview</h3>
        <button
          onClick={() => setShowPreview(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <EyeOff className="w-5 h-5" />
        </button>
      </div>

      {/* Preview Container with Applied Styles */}
      <div
        className="border-2 border-gray-200 rounded-lg overflow-hidden"
        style={{
          fontFamily: config.fonts.body,
          backgroundColor: config.colors.background,
          color: config.colors.text,
        }}
      >
        {/* Header Preview */}
        <div
          className="p-4 border-b"
          style={{ backgroundColor: config.colors.primary }}
        >
          <div className="flex items-center gap-3">
            {config.logo ? (
              <img
                src={config.logo}
                alt="Logo Preview"
                className="h-8 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            ) : (
              <div className="h-8 w-8 bg-white/20 rounded flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h4
                className="font-bold text-white"
                style={{ fontFamily: config.fonts.heading }}
              >
                {config.companyName}
              </h4>
              {config.tagline && (
                <p className="text-xs text-white/80">{config.tagline}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-4 space-y-3">
          <div>
            <h5
              className="font-semibold mb-2"
              style={{
                fontFamily: config.fonts.heading,
                color: config.colors.text,
              }}
            >
              Sample Heading
            </h5>
            <p className="text-sm" style={{ color: config.colors.text }}>
              This is how your content will look with the selected branding.
            </p>
          </div>

          {/* Button Previews */}
          <div className="flex gap-2 flex-wrap">
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: config.colors.primary }}
            >
              Primary Button
            </button>
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: config.colors.secondary }}
            >
              Secondary Button
            </button>
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: config.colors.accent }}
            >
              Accent Button
            </button>
          </div>

          {/* Card Preview */}
          <div
            className="p-3 rounded-lg border"
            style={{
              borderColor: config.colors.primary + '40',
              backgroundColor: config.colors.background,
            }}
          >
            <h6
              className="font-medium text-sm mb-1"
              style={{
                fontFamily: config.fonts.heading,
                color: config.colors.primary,
              }}
            >
              Sample Card
            </h6>
            <p className="text-xs" style={{ color: config.colors.text }}>
              Cards and containers will use these colors and fonts.
            </p>
          </div>

          {/* Link Preview */}
          <div>
            <a
              href="#"
              className="text-sm underline"
              style={{ color: config.colors.accent }}
              onClick={(e) => e.preventDefault()}
            >
              Sample Link
            </a>
          </div>
        </div>

        {/* Footer Preview */}
        <div
          className="p-3 border-t text-center"
          style={{
            backgroundColor: config.colors.secondary,
            borderColor: config.colors.primary + '20',
          }}
        >
          <p className="text-xs text-white">
            © 2024 {config.companyName}. All rights reserved.
          </p>
        </div>
      </div>

      {/* Custom CSS Preview Note */}
      {config.customCSS && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Custom CSS will be applied after saving.
          </p>
        </div>
      )}

      {/* Color Palette */}
      <div className="mt-4">
        <p className="text-xs font-medium text-gray-700 mb-2">Color Palette</p>
        <div className="flex gap-2">
          {Object.entries(config.colors).map(([key, value]) => (
            <div key={key} className="flex-1">
              <div
                className="h-8 rounded border border-gray-200"
                style={{ backgroundColor: value }}
                title={`${key}: ${value}`}
              />
              <p className="text-xs text-gray-500 mt-1 truncate capitalize">
                {key}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Platform Branding</h2>
            <AnimatePresence>
              {realtimeConnected ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-full"
                  title="Real-time updates enabled"
                >
                  <Wifi className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Live</span>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-full"
                  title="Real-time updates disconnected"
                >
                  <WifiOff className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Offline</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Customize the look and feel of your platform. Changes apply instantly to all users.
          </p>
        </div>
        {!showPreview && (
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Show Preview
          </Button>
        )}
      </div>

      <div className={showPreview ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : ''}>
        <div className={showPreview ? 'lg:col-span-2 space-y-6' : 'space-y-6'}>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
      >
        <h3 className="font-semibold text-gray-900">Company Information</h3>
        <Input
          label="Company Name"
          value={config.companyName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, companyName: e.target.value })}
        />
        <Input
          label="Tagline"
          value={config.tagline || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, tagline: e.target.value })}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
      >
        <h3 className="font-semibold text-gray-900">Logo & Favicon</h3>
        
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo
          </label>
          <div className="flex items-start gap-4">
            {config.logo ? (
              <div className="relative">
                <img
                  src={config.logo}
                  alt="Logo"
                  className="h-20 w-20 object-contain border border-gray-200 rounded-lg p-2"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload Logo</>
                )}
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                PNG, JPG, or SVG. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Favicon Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Favicon
          </label>
          <div className="flex items-start gap-4">
            {config.favicon ? (
              <div className="relative">
                <img
                  src={config.favicon}
                  alt="Favicon"
                  className="h-12 w-12 object-contain border border-gray-200 rounded p-1"
                />
                <button
                  onClick={handleRemoveFavicon}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="h-12 w-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/x-icon,image/png,image/jpeg,image/jpg"
                onChange={handleFaviconUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploadingFavicon}
              >
                {uploadingFavicon ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload Favicon</>
                )}
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                ICO, PNG, or JPG. Max 5MB. Recommended: 32x32px or 16x16px.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
      >
        <h3 className="font-semibold text-gray-900">Colors</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(config.colors).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({
                    ...config,
                    colors: { ...config.colors, [key]: e.target.value }
                  })}
                  className="h-10 w-20 rounded border border-gray-300"
                />
                <Input
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({
                    ...config,
                    colors: { ...config.colors, [key]: e.target.value }
                  })}
                  className="flex-1"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
      >
        <h3 className="font-semibold text-gray-900">Typography</h3>
        <Input
          label="Heading Font"
          value={config.fonts.heading}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({
            ...config,
            fonts: { ...config.fonts, heading: e.target.value }
          })}
          placeholder="Inter"
        />
        <Input
          label="Body Font"
          value={config.fonts.body}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({
            ...config,
            fonts: { ...config.fonts, body: e.target.value }
          })}
          placeholder="Inter"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
      >
        <h3 className="font-semibold text-gray-900">Custom CSS</h3>
        <Textarea
          value={config.customCSS || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({ ...config, customCSS: e.target.value })}
          rows={10}
          placeholder="/* Add custom CSS here */"
          className="font-mono text-sm"
        />
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

        {/* Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-1">
            <PreviewPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformBrandingSettings;
