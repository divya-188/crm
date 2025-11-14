import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
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
import { analyticsService } from '@/services';
import Spinner from '@/components/ui/Spinner';
import { DateRangeSelector, DateRange } from '@/components/analytics/DateRangeSelector';
import { ExportButton } from '@/components/analytics/ExportButton';
import { pageVariants, cardVariants } from '@/lib/motion-variants';

const COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  accent: '#f59e0b',
  success: '#3b82f6',
  danger: '#f43f5e',
  warning: '#eab308',
};

const STATUS_COLORS = {
  open: COLORS.primary,
  pending: COLORS.warning,
  resolved: COLORS.success,
  closed: COLORS.secondary,
};

interface ConversationAnalytics {
  total: number;
  byStatus: Record<string, number>;
  avgResponseTime: number;
  trend: Array<{ date: string; value: number }>;
}

export const ConversationAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<ConversationAnalytics | null>(null);
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
      const data = await analyticsService.getConversationAnalytics(dateRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load conversation analytics:', error);
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

  const statusData = analytics
    ? Object.entries(analytics.byStatus).map(([status, count]) => ({
        status,
        count,
        percentage: (count / analytics.total) * 100,
      }))
    : [];

  const stats = [
    {
      name: 'Total Conversations',
      value: analytics?.total.toString() || '0',
      icon: MessageSquare,
      color: 'primary',
      bgColor: 'bg-primary-100',
      textColor: 'text-primary-600',
    },
    {
      name: 'Open Conversations',
      value: analytics?.byStatus.open?.toString() || '0',
      icon: AlertCircle,
      color: 'warning',
      bgColor: 'bg-warning-100',
      textColor: 'text-warning-600',
    },
    {
      name: 'Resolved',
      value: analytics?.byStatus.resolved?.toString() || '0',
      icon: CheckCircle,
      color: 'success',
      bgColor: 'bg-success-100',
      textColor: 'text-success-600',
    },
    {
      name: 'Avg Response Time',
      value: formatResponseTime(analytics?.avgResponseTime || 0),
      icon: Clock,
      color: 'accent',
      bgColor: 'bg-accent-100',
      textColor: 'text-accent-600',
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
            Conversation Analytics
          </h1>
          <p className="text-neutral-600">
            Detailed insights into your conversation performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton type="conversations" dateRange={dateRange} />
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation Trend */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Conversation Trend
          </h2>
          {analytics?.trend && analytics.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString()
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Conversations"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No trend data available</p>
            </div>
          )}
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Status Distribution
          </h2>
          {statusData.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            STATUS_COLORS[
                              entry.status as keyof typeof STATUS_COLORS
                            ] || COLORS.primary
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {statusData.map((status) => (
                  <div
                    key={status.status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            STATUS_COLORS[
                              status.status as keyof typeof STATUS_COLORS
                            ] || COLORS.primary,
                        }}
                      />
                      <span className="text-sm font-medium text-neutral-700 capitalize">
                        {status.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-neutral-900">
                        {status.count}
                      </span>
                      <span className="text-xs text-neutral-500 w-12 text-right">
                        {status.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No status data available</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Response Time Analysis */}
      <motion.div
        variants={cardVariants}
        initial="rest"
        whileHover="hover"
        className="bg-white rounded-xl p-6 shadow-soft"
      >
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Response Time Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-neutral-50 rounded-lg">
            <Clock className="w-8 h-8 mx-auto mb-3 text-primary-500" />
            <p className="text-2xl font-bold text-neutral-900 mb-1">
              {formatResponseTime(analytics?.avgResponseTime || 0)}
            </p>
            <p className="text-sm text-neutral-600">Average Response Time</p>
          </div>
          <div className="text-center p-6 bg-neutral-50 rounded-lg">
            <CheckCircle className="w-8 h-8 mx-auto mb-3 text-success-500" />
            <p className="text-2xl font-bold text-neutral-900 mb-1">
              {analytics?.byStatus.resolved || 0}
            </p>
            <p className="text-sm text-neutral-600">Resolved Conversations</p>
          </div>
          <div className="text-center p-6 bg-neutral-50 rounded-lg">
            <XCircle className="w-8 h-8 mx-auto mb-3 text-danger-500" />
            <p className="text-2xl font-bold text-neutral-900 mb-1">
              {analytics?.byStatus.closed || 0}
            </p>
            <p className="text-sm text-neutral-600">Closed Conversations</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

function formatResponseTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  } else {
    return `${Math.round(seconds / 3600)}h`;
  }
}
