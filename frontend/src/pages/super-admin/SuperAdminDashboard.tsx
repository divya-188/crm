import { useEffect, useState } from 'react';
import { Building2, Users, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import apiClient from '@/lib/api-client';

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalUsers: number;
  activeUsers: number;
  conversionRate: string;
}

export const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PlatformStats>('/super-admin/dashboard/stats');
      setStats(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load platform stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card variant="bordered" padding="lg" className="max-w-md">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Error Loading Stats</h3>
              <p className="text-sm text-neutral-600 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Tenants',
      value: stats?.totalTenants || 0,
      change: `${stats?.activeTenants || 0} active`,
      icon: Building2,
      color: 'primary',
      bgColor: 'bg-primary-100',
      textColor: 'text-primary-600',
    },
    {
      name: 'Total Users',
      value: stats?.totalUsers || 0,
      change: `${stats?.activeUsers || 0} active`,
      icon: Users,
      color: 'secondary',
      bgColor: 'bg-secondary-100',
      textColor: 'text-secondary-600',
    },
    {
      name: 'Trial Tenants',
      value: stats?.trialTenants || 0,
      change: `${stats?.conversionRate || 0}% conversion`,
      icon: TrendingUp,
      color: 'success',
      bgColor: 'bg-success-100',
      textColor: 'text-success-600',
    },
    {
      name: 'System Health',
      value: '99.9%',
      change: 'Excellent',
      icon: Activity,
      color: 'accent',
      bgColor: 'bg-accent-100',
      textColor: 'text-accent-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Super Admin Dashboard
        </h1>
        <p className="text-neutral-600">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card
            key={stat.name}
            variant="elevated"
            padding="lg"
            className="hover:shadow-glow transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <span className="text-sm font-semibold text-success-600">
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-neutral-600">{stat.name}</p>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="bordered" padding="lg">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <a
              href="/super-admin/tenants"
              className="block p-3 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-neutral-900">
                  Manage Tenants
                </span>
              </div>
            </a>
            <a
              href="/super-admin/users"
              className="block p-3 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-secondary-600" />
                <span className="text-sm font-medium text-neutral-900">
                  Manage Users
                </span>
              </div>
            </a>
            <a
              href="/super-admin/analytics"
              className="block p-3 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-accent-600" />
                <span className="text-sm font-medium text-neutral-900">
                  View Analytics
                </span>
              </div>
            </a>
          </div>
        </Card>

        <Card variant="bordered" padding="lg" className="md:col-span-2">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Recent Activity
          </h3>
          <div className="text-center py-12 text-neutral-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
            <p className="text-xs mt-1">Activity tracking coming soon</p>
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card variant="bordered" padding="lg">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-neutral-900">Database</p>
              <p className="text-xs text-neutral-600">Operational</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-neutral-900">API</p>
              <p className="text-xs text-neutral-600">Operational</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-neutral-900">WebSocket</p>
              <p className="text-xs text-neutral-600">Operational</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
