import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  Clock,
  Users,
  MessageSquare,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  Calendar,
  Settings as SettingsIcon,
  BarChart3,
  Info,
  TrendingUp,
  Activity
} from 'lucide-react';
import { tenantsService, Tenant } from '../../services/tenants.service';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';

interface TenantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
}

const statusConfig = {
  active: { 
    label: 'Active', 
    color: 'success', 
    icon: CheckCircle,
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    textColor: 'text-success-700 dark:text-success-400',
  },
  trial: { 
    label: 'Trial', 
    color: 'warning', 
    icon: Clock,
    bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    textColor: 'text-warning-700 dark:text-warning-400',
  },
  suspended: { 
    label: 'Suspended', 
    color: 'danger', 
    icon: AlertCircle,
    bgColor: 'bg-danger-50 dark:bg-danger-900/20',
    textColor: 'text-danger-700 dark:text-danger-400',
  },
  expired: { 
    label: 'Expired', 
    color: 'neutral', 
    icon: XCircle,
    bgColor: 'bg-neutral-100 dark:bg-neutral-800',
    textColor: 'text-neutral-700 dark:text-neutral-400',
  },
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'limits', label: 'Resource Limits', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const TenantDetailModal: React.FC<TenantDetailModalProps> = ({ isOpen, onClose, tenant }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch tenant stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['tenant-stats', tenant.id],
    queryFn: () => tenantsService.getStats(tenant.id),
    enabled: isOpen,
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusInfo = statusConfig[tenant.status as keyof typeof statusConfig] || statusConfig.expired;
  const StatusIcon = statusInfo.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {tenant.name}
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {tenant.slug}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant={statusInfo.color as any} className="flex items-center gap-1.5">
                <StatusIcon className="w-3.5 h-3.5" />
                {statusInfo.label}
              </Badge>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {stats?.users || 0}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Users
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {stats?.contacts || 0}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Contacts
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/20 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {stats?.messages || 0}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Messages
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/20 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-success-600 dark:text-success-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {stats?.whatsappConnections || 0}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            WhatsApp
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Basic Information */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary-600" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          Organization Name
                        </label>
                        <p className="text-base font-semibold text-neutral-900 dark:text-white mt-1">
                          {tenant.name}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          Slug
                        </label>
                        <p className="text-base font-mono font-semibold text-neutral-900 dark:text-white mt-1">
                          {tenant.slug}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          Status
                        </label>
                        <div className="mt-1">
                          <Badge variant={statusInfo.color as any} className="flex items-center gap-1.5 w-fit">
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>

                      {tenant.domain && (
                        <div>
                          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            Custom Domain
                          </label>
                          <p className="text-base font-semibold text-neutral-900 dark:text-white mt-1">
                            {tenant.domain}
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Created
                        </label>
                        <p className="text-base text-neutral-900 dark:text-white mt-1">
                          {formatDate(tenant.createdAt)}
                        </p>
                      </div>

                      {tenant.trialEndsAt && tenant.status === 'trial' && (
                        <div>
                          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Trial Ends
                          </label>
                          <p className="text-base text-warning-600 dark:text-warning-400 font-semibold mt-1">
                            {formatDate(tenant.trialEndsAt)}
                          </p>
                        </div>
                      )}

                      {tenant.subscriptionEndsAt && (
                        <div>
                          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Subscription Ends
                          </label>
                          <p className="text-base text-neutral-900 dark:text-white mt-1">
                            {formatDate(tenant.subscriptionEndsAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Activity */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary-600" />
                      Recent Activity
                    </h3>
                    <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Activity tracking coming soon</p>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'limits' && (
                <motion.div
                  key="limits"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary-600" />
                      Resource Limits & Usage
                    </h3>

                    {tenant.limits ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Users */}
                        <div className="p-5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl border border-primary-200 dark:border-primary-800">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                                  Users
                                </p>
                                <p className="text-xs text-primary-700 dark:text-primary-300">
                                  Active user accounts
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-primary-900 dark:text-primary-100">
                              {stats?.users || 0}
                            </p>
                            <p className="text-lg text-primary-700 dark:text-primary-300">
                              / {tenant.limits?.maxUsers || 0}
                            </p>
                          </div>
                          <div className="mt-3 bg-primary-200 dark:bg-primary-900/40 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  ((stats?.users || 0) / (tenant.limits?.maxUsers || 1)) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Contacts */}
                        <div className="p-5 bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 rounded-xl border border-secondary-200 dark:border-secondary-800">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-secondary-600 flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                                  Contacts
                                </p>
                                <p className="text-xs text-secondary-700 dark:text-secondary-300">
                                  Total contacts stored
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
                              {stats?.contacts || 0}
                            </p>
                            <p className="text-lg text-secondary-700 dark:text-secondary-300">
                              / {tenant.limits.maxContacts?.toLocaleString()}
                            </p>
                          </div>
                          <div className="mt-3 bg-secondary-200 dark:bg-secondary-900/40 rounded-full h-2">
                            <div
                              className="bg-secondary-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  ((stats?.contacts || 0) / (tenant.limits.maxContacts || 1)) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="p-5 bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 rounded-xl border border-accent-200 dark:border-accent-800">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-accent-600 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-accent-900 dark:text-accent-100">
                                  Messages
                                </p>
                                <p className="text-xs text-accent-700 dark:text-accent-300">
                                  Messages sent/received
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-accent-900 dark:text-accent-100">
                              {stats?.messages || 0}
                            </p>
                            <p className="text-lg text-accent-700 dark:text-accent-300">
                              / {tenant.limits.maxMessages?.toLocaleString()}
                            </p>
                          </div>
                          <div className="mt-3 bg-accent-200 dark:bg-accent-900/40 rounded-full h-2">
                            <div
                              className="bg-accent-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  ((stats?.messages || 0) / (tenant.limits.maxMessages || 1)) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* WhatsApp Connections */}
                        <div className="p-5 bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 rounded-xl border border-success-200 dark:border-success-800">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-success-600 flex items-center justify-center">
                                <Phone className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-success-900 dark:text-success-100">
                                  WhatsApp
                                </p>
                                <p className="text-xs text-success-700 dark:text-success-300">
                                  Active connections
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-success-900 dark:text-success-100">
                              {stats?.whatsappConnections || 0}
                            </p>
                            <p className="text-lg text-success-700 dark:text-success-300">
                              / {tenant.limits.maxWhatsAppConnections}
                            </p>
                          </div>
                          <div className="mt-3 bg-success-200 dark:bg-success-900/40 rounded-full h-2">
                            <div
                              className="bg-success-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  ((stats?.whatsappConnections || 0) /
                                    (tenant.limits.maxWhatsAppConnections || 1)) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                        <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No resource limits configured</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5 text-primary-600" />
                      Tenant Settings
                    </h3>
                    {tenant.settings && Object.keys(tenant.settings).length > 0 ? (
                      <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                        <pre className="text-sm text-neutral-700 dark:text-neutral-300 overflow-auto">
                          {JSON.stringify(tenant.settings, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                        <SettingsIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No custom settings configured</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TenantDetailModal;
