import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../ui/Card';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { toast } from 'react-hot-toast';
import settingsService from '../../services/settings.service';
import { Globe } from 'lucide-react';

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'Mumbai, Kolkata' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'fr', label: 'Français (French)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'pt', label: 'Português (Portuguese)' },
  { value: 'it', label: 'Italiano (Italian)' },
  { value: 'nl', label: 'Nederlands (Dutch)' },
  { value: 'ar', label: 'العربية (Arabic)' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'zh', label: '中文 (Chinese)' },
  { value: 'ja', label: '日本語 (Japanese)' },
  { value: 'ko', label: '한국어 (Korean)' },
];

export default function LanguageSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    timezone: 'UTC',
    language: 'en',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        timezone: settings.timezone || 'UTC',
        language: settings.language || 'en',
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Language and timezone settings updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
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
          <Globe className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Language & Timezone</h2>
          <p className="text-sm text-neutral-600">Set your preferred language and timezone</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Language */}
        <Select
          label="Language"
          value={formData.language}
          onChange={(e) => handleChange('language', e.target.value)}
          options={languages}
        />

        {/* Timezone */}
        <Select
          label="Timezone"
          value={formData.timezone}
          onChange={(e) => handleChange('timezone', e.target.value)}
          options={timezones}
        />

        {/* Info */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <p className="text-sm text-primary-900">
            <strong>Note:</strong> Changing your timezone will affect how dates and times are displayed throughout the application.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData({
              timezone: settings?.timezone || 'UTC',
              language: settings?.language || 'en',
            })}
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
