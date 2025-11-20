import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';
import Toast from '@/lib/toast-system';
import { Palette, Upload, Crown, Lock } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface TenantBranding {
  logoUrl?: string;
  faviconUrl?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  typography?: {
    fontFamily?: string;
    headingFont?: string;
    fontSize?: Record<string, string>;
  };
  customCss?: string;
  companyName?: string;
  tagline?: string;
}

const fontFamilies = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Ubuntu', label: 'Ubuntu' },
];

export default function TenantBrandingSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<TenantBranding>({
    colors: {
      primary: '#8b5cf6',
      secondary: '#06b6d4',
      accent: '#f59e0b',
    },
    typography: {
      fontFamily: 'Inter',
    },
  });

  // Check white-label status
  const { data: whiteLabelStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['white-label-status'],
    queryFn: async () => {
      const response = await apiClient.get('/tenants/settings/branding/white-label-status');
      return response.data;
    },
  });

  // Get branding settings
  const { data: branding, isLoading: isLoadingBranding } = useQuery({
    queryKey: ['tenant-branding'],
    queryFn: async () => {
      const response = await apiClient.get('/tenants/settings/branding');
      return response.data;
    },
    enabled: whiteLabelStatus?.enabled === true,
  });

  useEffect(() => {
    if (branding) {
      setFormData(branding);
    }
  }, [branding]);

  const updateMutation = useMutation({
    mutationFn: async (data: TenantBranding) => {
      const response = await apiClient.put('/tenants/settings/branding', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-branding'] });
      Toast.success('Branding updated successfully');
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to update branding');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleColorChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [field]: value,
      },
    }));
  };

  const handleTypographyChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [field]: value,
      },
    }));
  };

  if (isLoadingStatus || isLoadingBranding) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  // Show upgrade message if white-label is not enabled
  if (!whiteLabelStatus?.enabled) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Branding</h2>
            <p className="text-sm text-neutral-600">Customize your brand appearance</p>
          </div>
        </div>

        <Alert variant="info" className="mb-6">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">
                White-Label Branding is a Premium Feature
              </h3>
              <p className="text-sm text-neutral-600 mb-3">
                Upgrade your subscription plan to unlock custom branding and make this platform truly yours.
              </p>
              <ul className="text-sm text-neutral-600 space-y-1 mb-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                  Custom logo and favicon
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                  Brand colors and typography
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                  Custom CSS for advanced customization
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                  Remove platform branding
                </li>
              </ul>
              <Button variant="primary" size="sm">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          </div>
        </Alert>

        <div className="p-8 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 text-center">
          <Lock className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-600">
            Branding customization is locked. Upgrade to access this feature.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <Palette className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-neutral-900">Branding</h2>
          <p className="text-sm text-neutral-600">Customize your brand appearance</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
          <Crown className="w-4 h-4" />
          Premium
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Company Name
            </label>
            <Input
              value={formData.companyName || ''}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Your Company Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Tagline
            </label>
            <Input
              value={formData.tagline || ''}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Your company tagline"
            />
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Logo
          </label>
          <div className="flex items-center gap-4">
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt="Logo"
                className="h-16 object-contain"
              />
            ) : (
              <div className="w-32 h-16 bg-neutral-100 rounded-lg flex items-center justify-center">
                <span className="text-sm text-neutral-400">No logo</span>
              </div>
            )}
            <Button type="button" variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload Logo
            </Button>
          </div>
        </div>

        {/* Favicon */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Favicon
          </label>
          <div className="flex items-center gap-4">
            {formData.faviconUrl ? (
              <img
                src={formData.faviconUrl}
                alt="Favicon"
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-neutral-100 rounded flex items-center justify-center">
                <span className="text-xs text-neutral-400">?</span>
              </div>
            )}
            <Button type="button" variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload Favicon
            </Button>
          </div>
        </div>

        {/* Colors */}
        <div className="pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Brand Colors</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.colors?.primary || '#8b5cf6'}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-12 h-12 rounded border border-neutral-300 cursor-pointer"
                />
                <Input
                  value={formData.colors?.primary || '#8b5cf6'}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  placeholder="#8b5cf6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.colors?.secondary || '#06b6d4'}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-12 h-12 rounded border border-neutral-300 cursor-pointer"
                />
                <Input
                  value={formData.colors?.secondary || '#06b6d4'}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  placeholder="#06b6d4"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.colors?.accent || '#f59e0b'}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="w-12 h-12 rounded border border-neutral-300 cursor-pointer"
                />
                <Input
                  value={formData.colors?.accent || '#f59e0b'}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  placeholder="#f59e0b"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Typography</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Body Font
              </label>
              <select
                value={formData.typography?.fontFamily || 'Inter'}
                onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {fontFamilies.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Heading Font
              </label>
              <select
                value={formData.typography?.headingFont || 'Inter'}
                onChange={(e) => handleTypographyChange('headingFont', e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {fontFamilies.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Custom CSS */}
        <div className="pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Custom CSS</h3>
          <textarea
            value={formData.customCss || ''}
            onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
            placeholder="/* Add your custom CSS here */"
            rows={6}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
          />
          <p className="text-xs text-neutral-500 mt-2">
            Advanced: Add custom CSS to further customize your platform's appearance
          </p>
        </div>

        {/* Preview */}
        <div className="pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Preview</h3>
          <div className="p-6 rounded-lg border border-neutral-200 bg-neutral-50">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-lg"
                style={{ backgroundColor: formData.colors?.primary || '#8b5cf6' }}
              />
              <div
                className="w-12 h-12 rounded-lg"
                style={{ backgroundColor: formData.colors?.secondary || '#06b6d4' }}
              />
              <div
                className="w-12 h-12 rounded-lg"
                style={{ backgroundColor: formData.colors?.accent || '#f59e0b' }}
              />
            </div>
            <h4
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: formData.typography?.headingFont || 'Inter' }}
            >
              {formData.companyName || 'Your Company Name'}
            </h4>
            <p
              className="text-sm text-neutral-600"
              style={{ fontFamily: formData.typography?.fontFamily || 'Inter' }}
            >
              {formData.tagline || 'Your custom branding will be applied across the entire platform'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (branding) {
                setFormData(branding);
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
