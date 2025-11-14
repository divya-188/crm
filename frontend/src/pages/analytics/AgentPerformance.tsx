import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Clock,
  TrendingUp,
  Award,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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

interface AgentPerformance {
  agentId: string;
  agentName: string;
  conversationsHandled: number;
  averageResponseTime: number;
  resolutionRate: number;
  customerSatisfaction?: number;
}

export const AgentPerformance: React.FC = () => {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
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
      const data = await analyticsService.getAgentAnalytics(dateRange);
      setAgents(data.agentPerformance || []);
    } catch (error) {
      console.error('Failed to load agent analytics:', error);
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

  const totalConversations = agents.reduce(
    (sum, agent) => sum + agent.conversationsHandled,
    0
  );
  const avgResponseTime =
    agents.length > 0
      ? agents.reduce((sum, agent) => sum + agent.averageResponseTime, 0) /
        agents.length
      : 0;
  const avgResolutionRate =
    agents.length > 0
      ? agents.reduce((sum, agent) => sum + agent.resolutionRate, 0) /
        agents.length
      : 0;

  const stats = [
    {
      name: 'Total Agents',
      value: agents.length.toString(),
      icon: Users,
      color: 'primary',
      bgColor: 'bg-primary-100',
      textColor: 'text-primary-600',
    },
    {
      name: 'Conversations Handled',
      value: totalConversations.toLocaleString(),
      icon: MessageSquare,
      color: 'secondary',
      bgColor: 'bg-secondary-100',
      textColor: 'text-secondary-600',
    },
    {
      name: 'Avg Response Time',
      value: formatResponseTime(avgResponseTime),
      icon: Clock,
      color: 'accent',
      bgColor: 'bg-accent-100',
      textColor: 'text-accent-600',
    },
    {
      name: 'Avg Resolution Rate',
      value: `${avgResolutionRate.toFixed(1)}%`,
      icon: Target,
      color: 'success',
      bgColor: 'bg-success-100',
      textColor: 'text-success-600',
    },
  ];

  // Prepare radar chart data for top 5 agents
  const topAgents = [...agents]
    .sort((a, b) => b.conversationsHandled - a.conversationsHandled)
    .slice(0, 5);

  const radarData = topAgents.map((agent) => ({
    agent: agent.agentName.split(' ')[0], // First name only
    conversations: (agent.conversationsHandled / totalConversations) * 100,
    responseTime: Math.max(0, 100 - (agent.averageResponseTime / 600) * 100), // Inverse scale
    resolutionRate: agent.resolutionRate,
  }));

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
            Agent Performance
          </h1>
          <p className="text-neutral-600">
            Monitor and analyze your team's performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <ExportButton type="agents" dateRange={dateRange} />
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
        {/* Conversations by Agent */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Conversations by Agent
          </h2>
          {agents.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agents} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="agentName"
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
                />
                <Bar
                  dataKey="conversationsHandled"
                  name="Conversations"
                  fill={COLORS.primary}
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No agent data available</p>
            </div>
          )}
        </motion.div>

        {/* Performance Radar */}
        <motion.div
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="bg-white rounded-xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Top Agents Performance
          </h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="agent" stroke="#64748b" fontSize={12} />
                <PolarRadiusAxis stroke="#64748b" fontSize={12} />
                <Radar
                  name="Conversations %"
                  dataKey="conversations"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.3}
                />
                <Radar
                  name="Response Time"
                  dataKey="responseTime"
                  stroke={COLORS.accent}
                  fill={COLORS.accent}
                  fillOpacity={0.3}
                />
                <Radar
                  name="Resolution Rate"
                  dataKey="resolutionRate"
                  stroke={COLORS.success}
                  fill={COLORS.success}
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No performance data available</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Leaderboard */}
      <motion.div
        variants={cardVariants}
        initial="rest"
        whileHover="hover"
        className="bg-white rounded-xl p-6 shadow-soft"
      >
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Agent Leaderboard
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                  Rank
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                  Agent
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Conversations
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Avg Response Time
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Resolution Rate
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Performance Score
                </th>
              </tr>
            </thead>
            <tbody>
              {agents
                .sort((a, b) => {
                  // Calculate performance score
                  const scoreA =
                    a.conversationsHandled * 0.4 +
                    a.resolutionRate * 0.4 +
                    (600 - a.averageResponseTime) * 0.2;
                  const scoreB =
                    b.conversationsHandled * 0.4 +
                    b.resolutionRate * 0.4 +
                    (600 - b.averageResponseTime) * 0.2;
                  return scoreB - scoreA;
                })
                .map((agent, index) => {
                  const performanceScore =
                    agent.conversationsHandled * 0.4 +
                    agent.resolutionRate * 0.4 +
                    (600 - agent.averageResponseTime) * 0.2;

                  return (
                    <motion.tr
                      key={agent.agentId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {index < 3 ? (
                            <Award
                              className={`w-5 h-5 ${
                                index === 0
                                  ? 'text-warning-500'
                                  : index === 1
                                  ? 'text-neutral-400'
                                  : 'text-accent-600'
                              }`}
                            />
                          ) : (
                            <span className="text-sm font-semibold text-neutral-600 w-5 text-center">
                              {index + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-neutral-900">
                          {agent.agentName}
                        </p>
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-neutral-700">
                        {agent.conversationsHandled.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-neutral-700">
                        {formatResponseTime(agent.averageResponseTime)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            agent.resolutionRate >= 80
                              ? 'bg-success-100 text-success-700'
                              : agent.resolutionRate >= 60
                              ? 'bg-warning-100 text-warning-700'
                              : 'bg-danger-100 text-danger-700'
                          }`}
                        >
                          {agent.resolutionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                              style={{
                                width: `${Math.min(100, (performanceScore / 100) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-neutral-900 w-12 text-right">
                            {performanceScore.toFixed(0)}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
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
