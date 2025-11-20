import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { templatesService } from '@/services/templates.service';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import { 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Pause, 
  Play, 
  Users,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TemplateCampaignUsageProps {
  templateId: string;
  templateName?: string;
}

/**
 * Component to display campaigns using a specific template
 * Requirement 19.6: Track which templates are used in which campaigns
 * 
 * Features:
 * - Shows all campaigns using the template
 * - Filters by active/inactive campaigns
 * - Displays campaign status and metrics
 * - Warns about active campaigns when attempting to delete template
 */
export const TemplateCampaignUsage: React.FC<TemplateCampaignUsageProps> = ({
  templateId,
  templateName,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  // Fetch usage statistics
  const { data: usageStats, isLoading, error } = useQuery({
    queryKey: ['template-usage-stats', templateId],
    queryFn: () => templatesService.getTemplateUsageStats(templateId),
    refetchInterval: 30000, // Refetch every 30 seconds for active campaigns
  });

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        variant="danger"
        title="Error"
        message="Failed to load campaign usage data. Please try again."
      />
    );
  }

  if (!usageStats) {
    return null;
  }

  const { campaigns, totalCampaigns, activeCampaigns, completedCampaigns } = usageStats;

  // Filter campaigns based on active tab
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (activeTab === 'active') {
      return ['running', 'scheduled', 'paused'].includes(campaign.status);
    } else if (activeTab === 'completed') {
      return campaign.status === 'completed';
    }
    return true; // 'all' tab
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      draft: { color: 'bg-gray-100 text-gray-700', icon: <Clock className="h-3 w-3" /> },
      scheduled: { color: 'bg-blue-100 text-blue-700', icon: <Calendar className="h-3 w-3" /> },
      running: { color: 'bg-green-100 text-green-700', icon: <Play className="h-3 w-3" /> },
      paused: { color: 'bg-yellow-100 text-yellow-700', icon: <Pause className="h-3 w-3" /> },
      completed: { color: 'bg-gray-100 text-gray-700', icon: <CheckCircle2 className="h-3 w-3" /> },
      failed: { color: 'bg-red-100 text-red-700', icon: <AlertCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <Badge className={`flex items-center gap-1 ${config.color}`}>
        {config.icon}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  };

  const calculateDeliveryRate = (campaign: any) => {
    if (campaign.sentCount === 0) return 0;
    return ((campaign.deliveredCount / campaign.sentCount) * 100).toFixed(1);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Campaigns</h3>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{totalCampaigns}</div>
          <p className="text-xs text-gray-500 mt-1">Using this template</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Active Campaigns</h3>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{activeCampaigns}</div>
          <p className="text-xs text-gray-500 mt-1">Currently running or scheduled</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Completed Campaigns</h3>
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{completedCampaigns}</div>
          <p className="text-xs text-gray-500 mt-1">Successfully finished</p>
        </Card>
      </div>

      {/* Active Campaign Warning */}
      {activeCampaigns > 0 && (
        <Alert
          variant="warning"
          title="Active Campaigns Using This Template"
          message={`This template is currently being used in ${activeCampaigns} active campaign(s). You cannot delete this template until these campaigns are completed or paused.`}
        />
      )}

      {/* Campaigns Table */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Campaigns Using {templateName || 'This Template'}</h2>
          <p className="text-sm text-gray-600 mt-1">
            View all campaigns that use this template for messaging
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({totalCampaigns})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Active ({activeCampaigns})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'completed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed ({completedCampaigns})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Campaigns Found</h3>
            <p className="text-sm text-gray-600 max-w-sm">
              {activeTab === 'active' 
                ? 'There are no active campaigns using this template.'
                : activeTab === 'completed'
                ? 'There are no completed campaigns using this template.'
                : 'This template has not been used in any campaigns yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                      {campaign.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span>{campaign.totalRecipients.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      {campaign.sentCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      {calculateDeliveryRate(campaign)}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(campaign.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(campaign.startedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TemplateCampaignUsage;
