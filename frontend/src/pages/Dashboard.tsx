import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
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
import { DashboardMetrics } from '@/types/models.types';
import { useSocket } from '@/hooks/useSocket';
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

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    loadMetrics();
  }, []);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      // Refresh metrics when new message arrives
      loadMetrics();
    };

    const handleConversationUpdate = () => {
      // Refresh metrics when conversation status changes
      loadMetrics();
    };

    socket.on('message:new', handleNewMessage);
    socket.on('conversation:updated', handleConversationUpdate);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:updated', handleConversationUpdate);
    };
  }, [socket]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsService.getDashboardMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Failed to load dashboard data');
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

  if (error) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
          <p className="text-neutral-600">
            Welcome to your WhatsApp CRM dashboard. Here's what's happening today.
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </motion.div>
    );
  }

  const stats = metrics
    ? [
        {
          name: 'Total Conversations',
          value: metrics.totalConversations?.toString() || '0',
          change: metrics.conversationGrowth
            ? `${metrics.conversationGrowth > 0 ? '+' : ''}${metrics.conversationGrowth.toFixed(1)}%`
            : '0%',
          icon: MessageSquare,
          color: 'primary',
          bgColor: 'bg-primary-100',
          textColor: 'text-primary-600',
          isPositive: (metrics.conversationGrowth || 0) >= 0,
        },
        {
          name: 'Active Contacts',
          value: metrics.totalContacts?.toString() || '0',
          change: metrics.contactGrowth
            ? `${metrics.contactGrowth > 0 ? '+' : ''}${metrics.contactGrowth.toFixed(1)}%`
            : '0%',
          icon: Users,
          color: 'secondary',
          bgColor: 'bg-secondary-100',
          textColor: 'text-secondary-600',
          isPositive: (metrics.contactGrowth || 0) >= 0,
        },
        {
          name: 'Messages Sent',
          value: metrics.totalMessages?.toString() || '0',
          change: metrics.messageGrowth
            ? `${metrics.messageGrowth > 0 ? '+' : ''}${metrics.messageGrowth.toFixed(1)}%`
            : '0%',
          icon: TrendingUp,
          color: 'success',
          bgColor: 'bg-success-100',
          textColor: 'text-success-600',
          isPositive: (metrics.messageGrowth || 0) >= 0,
        },
        {
          name: 'Avg Response Time',
          value: formatResponseTime(metrics.averageResponseTime || 0),
          change: metrics.responseRateChange
            ? `${metrics.responseRateChange > 0 ? '+' : ''}${metrics.responseRateChange.toFixed(1)}%`
            : '0%',
          icon: Clock,
          color: 'accent',
          bgColor: 'bg-accent-100',
          textColor: 'text-accent-600',
          isPositive: (metrics.responseRateChange || 0) <= 0, // Lower is better for response time
        },
      ]
    : [];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
        <p className="text-neutral-600">
          Welcome to your WhatsApp CRM dashboard. Here's what's happening today.
        </p>
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
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <span
                className={`text-sm font-semibold ${
                  stat.isPositive ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-neutral-600">{stat.name}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation Trend Chart */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Conversation Trend
          </h2>
          {metrics?.conversationTrend && metrics.conversationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.conversationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
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
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No conversation data available</p>
            </div>
          )}
        </motion.div>

        {/* Message Volume Chart */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Message Volume
          </h2>
          {metrics?.messageTrend && metrics.messageTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.messageTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  name="Messages"
                  fill={COLORS.secondary}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No message data available</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Agents Leaderboard */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Top Agents
          </h2>
          {metrics?.topAgents && metrics.topAgents.length > 0 ? (
            <div className="space-y-4">
              {metrics.topAgents.map((agent, index) => (
                <motion.div
                  key={agent.agentId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{agent.agentName}</p>
                      <p className="text-xs text-neutral-500">
                        {agent.conversationsHandled} conversations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">
                      {agent.resolutionRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-neutral-500">Resolution Rate</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No agent data available</p>
            </div>
          )}
        </motion.div>

        {/* Status Breakdown */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Conversation Status
          </h2>
          {metrics?.conversationsByStatus && metrics.conversationsByStatus.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={metrics.conversationsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {metrics.conversationsByStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || COLORS.primary}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {metrics.conversationsByStatus.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: STATUS_COLORS[status.status as keyof typeof STATUS_COLORS] || COLORS.primary,
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
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No status data available</p>
            </div>
          )}
        </motion.div>
      </div>
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
