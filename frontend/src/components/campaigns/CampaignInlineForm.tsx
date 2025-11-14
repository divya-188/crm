import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, Loader2, Send, X, FileText, Users, Calendar, Eye } from 'lucide-react';
import { campaignsService } from '@/services/campaigns.service';
import { templatesService } from '@/services/templates.service';
import { contactsService } from '@/services/contacts.service';
import { Campaign, CreateCampaignDto, ContactSegmentCriteria } from '@/types/models.types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { SegmentBuilder } from '@/components/contacts/SegmentBuilder';
import toast from 'react-hot-toast';

interface CampaignInlineFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  campaign?: Campaign | null;
  mode?: 'create' | 'edit';
}

const CampaignInlineForm: React.FC<CampaignInlineFormProps> = ({ 
  onSuccess, 
  onCancel, 
  campaign = null,
  mode = 'create'
}) => {
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit' || !!campaign;

  const [formData, setFormData] = useState<Partial<CreateCampaignDto>>({
    name: '',
    templateId: '',
    segmentCriteria: {
      tags: [],
      customFields: {},
    },
    scheduledAt: undefined,
  });

  const [segmentCriteria, setSegmentCriteria] = useState<ContactSegmentCriteria>({
    logic: 'AND',
    conditions: [],
  });

  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  // Fetch approved templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', 'approved'],
    queryFn: () => templatesService.getTemplates({ status: 'approved', limit: 100 }),
  });

  // Populate form data when editing
  useEffect(() => {
    if (campaign && isEditMode) {
      setFormData({
        name: campaign.name,
        templateId: campaign.template?.id || '',
        segmentCriteria: campaign.segmentFilters || {
          tags: [],
          customFields: {},
        },
        scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString() : undefined,
      });

      if (campaign.scheduledAt) {
        const date = new Date(campaign.scheduledAt);
        setScheduleType('later');
        setScheduledDate(date.toISOString().split('T')[0]);
        setScheduledTime(date.toTimeString().slice(0, 5));
      }
    }
  }, [campaign, isEditMode]);

  // Preview audience count
  const previewAudienceMutation = useMutation({
    mutationFn: (criteria: ContactSegmentCriteria) =>
      contactsService.previewSegment(criteria),
    onSuccess: (data) => {
      setAudienceCount(data.count);
      toast.success(`Audience: ${data.count} contacts`);
    },
    onError: () => {
      toast.error('Failed to preview audience');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCampaignDto) => campaignsService.createCampaign(data),
    onSuccess: () => {
      toast.success('Campaign created successfully');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateCampaignDto>) =>
      campaignsService.updateCampaign(campaign!.id, data),
    onSuccess: () => {
      toast.success('Campaign updated successfully');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update campaign');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    if (!formData.templateId) {
      toast.error('Please select a template');
      return;
    }

    if (segmentCriteria.conditions.length === 0) {
      toast.error('Please define your target audience');
      return;
    }

    if (scheduleType === 'later' && (!scheduledDate || !scheduledTime)) {
      toast.error('Please set schedule date and time');
      return;
    }

    const submitData: CreateCampaignDto = {
      name: formData.name!,
      templateId: formData.templateId!,
      segmentCriteria: {
        tags: segmentCriteria.conditions
          .filter((c) => c.field === 'tags')
          .map((c) => c.value)
          .flat(),
        customFields: {},
      },
      scheduledAt:
        scheduleType === 'later' && scheduledDate && scheduledTime
          ? `${scheduledDate}T${scheduledTime}:00Z`
          : undefined,
    };

    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreviewAudience = () => {
    if (segmentCriteria.conditions.length === 0) {
      toast.error('Please add at least one condition');
      return;
    }
    previewAudienceMutation.mutate(segmentCriteria);
  };

  const selectedTemplate = templatesData?.data.find(
    (t) => t.id === formData.templateId
  );

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-primary-200 dark:border-primary-800 shadow-xl p-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
            <Send className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isEditMode ? 'Edit Campaign' : 'Create New Campaign'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {isEditMode ? 'Update campaign details and settings' : 'Create a new WhatsApp broadcast campaign'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Campaign Details */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-primary-600" />
            Campaign Details
          </h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Campaign Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
              placeholder="e.g., Summer Sale 2024"
              required
            />
          </div>
        </div>

        {/* Template Selection */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Message Template
          </h3>
          {templatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : templatesData?.data && templatesData.data.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Select Template *
              </label>
              <Select
                value={formData.templateId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('templateId', e.target.value)}
                required
                options={[
                  { value: '', label: 'Select a template...' },
                  ...templatesData.data.map((template) => ({
                    value: template.id,
                    label: `${template.name} (${template.language})`,
                  })),
                ]}
              />
              {selectedTemplate && (
                <Card className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-white">
                        {selectedTemplate.name}
                      </h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {selectedTemplate.category} • {selectedTemplate.language}
                      </p>
                    </div>
                    <Badge variant="success">Approved</Badge>
                  </div>
                  <div className="bg-white dark:bg-neutral-900 rounded p-3">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                      {selectedTemplate.content}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-600 dark:text-neutral-400">
                No approved templates available. Please create and approve a template first.
              </p>
            </Card>
          )}
        </div>

        {/* Audience Segmentation */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Target Audience
          </h3>
          <SegmentBuilder
            criteria={segmentCriteria}
            onChange={(criteria) => {
              setSegmentCriteria(criteria);
              setAudienceCount(null);
            }}
            previewCount={audienceCount ?? undefined}
            onPreview={handlePreviewAudience}
          />
          {audienceCount !== null && (
            <Card className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="font-medium text-primary-900 dark:text-primary-100">
                    Estimated Audience
                  </p>
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    This campaign will reach approximately {audienceCount} contacts
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Scheduling */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={`p-4 cursor-pointer transition-all ${
                scheduleType === 'now'
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setScheduleType('now')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  scheduleType === 'now'
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-neutral-300 dark:border-neutral-600'
                }`}>
                  {scheduleType === 'now' && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white">
                    Send Now
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Start sending immediately
                  </p>
                </div>
              </div>
            </Card>
            <Card
              className={`p-4 cursor-pointer transition-all ${
                scheduleType === 'later'
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setScheduleType('later')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  scheduleType === 'later'
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-neutral-300 dark:border-neutral-600'
                }`}>
                  {scheduleType === 'later' && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white">
                    Schedule for Later
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Choose a specific date and time
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {scheduleType === 'later' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Date *
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required={scheduleType === 'later'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Time *
                </label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScheduledTime(e.target.value)}
                  required={scheduleType === 'later'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update Campaign' : 'Create Campaign'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default CampaignInlineForm;
