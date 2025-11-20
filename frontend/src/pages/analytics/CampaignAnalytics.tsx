import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  CheckCircle2,
  Eye,
  XCircle,
  TrendingUp,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { analyticsService } from '@/services';
import Spinner from '@/components/ui/Spinner';
import { DateRangeSelector, DateRange } from '@/components/analytics/DateRangeSelector';
import { ExportButton } from '@/components/analytics/ExportButton';
import { pageVariants, cardVariants } from '@/lib/motion-variants';
import { CHART_COLORS } from '@/lib/theme-colors';

const COLORS = CHART_COLORS;

interface CampaignPerformance {
  id: string;
  name: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  deliveryRate: number;
  readRate: number;
}

export const CampaignAnalytics: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsService.getCampaignAnalytics(dateRange);
      setCampaigns(data.campaignPerformance || []);
    } catch (error) {
      console.error('Failed to load campaign analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalStats = campaigns.reduce(
    (acc, campaign) => ({
      sent: acc.sent + campaign.sentCount,
      delivered: acc.delivered + campaign.deliveredCount,
      read: acc.read + campaign.readCount,
      failed: acc.failed + campaign.failedCount,
    }),
    { sent: 0, delivered: 0, read: 0, failed: 0 }
  );

  const avgDeliveryRate =
    campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + c.deliveryRate, 0) / campaigns.length
      : 0;

  const avgReadRate =
    campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + c.readRate, 0) / campaigns.length
      : 0;

  const stats = [
    {
      name: 'Total Sent',
      value: totalStats.sent.toLocaleString(),
      icon: Send,
      color: 'primary',
      bgColor: 'bg-primary-100',
      textColor: 'text-primary-600',
    },
    {
      name: 'Delivered',
      value: totalStats.delivered.toLocaleString(),
      icon: CheckCircle2,
      color: 'success',
      bgColor: 'bg-success-100',
      textColor: 'text-success-600',
    },
    {
      name: 'Read',
      value: totalStats.read.toLocaleString(),
      icon: Eye,
      color: 'secondary',
      bgColor: 'bg-secondary-100',
      textColor: 'text-secondary-600',
    },
    {
      name: 'Failed',
      value: totalStats.failed.toLocaleString(),
      icon: XCircle,
      color: 'danger',
      bgColor: 'bg-danger-100',
      textColor: 'text-danger-600',
    },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Campaign Analytics
          </h1>
          <p className="text-neutral-600">
            Track performance and engagement of your campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton type="campaigns" dateRange={dateRange} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            variants={cardVariants}
            initial="rest"
            whileHover="hover"
            custom={index}
            className="bg-white rounded-xl p-6 shadow-soft"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
              >
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-neutral-600">{stat.name}</p>
          </motion.div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Rate */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Delivery Rate
          </h2>
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={COLORS.success}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(avgDeliveryRate / 100) * 440} 440`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-neutral-900">
                    {avgDeliveryRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-neutral-600">Average</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Read Rate */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Read Rate
          </h2>
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={COLORS.secondary}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(avgReadRate / 100) * 440} 440`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-neutral-900">
                    {avgReadRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-neutral-600">Average</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Campaign Performance Chart */}
      <motion.div
        variants={cardVariants}
        initial="rest"
        whileHover="hover"
        className="bg-white rounded-xl p-6 shadow-soft"
      >
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Campaign Performance Comparison
        </h2>
        {campaigns.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={campaigns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar
                dataKey="sentCount"
                name="Sent"
                fill={COLORS.primary}
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="deliveredCount"
                name="Delivered"
                fill={COLORS.success}
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="readCount"
                name="Read"
                fill={COLORS.secondary}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No campaign data available</p>
          </div>
        )}
      </motion.div>

      {/* Campaign List */}
      <motion.div
        variants={cardVariants}
        initial="rest"
        whileHover="hover"
        className="bg-white rounded-xl p-6 shadow-soft"
      >
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Campaign Details
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                  Campaign
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Recipients
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Sent
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Delivered
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Read
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Delivery Rate
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Read Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign, index) => (
                <motion.tr
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="font-medium text-neutral-900">{campaign.name}</p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {campaign.status}
                    </p>
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-neutral-700">
                    {campaign.totalRecipients.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-neutral-700">
                    {campaign.sentCount.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-neutral-700">
                    {campaign.deliveredCount.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-neutral-700">
                    {campaign.readCount.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        campaign.deliveryRate >= 90
                          ? 'bg-success-100 text-success-700'
                          : campaign.deliveryRate >= 70
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-danger-100 text-danger-700'
                      }`}
                    >
                      {campaign.deliveryRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        campaign.readRate >= 50
                          ? 'bg-success-100 text-success-700'
                          : campaign.readRate >= 30
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-danger-100 text-danger-700'
                      }`}
                    >
                      {campaign.readRate.toFixed(1)}%
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};
