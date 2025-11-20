import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Copy,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Eye,
  TrendingUp,
  Calendar,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react';
import { campaignsService } from '@/services/campaigns.service';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import toast from '@/lib/toast';
import { fadeInUp } from '@/lib/motion-variants';
import { CampaignStatus } from '@/types/models.types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messagesPage, setMessagesPage] = useState(1);

  // Fetch campaign details
  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsService.getCampaign(id!),
    enabled: !!id,
  });

  // Fetch campaign stats
  const { data: stats } = useQuery({
    queryKey: ['campaign-stats', id],
    queryFn: () => campaignsService.getCampaignStats(id!),
    enabled: !!id,
    refetchInterval: campaign?.status === 'running' ? 5000 : false,
  });

  // Fetch campaign messages
  const { data: messagesData } = useQuery({
    queryKey: ['campaign-messages', id, messagesPage],
    queryFn: () =>
      campaignsService.getCampaignMessages(id!, {
        page: messagesPage,
        limit: 20,
      }),
    enabled: !!id,
  });

  // Start/Resume campaign mutation
  const startMutation = useMutation({
    mutationFn: () => campaignsService.startCampaign(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign started successfully');
    },
    onError: () => {
      toast.error('Failed to start campaign');
    },
  });

  // Pause campaign mutation
  const pauseMutation = useMutation({
    mutationFn: () => campaignsService.pauseCampaign(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign paused');
    },
    onError: () => {
      toast.error('Failed to pause campaign');
    },
  });

  // Duplicate campaign mutation
  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!campaign) return;
      return campaignsService.createCampaign({
        name: `${campaign.name} (Copy)`,
        templateId: campaign.templateId,
        segmentCriteria: campaign.segmentCriteria,
      });
    },
    onSuccess: (newCampaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign duplicated successfully');
      navigate(`/campaigns/${newCampaign.id}`);
    },
    onError: () => {
      toast.error('Failed to duplicate campaign');
    },
  });

  // Delete campaign mutation
  const deleteMutation = useMutation({
    mutationFn: () => campaignsService.deleteCampaign(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
      navigate('/campaigns');
    },
    onError: () => {
      toast.error('Failed to delete campaign');
    },
  });

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="primary">
            <Play className="w-3 h-3 mr-1" />
            Running
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="neutral">
            <Pause className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Campaign Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The campaign you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const deliveryData = [
    { name: 'Sent', value: stats?.sentCount || campaign.sentCount, color: '#3B82F6' },
    {
      name: 'Delivered',
      value: stats?.deliveredCount || campaign.deliveredCount,
      color: '#10B981',
    },
    { name: 'Read', value: stats?.readCount || campaign.readCount, color: '#10B981' },
    { name: 'Failed', value: stats?.failedCount || campaign.failedCount, color: '#EF4444' },
  ];

  const progressData = [
    {
      name: 'Progress',
      sent: stats?.sentCount || campaign.sentCount,
      pending: (stats?.totalRecipients || campaign.totalRecipients) - (stats?.sentCount || campaign.sentCount),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
          <div className="flex items-center gap-2">
            {campaign.status === 'draft' && (
              <Button
                variant="primary"
                onClick={() => startMutation.mutate()}
                loading={startMutation.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Campaign
              </Button>
            )}
            {campaign.status === 'running' && (
              <Button
                variant="outline"
                onClick={() => pauseMutation.mutate()}
                loading={pauseMutation.isPending}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button
                variant="primary"
                onClick={() => startMutation.mutate()}
                loading={startMutation.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => duplicateMutation.mutate()}
              loading={duplicateMutation.isPending}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
            {(campaign.status === 'draft' || campaign.status === 'failed') && (
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this campaign?')) {
                    deleteMutation.mutate();
                  }
                }}
                loading={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{campaign.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Template: {campaign.template?.name || 'N/A'}
            </p>
          </div>
          {getStatusBadge(campaign.status)}
        </div>

        {campaign.scheduledAt && (
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Scheduled for: {formatDate(campaign.scheduledAt)}</span>
          </div>
        )}
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Recipients</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.totalRecipients || campaign.totalRecipients}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Sent</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.sentCount || campaign.sentCount}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Delivered</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.deliveredCount || campaign.deliveredCount}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats?.deliveryRate?.toFixed(1) || '0'}% rate
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Eye className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Read</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.readCount || campaign.readCount}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats?.readRate?.toFixed(1) || '0'}% rate
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Failed</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.failedCount || campaign.failedCount}
            </p>
          </Card>
        </div>
      </motion.div>

      {/* Analytics Charts */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Status Pie Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delivery Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deliveryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deliveryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Progress Bar Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Campaign Progress
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" fill="#10B981" name="Sent" />
                <Bar dataKey="pending" fill="#9CA3AF" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </motion.div>

      {/* Campaign Messages */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Campaign Messages
            </h3>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {messagesData && messagesData.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sent At
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Failure Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {messagesData.data.map((message: any) => (
                      <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {message.contact?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {message.contact?.phoneNumber || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {message.status === 'sent' && (
                            <Badge variant="primary">
                              <Send className="w-3 h-3 mr-1" />
                              Sent
                            </Badge>
                          )}
                          {message.status === 'delivered' && (
                            <Badge variant="success">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Delivered
                            </Badge>
                          )}
                          {message.status === 'read' && (
                            <Badge variant="success">
                              <Eye className="w-3 h-3 mr-1" />
                              Read
                            </Badge>
                          )}
                          {message.status === 'failed' && (
                            <Badge variant="danger">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                          {message.status === 'pending' && (
                            <Badge variant="warning">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {message.sentAt ? formatDate(message.sentAt) : 'Not sent'}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                          {message.failureReason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {messagesData.total && messagesData.limit && messagesData.total > messagesData.limit && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessagesPage((p) => Math.max(1, p - 1))}
                    disabled={messagesPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {messagesPage} of {Math.ceil(messagesData.total / messagesData.limit)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessagesPage((p) => p + 1)}
                    disabled={messagesPage >= Math.ceil(messagesData.total / messagesData.limit)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No messages sent yet</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
