import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  FileText, 
  Users, 
  Eye, 
  Calendar, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { SegmentBuilder } from '@/components/contacts/SegmentBuilder';
import { templatesService } from '@/services/templates.service';
import { campaignsService } from '@/services/campaigns.service';
import { contactsService } from '@/services/contacts.service';
import { ContactSegmentCriteria, CreateCampaignDto } from '@/types/models.types';
import toast from '@/lib/toast';
import { fadeInUp } from '@/lib/motion-variants';

interface CampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Campaign Details',
    description: 'Basic information about your campaign',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 2,
    title: 'Select Template',
    description: 'Choose an approved message template',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 3,
    title: 'Audience',
    description: 'Define your target audience',
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: 4,
    title: 'Personalization',
    description: 'Preview and customize messages',
    icon: <Eye className="w-5 h-5" />,
  },
  {
    id: 5,
    title: 'Schedule',
    description: 'Set when to send your campaign',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    id: 6,
    title: 'Review',
    description: 'Review and launch your campaign',
    icon: <CheckCircle className="w-5 h-5" />,
  },
];

export const CampaignWizard = ({ isOpen, onClose, onSuccess }: CampaignWizardProps) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState<Partial<CreateCampaignDto>>({
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
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({});
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  // Fetch approved templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', 'approved'],
    queryFn: () => templatesService.getTemplates({ status: 'approved', limit: 100 }),
    enabled: isOpen,
  });

  // Preview audience count
  const previewAudienceMutation = useMutation({
    mutationFn: (criteria: ContactSegmentCriteria) =>
      contactsService.previewSegment(criteria),
    onSuccess: (data) => {
      setAudienceCount(data.count);
    },
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: (data: CreateCampaignDto) => campaignsService.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created successfully!');
      onSuccess?.();
      handleClose();
    },
    onError: () => {
      toast.error('Failed to create campaign');
    },
  });

  const selectedTemplate = templatesData?.data.find(
    (t) => t.id === campaignData.templateId
  );

  const handleClose = () => {
    setCurrentStep(1);
    setCampaignData({
      name: '',
      templateId: '',
      segmentCriteria: {
        tags: [],
        customFields: {},
      },
      scheduledAt: undefined,
    });
    setSegmentCriteria({ logic: 'AND', conditions: [] });
    setVariableMapping({});
    setScheduleType('now');
    setScheduledDate('');
    setScheduledTime('');
    setAudienceCount(null);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePreviewAudience = () => {
    previewAudienceMutation.mutate(segmentCriteria);
  };

  const handleSubmit = () => {
    const finalData: CreateCampaignDto = {
      name: campaignData.name!,
      templateId: campaignData.templateId!,
      segmentCriteria: campaignData.segmentCriteria!,
      scheduledAt:
        scheduleType === 'later' && scheduledDate && scheduledTime
          ? `${scheduledDate}T${scheduledTime}:00Z`
          : undefined,
    };

    createCampaignMutation.mutate(finalData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return campaignData.name && campaignData.name.trim().length > 0;
      case 2:
        return !!campaignData.templateId;
      case 3:
        return segmentCriteria.conditions.length > 0;
      case 4:
        return true; // Personalization is optional
      case 5:
        return scheduleType === 'now' || (scheduledDate && scheduledTime);
      case 6:
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Campaign
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Follow the steps to create and launch your WhatsApp campaign
            </p>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                        currentStep > step.id
                          ? 'bg-green-500 border-green-500 text-white'
                          : currentStep === step.id
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-xs font-medium ${
                          currentStep >= step.id
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 transition-all ${
                        currentStep > step.id
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Step 1: Campaign Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Campaign Details
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Campaign Name *
                          </label>
                          <Input
                            placeholder="e.g., Summer Sale 2024"
                            value={campaignData.name}
                            onChange={(e) =>
                              setCampaignData({ ...campaignData, name: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description (Optional)
                          </label>
                          <Textarea
                            placeholder="Describe the purpose of this campaign..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Template Selection */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Select Template
                      </h3>
                      {templatesLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Spinner size="lg" />
                        </div>
                      ) : templatesData?.data && templatesData.data.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {templatesData.data.map((template) => (
                            <Card
                              key={template.id}
                              className={`p-4 cursor-pointer transition-all ${
                                campaignData.templateId === template.id
                                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'hover:shadow-md'
                              }`}
                              onClick={() =>
                                setCampaignData({ ...campaignData, templateId: template.id })
                              }
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {template.name}
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {template.language}
                                  </p>
                                </div>
                                {campaignData.templateId === template.id && (
                                  <CheckCircle className="w-5 h-5 text-blue-500" />
                                )}
                              </div>
                              <div className="bg-white dark:bg-gray-800 rounded p-3 mb-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                                  {template.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="success">Approved</Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {template.category}
                                </span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="p-12 text-center">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Approved Templates
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            You need at least one approved template to create a campaign.
                          </p>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Audience Segmentation */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Define Your Audience
                      </h3>
                      <SegmentBuilder
                        criteria={segmentCriteria}
                        onChange={(criteria) => {
                          setSegmentCriteria(criteria);
                          setCampaignData({
                            ...campaignData,
                            segmentCriteria: {
                              tags: criteria.conditions
                                .filter((c) => c.field === 'tags')
                                .map((c) => c.value)
                                .flat(),
                              customFields: {},
                            },
                          });
                          setAudienceCount(null);
                        }}
                        previewCount={audienceCount ?? undefined}
                        onPreview={handlePreviewAudience}
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Personalization Preview */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Message Personalization
                      </h3>
                      {selectedTemplate && (
                        <div className="space-y-4">
                          <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                              Template Preview
                            </h4>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {selectedTemplate.content}
                              </p>
                            </div>
                          </Card>

                          {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                            <Card className="p-4">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                                Variable Mapping
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Map template variables to contact fields for personalization
                              </p>
                              <div className="space-y-3">
                                {selectedTemplate.variables.map((variable) => (
                                  <div key={variable.name} className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Variable: {variable.name}
                                      </label>
                                      <Input
                                        value={variable.example}
                                        disabled
                                        className="bg-gray-100 dark:bg-gray-700"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Contact Field
                                      </label>
                                      <Select
                                        value={variableMapping[variable.name] || ''}
                                        onChange={(e) =>
                                          setVariableMapping({
                                            ...variableMapping,
                                            [variable.name]: e.target.value,
                                          })
                                        }
                                        options={[
                                          { value: '', label: 'Select field...' },
                                          { value: 'firstName', label: 'First Name' },
                                          { value: 'lastName', label: 'Last Name' },
                                          { value: 'email', label: 'Email' },
                                          { value: 'phone', label: 'Phone' },
                                        ]}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          )}

                          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                            <div className="flex items-start gap-3">
                              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                  Preview Example
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  {selectedTemplate.content.replace(
                                    /\{\{(\w+)\}\}/g,
                                    (match, varName) => {
                                      const field = variableMapping[varName];
                                      return field ? `[${field}]` : match;
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: Scheduling */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Schedule Campaign
                      </h3>
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <Card
                            className={`flex-1 p-4 cursor-pointer transition-all ${
                              scheduleType === 'now'
                                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:shadow-md'
                            }`}
                            onClick={() => setScheduleType('now')}
                          >
                            <div className="flex items-center gap-3">
                              {scheduleType === 'now' && (
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                              )}
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  Send Now
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Start sending immediately
                                </p>
                              </div>
                            </div>
                          </Card>
                          <Card
                            className={`flex-1 p-4 cursor-pointer transition-all ${
                              scheduleType === 'later'
                                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:shadow-md'
                            }`}
                            onClick={() => setScheduleType('later')}
                          >
                            <div className="flex items-center gap-3">
                              {scheduleType === 'later' && (
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                              )}
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  Schedule for Later
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Choose a specific date and time
                                </p>
                              </div>
                            </div>
                          </Card>
                        </div>

                        {scheduleType === 'later' && (
                          <Card className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Date *
                                </label>
                                <Input
                                  type="date"
                                  value={scheduledDate}
                                  onChange={(e) => setScheduledDate(e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Time *
                                </label>
                                <Input
                                  type="time"
                                  value={scheduledTime}
                                  onChange={(e) => setScheduledTime(e.target.value)}
                                />
                              </div>
                            </div>
                          </Card>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Review */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Review Campaign
                      </h3>
                      <div className="space-y-4">
                        <Card className="p-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                            Campaign Details
                          </h4>
                          <dl className="space-y-2">
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600 dark:text-gray-400">Name:</dt>
                              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                {campaignData.name}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600 dark:text-gray-400">
                                Template:
                              </dt>
                              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                {selectedTemplate?.name}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600 dark:text-gray-400">
                                Audience:
                              </dt>
                              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                {audienceCount ?? 'Not calculated'} contacts
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600 dark:text-gray-400">
                                Schedule:
                              </dt>
                              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                {scheduleType === 'now'
                                  ? 'Send immediately'
                                  : `${scheduledDate} at ${scheduledTime}`}
                              </dd>
                            </div>
                          </dl>
                        </Card>

                        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                                Important
                              </h4>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Once launched, the campaign will start sending messages to your
                                audience. Make sure all details are correct before proceeding.
                              </p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <Button variant="outline" onClick={currentStep === 1 ? handleClose : handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            <div className="flex items-center gap-3">
              {currentStep < STEPS.length ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed()}
                  loading={createCampaignMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
