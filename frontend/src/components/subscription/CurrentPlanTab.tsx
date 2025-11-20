import { motion } from 'framer-motion';
import { 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  Users,
  MessageSquare,
  Workflow,
  Zap,
  Phone
} from 'lucide-react';
import Badge from '@/components/ui/Badge';

interface CurrentPlanTabProps {
  subscription: any;
  usage: any;
  loading: boolean;
}

export default function CurrentPlanTab({ subscription, usage, loading }: CurrentPlanTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-md p-10 text-center border border-gray-200"
      >
        <div className="text-gray-400 mb-4">
          <CreditCard className="w-14 h-14 mx-auto" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No Active Subscription</h3>
        <p className="text-sm text-gray-500 mb-6 font-normal">You don't have an active subscription yet</p>
        <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-primary-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
          Browse Plans
        </button>
      </motion.div>
    );
  }

  const features = [
    { icon: Users, label: 'Team Members', value: subscription?.plan?.features?.maxUsers || 0, used: usage?.usage?.users?.used || 0 },
    { icon: MessageSquare, label: 'Contacts', value: subscription?.plan?.features?.maxContacts || 0, used: usage?.usage?.contacts?.used || 0 },
    { icon: MessageSquare, label: 'Conversations', value: subscription?.plan?.features?.maxConversations || 0, used: usage?.usage?.conversations?.used || 0 },
    { icon: Zap, label: 'Campaigns', value: subscription?.plan?.features?.maxCampaigns || 0, used: usage?.usage?.campaigns?.used || 0 },
    { icon: Workflow, label: 'Automation Flows', value: subscription?.plan?.features?.maxFlows || 0, used: usage?.usage?.flows?.used || 0 },
    { icon: Zap, label: 'Automations', value: subscription?.plan?.features?.maxAutomations || 0, used: usage?.usage?.automations?.used || 0 },
    { icon: Phone, label: 'WhatsApp Connections', value: subscription?.plan?.features?.whatsappConnections || 0, used: usage?.usage?.whatsappConnections?.used || 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Plan Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="relative bg-gradient-to-br from-primary-50/50 via-white to-primary-50/30 rounded-2xl shadow-lg p-8 border border-primary-100/50 overflow-hidden group"
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 via-transparent to-primary-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        {/* Subtle Animated Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -right-24 w-64 h-64 bg-primary-300 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-300 rounded-full blur-3xl"
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-3"
              >
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">{subscription?.plan?.name || 'Unknown Plan'}</h2>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  <Badge className={`${
                    subscription?.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                    subscription?.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    subscription?.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  } text-xs font-medium border shadow-sm`}>
                    {subscription?.status ? String(subscription.status).charAt(0).toUpperCase() + String(subscription.status).slice(1) : 'Unknown'}
                  </Badge>
                </motion.div>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 text-sm font-normal"
              >
                {subscription?.plan?.description || 'No description available'}
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-right ml-6"
            >
              <div className="text-4xl font-bold bg-gradient-to-br from-violet-600 to-primary-600 bg-clip-text text-transparent tracking-tight">
                ${subscription?.plan?.price || '0'}
              </div>
              <div className="text-gray-500 text-sm font-normal mt-1">per {subscription?.plan?.billingCycle || 'month'}</div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-primary-100/50">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="group/date"
            >
              <div className="flex items-center gap-2 text-gray-500 mb-2 group-hover/date:text-primary-600 transition-colors">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Started</span>
              </div>
              <div className="text-gray-900 font-semibold text-base">
                {subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="group/date"
            >
              <div className="flex items-center gap-2 text-gray-500 mb-2 group-hover/date:text-primary-600 transition-colors">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Renews</span>
              </div>
              <div className="text-gray-900 font-semibold text-base">
                {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Features & Usage Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md"
      >
        <div className="bg-gray-50 px-8 py-5 border-b border-gray-200">
          <h3 className="text-xl font-medium text-gray-900 mb-1">Plan Features & Usage</h3>
          <p className="text-gray-500 text-sm font-normal">Track your resource usage and limits</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-white">
                  Feature
                </th>
                <th className="px-8 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                  Used
                </th>
                <th className="px-8 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                  Limit
                </th>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                  Usage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const percentage = feature.value !== -1 ? Math.round((feature.used / feature.value) * 100) : 0;
                const isNearLimit = percentage >= 80;
                
                return (
                  <motion.tr
                    key={feature.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.03 }}
                    className="hover:bg-gray-50/50 transition-colors group/row"
                  >
                    <td className="px-8 py-4 bg-white group-hover/row:bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-gray-400 group-hover/row:text-primary-600 transition-colors" />
                        <span className="font-normal text-gray-700 text-sm">{feature.label}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center bg-gray-50/30">
                      <span className="inline-block font-medium text-gray-700 text-sm">{feature.used}</span>
                    </td>
                    <td className="px-8 py-4 text-center bg-gray-50/30">
                      <span className="inline-block font-medium text-gray-700 text-sm">
                        {feature.value === -1 ? '∞' : feature.value}
                      </span>
                    </td>
                    <td className="px-8 py-4 bg-gray-50/30">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(percentage, 100)}%` }}
                            transition={{ duration: 0.5, delay: 0.3 + index * 0.03 }}
                            className={`h-full rounded-full ${
                              isNearLimit ? 'bg-red-500' : 'bg-gradient-to-r from-primary-500 to-primary-500'
                            }`}
                          />
                        </div>
                        <span className={`text-sm font-medium min-w-[40px] text-right ${isNearLimit ? 'text-red-600' : 'text-gray-500'}`}>
                          {feature.value === -1 ? '—' : `${percentage}%`}
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

      {/* Additional Features */}
      {(subscription?.plan?.features?.customBranding || subscription?.plan?.features?.prioritySupport || subscription?.plan?.features?.apiAccess) && (
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {subscription?.plan?.features?.customBranding && (
              <div className="flex items-center gap-2.5 p-3.5 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-normal text-gray-700 text-sm">Custom Branding</span>
              </div>
            )}
            {subscription?.plan?.features?.prioritySupport && (
              <div className="flex items-center gap-2.5 p-3.5 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-normal text-gray-700 text-sm">Priority Support</span>
              </div>
            )}
            {subscription?.plan?.features?.apiAccess && (
              <div className="flex items-center gap-2.5 p-3.5 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-normal text-gray-700 text-sm">API Access</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
