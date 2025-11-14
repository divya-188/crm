import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Workflow,
  Play,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

interface FlowPerformance {
  id: string;
  name: string;
  status: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
}

export const FlowAnalytics: React.FC = () => {
  const [flows, setFlows] = useState<FlowPerformance[]>([]);
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
      const data = await analyticsService.getFlowAnalytics(dateRange);
      setFlows(data.flowPerformance || []);
    } catch (error) {
      console.error('Failed to load flow analytics:', error);
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

  const totalExecutions = flows.reduce(
    (sum, flow) => sum + flow.executionCount,
    0
  );
  const totalSuccess = flows.reduce((sum, flow) => sum + flow.successCount, 0);
  const totalFailures = flows.reduce((sum, flow) => sum + flow.failureCount, 0);
  const avgSuccessRate =
    flows.length > 0
      ? flows.reduce((sum, flow) => sum + flow.successRate, 0) / flows.length
      : 0;

  const stats = [
    {
      name: 'Total Executions',
      value: totalExecutions.toLocaleString(),
      icon: Play,
      color: 'primary',
      bgColor: 'bg-primary-100',
      textColor: 'text-primary-600',
    },
    {
      name: 'Successful',
      value: totalSuccess.toLocaleString(),
      icon: CheckCircle2,
      color: 'success',
      bgColor: 'bg-success-100',
      textColor: 'text-success-600',
    },
    {
      name: 'Failed',
      value: totalFailures.toLocaleString(),
      icon: XCircle,
      color: 'danger',
      bgColor: 'bg-danger-100',
      textColor: 'text-danger-600',
    },
    {
      name: 'Avg Success Rate',
      value: `${avgSuccessRate.toFixed(1)}%`,
      icon: Target,
      color: 'secondary',
      bgColor: 'bg-secondary-100',
      textColor: 'text-secondary-600',
    },
  ];

  const executionData = [
    { name: 'Successful', value: totalSuccess, color: COLORS.success },
    { name: 'Failed', value: totalFailures, color: COLORS.danger },
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
            Flow Analytics
          </h1>
          <p className="text-neutral-600">
            Monitor chatbot flow performance and completion rates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton type="flows" dateRange={dateRange} />
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
        {/* Execution Distribution */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Execution Distribution
          </h2>
          {executionData.some((d) => d.value > 0) ? (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={executionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {executionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {executionData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-neutral-700">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-neutral-900">
                        {item.value.toLocaleString()}
                      </span>
                      <span className="text-xs text-neutral-500 w-12 text-right">
                        {totalExecutions > 0
                          ? ((item.value / totalExecutions) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <Workflow className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No execution data available</p>
            </div>
          )}
        </motion.div>

        {/* Success Rate by Flow */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Success Rate by Flow
          </h2>
          {flows.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={flows} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar
                  dataKey="successRate"
                  name="Success Rate"
                  fill={COLORS.success}
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No flow data available</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Flow Performance Comparison */}
      <motion.div
        variants={cardVariants}
        initial="rest"
        whileHover="hover"
        className="bg-white rounded-xl p-6 shadow-soft"
      >
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Flow Performance Comparison
        </h2>
        {flows.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={flows}>
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
                dataKey="executionCount"
                name="Total Executions"
                fill={COLORS.primary}
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="successCount"
                name="Successful"
                fill={COLORS.success}
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="failureCount"
                name="Failed"
                fill={COLORS.danger}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <Workflow className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No flow data available</p>
          </div>
        )}
      </motion.div>

      {/* Flow Details Table */}
      <motion.div
        variants={cardVariants}
        initial="rest"
        whileHover="hover"
        className="bg-white rounded-xl p-6 shadow-soft"
      >
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Flow Details
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                  Flow Name
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Executions
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Successful
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Failed
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {flows.map((flow, index) => (
                <motion.tr
                  key={flow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-primary-500" />
                      <span className="font-medium text-neutral-900">
                        {flow.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                        flow.status === 'active'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {flow.status}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-neutral-700">
                    {flow.executionCount.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-success-600 font-semibold">
                    {flow.successCount.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-danger-600 font-semibold">
                    {flow.failureCount.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            flow.successRate >= 80
                              ? 'bg-success-500'
                              : flow.successRate >= 60
                              ? 'bg-warning-500'
                              : 'bg-danger-500'
                          }`}
                          style={{ width: `${flow.successRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-neutral-900 w-12 text-right">
                        {flow.successRate.toFixed(1)}%
                      </span>
                    </div>
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
