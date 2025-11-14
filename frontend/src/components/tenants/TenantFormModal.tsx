import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Building2, 
  Save, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Users, 
  Settings as SettingsIcon,
  Globe,
  Hash,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { tenantsService, Tenant, CreateTenantData } from '../../services/tenants.service';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant | null;
  onSuccess: () => void;
}

const TenantFormModal: React.FC<TenantFormModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSuccess,
}) => {
  const isEdit = !!tenant;
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const [formData, setFormData] = useState<CreateTenantData>({
    name: '',
    slug: '',
    domain: '',
    subscriptionPlanId: '',
    settings: {},
    limits: {
      maxUsers: 10,
      maxContacts: 1000,
      maxMessages: 10000,
      maxWhatsAppConnections: 1,
    },
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain || '',
        subscriptionPlanId: tenant.subscriptionPlanId || '',
        settings: tenant.settings || {},
        limits: tenant.limits || {
          maxUsers: 10,
          maxContacts: 1000,
          maxMessages: 10000,
          maxWhatsAppConnections: 1,
        },
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        domain: '',
        subscriptionPlanId: '',
        settings: {},
        limits: {
          maxUsers: 10,
          maxContacts: 1000,
          maxMessages: 10000,
          maxWhatsAppConnections: 1,
        },
      });
    }
    setCurrentStep(1);
  }, [tenant, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTenantData) => tenantsService.create(data),
    onSuccess: () => {
      toast.success('Tenant created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create tenant');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateTenantData) => tenantsService.update(tenant!.id, data),
    onSuccess: () => {
      toast.success('Tenant updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update tenant');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Tenant name is required');
      return;
    }
    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'name' && !isEdit && !formData.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleLimitChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      limits: { ...prev.limits, [field]: value },
    }));
  };

  const canProceedToStep2 = () => {
    return formData.name.trim() && formData.slug.trim();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {isEdit ? 'Edit Tenant' : 'Create New Tenant'}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {isEdit ? 'Update tenant information and settings' : 'Set up a new tenant organization'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              Basic Information
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Organization Name *
                </label>
                <Input 
                  value={formData.name} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)} 
                  placeholder="e.g., Acme Corporation" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Slug *
                </label>
                <Input 
                  value={formData.slug} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('slug', e.target.value)} 
                  placeholder="organization-slug" 
                  required 
                />
                <p className="text-xs text-neutral-500 mt-1.5">
                  Used in URLs: <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">/{formData.slug || 'slug'}</code>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Custom Domain (Optional)
                </label>
                <Input 
                  value={formData.domain} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('domain', e.target.value)} 
                  placeholder="e.g., acme.example.com" 
                />
              </div>
            </div>
          </div>

          {/* Resource Limits */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary-600" />
              Resource Limits
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Max Users
                </label>
                <Input 
                  type="number" 
                  min="1" 
                  value={formData.limits?.maxUsers || ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLimitChange('maxUsers', parseInt(e.target.value))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Max Contacts
                </label>
                <Input 
                  type="number" 
                  min="1" 
                  value={formData.limits?.maxContacts || ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLimitChange('maxContacts', parseInt(e.target.value))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Max Messages
                </label>
                <Input 
                  type="number" 
                  min="1" 
                  value={formData.limits?.maxMessages || ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLimitChange('maxMessages', parseInt(e.target.value))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Max WhatsApp
                </label>
                <Input 
                  type="number" 
                  min="1" 
                  value={formData.limits?.maxWhatsAppConnections || ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLimitChange('maxWhatsAppConnections', parseInt(e.target.value))} 
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Update Tenant' : 'Create Tenant'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default TenantFormModal;
