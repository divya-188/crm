import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { templatesService } from '@/services/templates.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Send,
  CheckCircle,
  Eye,
  MessageSquare,
  BarChart3,
  Activity,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface DateRange {
  from: Date;
  to: Date;
}

export const TemplateAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState<'usage' | 'performance'>('usage');

  // Fetch template analytics
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['template-analytics', id, dateRange],
    queryFn: () =>
      templatesService.getTemplateAnalytics(id!, {
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      }),
    enabled: !!id,
  });

  const handleExport = async () => {
    try {
      const exportData = await templatesService.exportAnalytics({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        templateIds: [id!],
        format: 'csv',
      });

      // Create download link
      const blob = new Blob([exportData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${id}-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDateRangeChange = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
  };

  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/templates')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
        <Alert variant="danger" message="Failed to load template analytics. Please try again." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="h-10 w-48 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {analytics.templateName}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{analytics.category}</Badge>
            <Badge variant="secondary">{analytics.language}</Badge>
            <StatusBadge status={analytics.status} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Date Range Selector */}
          <Select
            value={String(Math.round((new Date().getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)))}
            onChange={(e) => handleDateRangeChange(Number(e.target.value))}
            className="w-[180px]"
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
            ]}
          />

          {/* Export Button */}
          <Button variant="secondary" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Messages Sent"
          value={analytics.metrics.totalSent.toLocaleString()}
          icon={<Send className="h-4 w-4 text-neutral-500" />}
          trend={analytics.trends.usageTrend}
          description="Total messages sent"
        />

        <MetricCard
          title="Delivery Rate"
          value={`${analytics.metrics.avgDeliveryRate.toFixed(1)}%`}
          icon={<CheckCircle className="h-4 w-4 text-neutral-500" />}
          trend={analytics.trends.deliveryRateTrend}
          description={`${analytics.metrics.totalDelivered.toLocaleString()} delivered`}
          threshold={85}
          currentValue={analytics.metrics.avgDeliveryRate}
        />

        <MetricCard
          title="Read Rate"
          value={`${analytics.metrics.avgReadRate.toFixed(1)}%`}
          icon={<Eye className="h-4 w-4 text-neutral-500" />}
          trend={analytics.trends.readRateTrend}
          description={`${analytics.metrics.totalRead.toLocaleString()} read`}
          threshold={50}
          currentValue={analytics.metrics.avgReadRate}
        />

        <MetricCard
          title="Response Rate"
          value={`${analytics.metrics.avgResponseRate.toFixed(1)}%`}
          icon={<MessageSquare className="h-4 w-4 text-neutral-500" />}
          trend={analytics.trends.responseRateTrend}
          description={`${analytics.metrics.totalReplied.toLocaleString()} replied`}
          threshold={10}
          currentValue={analytics.metrics.avgResponseRate}
        />
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab('usage')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'usage'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Activity className="inline mr-2 h-4 w-4" />
            Usage Trend
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'performance'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="inline mr-2 h-4 w-4" />
            Performance Comparison
          </button>
        </div>

        {activeTab === 'usage' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-white">Usage Over Time</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Daily message volume from {format(new Date(analytics.dateRange.start), 'MMM dd, yyyy')} to{' '}
                {format(new Date(analytics.dateRange.end), 'MMM dd, yyyy')}
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analytics.dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-neutral-200 bg-white dark:bg-neutral-800 dark:border-neutral-700 p-3 shadow-md">
                            <p className="font-semibold mb-2 text-neutral-900 dark:text-white">
                              {format(new Date(data.date), 'MMM dd, yyyy')}
                            </p>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-neutral-600 dark:text-neutral-400">Sent:</span>
                                <span className="font-medium text-neutral-900 dark:text-white">{data.sendCount}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-neutral-600 dark:text-neutral-400">Delivered:</span>
                                <span className="font-medium text-neutral-900 dark:text-white">{data.deliveredCount}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-neutral-600 dark:text-neutral-400">Read:</span>
                                <span className="font-medium text-neutral-900 dark:text-white">{data.readCount}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-neutral-600 dark:text-neutral-400">Replied:</span>
                                <span className="font-medium text-neutral-900 dark:text-white">{data.repliedCount}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sendCount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Sent"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="deliveredCount"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Delivered"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="readCount"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Read"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="repliedCount"
                    stroke="#a855f7"
                    strokeWidth={2}
                    name="Replied"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {activeTab === 'performance' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-white">
                Performance Metrics Over Time
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Delivery, read, and response rates from {format(new Date(analytics.dateRange.start), 'MMM dd, yyyy')}{' '}
                to {format(new Date(analytics.dateRange.end), 'MMM dd, yyyy')}
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analytics.dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-neutral-200 bg-white dark:bg-neutral-800 dark:border-neutral-700 p-3 shadow-md">
                            <p className="font-semibold mb-2 text-neutral-900 dark:text-white">
                              {format(new Date(data.date), 'MMM dd, yyyy')}
                            </p>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-neutral-600 dark:text-neutral-400">Delivery Rate:</span>
                                <span className="font-medium text-neutral-900 dark:text-white">{data.deliveryRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-neutral-600 dark:text-neutral-400">Read Rate:</span>
                                <span className="font-medium text-neutral-900 dark:text-white">{data.readRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-neutral-600 dark:text-neutral-400">Response Rate:</span>
                                <span className="font-medium text-neutral-900 dark:text-white">{data.responseRate.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="deliveryRate"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Delivery Rate (%)"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="readRate"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Read Rate (%)"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="responseRate"
                    stroke="#a855f7"
                    strokeWidth={2}
                    name="Response Rate (%)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Failed Messages Alert */}
      {analytics.metrics.totalFailed > 0 && (
        <Alert
          variant="danger"
          message={`${analytics.metrics.totalFailed.toLocaleString()} message${
            analytics.metrics.totalFailed !== 1 ? 's' : ''
          } failed to deliver. Review your template content and recipient phone numbers.`}
        />
      )}
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
  description: string;
  threshold?: number;
  currentValue?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  description,
  threshold,
  currentValue,
}) => {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</h3>
          {icon}
        </div>
        <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{value}</div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">{description}</p>
          <TrendIndicator trend={trend} />
        </div>
        {threshold !== undefined && currentValue !== undefined && (
          <div className="mt-2">
            <PerformanceBadge value={currentValue} threshold={threshold} />
          </div>
        )}
      </div>
    </Card>
  );
};

// Trend Indicator Component
const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
  if (trend === 'up') {
    return (
      <Badge variant="success">
        <TrendingUp className="mr-1 h-3 w-3" />
        Up
      </Badge>
    );
  } else if (trend === 'down') {
    return (
      <Badge variant="danger">
        <TrendingDown className="mr-1 h-3 w-3" />
        Down
      </Badge>
    );
  } else {
    return (
      <Badge variant="secondary">
        <Minus className="mr-1 h-3 w-3" />
        Stable
      </Badge>
    );
  }
};

// Performance Badge Component
const PerformanceBadge: React.FC<{ value: number; threshold: number }> = ({ value, threshold }) => {
  if (value >= threshold) {
    return (
      <Badge variant="success">
        <TrendingUp className="mr-1 h-3 w-3" />
        Good
      </Badge>
    );
  } else if (value >= threshold * 0.8) {
    return (
      <Badge variant="secondary">
        <Minus className="mr-1 h-3 w-3" />
        Average
      </Badge>
    );
  } else {
    return (
      <Badge variant="danger">
        <TrendingDown className="mr-1 h-3 w-3" />
        Low
      </Badge>
    );
  }
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { label: string; variant: 'primary' | 'secondary' | 'danger' | 'success' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    pending: { label: 'Pending', variant: 'secondary' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
  };

  const config = statusConfig[status.toLowerCase()] || { label: status, variant: 'secondary' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
