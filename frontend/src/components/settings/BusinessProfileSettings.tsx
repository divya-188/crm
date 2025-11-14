import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { toast } from 'react-hot-toast';
import settingsService, { BusinessProfile } from '../../services/settings.service';
import { Building2, Clock } from 'lucide-react';

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function BusinessProfileSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BusinessProfile>({
    businessName: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    businessHours: {},
  });

  const { data: businessProfile, isLoading } = useQuery({
    queryKey: ['businessProfile'],
    queryFn: settingsService.getBusinessProfile,
  });

  useEffect(() => {
    if (businessProfile) {
      setFormData({
        businessName: businessProfile.businessName || '',
        description: businessProfile.description || '',
        email: businessProfile.email || '',
        phone: businessProfile.phone || '',
        address: businessProfile.address || '',
        website: businessProfile.website || '',
        businessHours: businessProfile.businessHours || {},
      });
    }
  }, [businessProfile]);

  const updateMutation = useMutation({
    mutationFn: settingsService.updateBusinessProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessProfile'] });
      toast.success('Business profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update business profile');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof BusinessProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBusinessHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...(prev.businessHours as any)?.[day],
          [field]: value,
        },
      },
    }));
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
          <Building2 className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Business Profile</h2>
          <p className="text-sm text-neutral-600">Manage your business information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Business Name"
          value={formData.businessName}
          onChange={(e) => handleChange('businessName', e.target.value)}
          placeholder="Acme Corporation"
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Tell customers about your business..."
          rows={4}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="contact@acme.com"
          />
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="123 Main St, City, State 12345"
        />

        <Input
          label="Website"
          type="url"
          value={formData.website}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="https://www.acme.com"
        />

        <div className="pt-6 border-t border-neutral-200">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-neutral-600" />
            <h3 className="text-sm font-semibold text-neutral-900">Business Hours</h3>
          </div>
          <div className="space-y-3">
            {daysOfWeek.map((day) => {
              const hours = (formData.businessHours as any)?.[day] || { open: '09:00', close: '17:00', closed: false };
              return (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-28">
                    <span className="text-sm font-medium text-neutral-700 capitalize">{day}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!hours.closed}
                    onChange={(e) => handleBusinessHoursChange(day, 'closed', !e.target.checked)}
                    className="rounded border-neutral-300"
                  />
                  {!hours.closed && (
                    <>
                      <input
                        type="time"
                        value={hours.open || '09:00'}
                        onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                      />
                      <span className="text-neutral-500">to</span>
                      <input
                        type="time"
                        value={hours.close || '17:00'}
                        onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                      />
                    </>
                  )}
                  {hours.closed && (
                    <span className="text-sm text-neutral-500">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (businessProfile) {
                setFormData({
                  businessName: businessProfile.businessName || '',
                  description: businessProfile.description || '',
                  email: businessProfile.email || '',
                  phone: businessProfile.phone || '',
                  address: businessProfile.address || '',
                  website: businessProfile.website || '',
                  businessHours: businessProfile.businessHours || {},
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
