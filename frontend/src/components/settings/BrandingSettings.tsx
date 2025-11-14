import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { toast } from 'react-hot-toast';
import settingsService, { Branding } from '../../services/settings.service';
import { Palette, Upload } from 'lucide-react';

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

export default function BrandingSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Branding>({
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#8b5cf6',
    secondaryColor: '#06b6d4',
    accentColor: '#f59e0b',
    fontFamily: 'Inter',
  });

  const { data: branding, isLoading } = useQuery({
    queryKey: ['branding'],
    queryFn: settingsService.getBranding,
  });

  useEffect(() => {
    if (branding) {
      setFormData({
        logoUrl: branding.logoUrl || '',
        faviconUrl: branding.faviconUrl || '',
        primaryColor: branding.primaryColor || '#8b5cf6',
        secondaryColor: branding.secondaryColor || '#06b6d4',
        accentColor: branding.accentColor || '#f59e0b',
        fontFamily: branding.fontFamily || 'Inter',
      });
    }
  }, [branding]);

  const updateMutation = useMutation({
    mutationFn: settingsService.updateBranding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      toast.success('Branding updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update branding');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof Branding, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <Spinner size="lg" />
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
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Branding</h2>
          <p className="text-sm text-neutral-600">Customize your brand appearance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="w-12 h-12 rounded border border-neutral-300 cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
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
                  value={formData.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  className="w-12 h-12 rounded border border-neutral-300 cursor-pointer"
                />
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
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
                  value={formData.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  className="w-12 h-12 rounded border border-neutral-300 cursor-pointer"
                />
                <Input
                  value={formData.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  placeholder="#f59e0b"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Typography</h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Font Family
            </label>
            <select
              value={formData.fontFamily}
              onChange={(e) => handleChange('fontFamily', e.target.value)}
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

        {/* Preview */}
        <div className="pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Preview</h3>
          <div className="p-6 rounded-lg border border-neutral-200 bg-neutral-50">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-lg"
                style={{ backgroundColor: formData.primaryColor }}
              />
              <div
                className="w-12 h-12 rounded-lg"
                style={{ backgroundColor: formData.secondaryColor }}
              />
              <div
                className="w-12 h-12 rounded-lg"
                style={{ backgroundColor: formData.accentColor }}
              />
            </div>
            <p
              className="text-lg font-semibold"
              style={{ fontFamily: formData.fontFamily }}
            >
              This is how your brand will look
            </p>
            <p
              className="text-sm text-neutral-600 mt-2"
              style={{ fontFamily: formData.fontFamily }}
            >
              Your custom branding will be applied across the entire platform
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
                setFormData({
                  logoUrl: branding.logoUrl || '',
                  faviconUrl: branding.faviconUrl || '',
                  primaryColor: branding.primaryColor || '#8b5cf6',
                  secondaryColor: branding.secondaryColor || '#06b6d4',
                  accentColor: branding.accentColor || '#f59e0b',
                  fontFamily: branding.fontFamily || 'Inter',
                });
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
