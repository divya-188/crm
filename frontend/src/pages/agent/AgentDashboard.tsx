import { MessageSquare, Clock, CheckCircle, TrendingUp } from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const stats = [
    {
      name: 'Open Conversations',
      value: '12',
      change: '3 new',
      icon: MessageSquare,
      color: 'primary',
    },
    {
      name: 'Avg Response Time',
      value: '2.5 min',
      change: '-30s',
      icon: Clock,
      color: 'secondary',
    },
    {
      name: 'Resolved Today',
      value: '28',
      change: '+5',
      icon: CheckCircle,
      color: 'success',
    },
    {
      name: 'Satisfaction Rate',
      value: '96%',
      change: '+2%',
      icon: TrendingUp,
      color: 'accent',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Agent Dashboard</h1>
        <p className="text-neutral-600">Your performance overview and active conversations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl p-6 shadow-soft hover:shadow-glow transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}
              >
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <span className="text-sm font-semibold text-success-600">{stat.change}</span>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-neutral-600">{stat.name}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Active Conversations</h2>
        <div className="text-center py-12 text-neutral-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active conversations</p>
        </div>
      </div>
    </div>
  );
};
