import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from '../../lib/toast';
import apiClient from '../../lib/api-client';
import Badge from '../ui/Badge';

interface Subscription {
  id: string;
  status: string;
  plan: {
    id: string;
    name: string;
    price: number;
    billingCycle: string;
    conversationsLimit: number;
    usersLimit: number;
    whatsappNumbersLimit: number;
  };
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface UsageStats {
  conversations: { used: number; limit: number; percentage: number };
  users: { used: number; limit: number; percentage: number };
  whatsappNumbers: { used: number; limit: number; percentage: number };
}

interface BillingInfo {
  companyName?: string;
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  billingEmail?: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  pdfUrl?: string;
}

export const BillingSubscriptionSettings: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, usageRes, billingRes, invoicesRes] = await Promise.all([
        apiClient.get('/tenants/current/settings/billing/subscription'),
        apiClient.get('/tenants/current/settings/billing/usage'),
        apiClient.get('/tenants/current/settings/billing/info'),
        apiClient.get('/tenants/current/settings/billing/history?limit=10'),
      ]);

      setSubscription(subRes.data);
      setUsage(usageRes.data);
      setBillingInfo(billingRes.data);
      setInvoices(invoicesRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBillingInfo = async () => {
    setSaving(true);
    try {
      await apiClient.put('/tenants/current/settings/billing/info', billingInfo);
      toast.success('Billing information saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save billing information');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of the current billing period.')) {
      return;
    }

    try {
      await apiClient.post('/tenants/current/settings/billing/cancel', {
        reason: 'User requested cancellation',
      });
      toast.success('Subscription cancelled successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
            <p className="text-sm text-gray-500">Manage your subscription</p>
          </div>
          {subscription?.cancelAtPeriodEnd && (
            <Badge variant="warning">Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</Badge>
          )}
        </div>

        {subscription && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{subscription.plan.name}</h4>
                <p className="text-sm text-gray-500">
                  ${subscription.plan.price}/{subscription.plan.billingCycle}
                </p>
              </div>
              <Badge variant={subscription.status === 'active' ? 'success' : 'neutral'}>
                {subscription.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current Period:</span>
                <p className="font-medium text-gray-900">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Next Billing Date:</span>
                <p className="font-medium text-gray-900">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => window.location.href = '/subscription/plans'}>
                Change Plan
              </Button>
              {!subscription.cancelAtPeriodEnd && (
                <Button variant="outline" onClick={handleCancelSubscription}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Usage Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Usage Statistics</h3>
            <p className="text-sm text-gray-500">Current billing period usage</p>
          </div>
        </div>

        {usage && (
          <div className="space-y-6">
            {/* Conversations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Conversations</span>
                <span className={`text-sm font-semibold ${getUsageColor(usage.conversations.percentage)}`}>
                  {usage.conversations.used} / {usage.conversations.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getUsageBgColor(usage.conversations.percentage)}`}
                  style={{ width: `${Math.min(usage.conversations.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Users */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Users</span>
                <span className={`text-sm font-semibold ${getUsageColor(usage.users.percentage)}`}>
                  {usage.users.used} / {usage.users.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getUsageBgColor(usage.users.percentage)}`}
                  style={{ width: `${Math.min(usage.users.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* WhatsApp Numbers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">WhatsApp Numbers</span>
                <span className={`text-sm font-semibold ${getUsageColor(usage.whatsappNumbers.percentage)}`}>
                  {usage.whatsappNumbers.used} / {usage.whatsappNumbers.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getUsageBgColor(usage.whatsappNumbers.percentage)}`}
                  style={{ width: `${Math.min(usage.whatsappNumbers.percentage, 100)}%` }}
                />
              </div>
            </div>

            {(usage.conversations.percentage >= 90 || usage.users.percentage >= 90 || usage.whatsappNumbers.percentage >= 90) && (
              <div className="flex items-start space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Approaching Limit</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    You're approaching your plan limits. Consider upgrading to avoid service interruption.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Billing Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Billing Information</h3>
            <p className="text-sm text-gray-500">Update your billing details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <Input
                value={billingInfo.companyName ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBillingInfo({ ...billingInfo, companyName: e.target.value })
                }
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / VAT Number
              </label>
              <Input
                value={billingInfo.taxId ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBillingInfo({ ...billingInfo, taxId: e.target.value })
                }
                placeholder="Enter tax ID"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Billing Email
            </label>
            <Input
              type="email"
              value={billingInfo.billingEmail ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBillingInfo({ ...billingInfo, billingEmail: e.target.value })
              }
              placeholder="billing@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <Input
              value={billingInfo.address?.street ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBillingInfo({
                  ...billingInfo,
                  address: { ...billingInfo.address, street: e.target.value },
                })
              }
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <Input
                value={billingInfo.address?.city ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBillingInfo({
                    ...billingInfo,
                    address: { ...billingInfo.address, city: e.target.value },
                  })
                }
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State / Province
              </label>
              <Input
                value={billingInfo.address?.state ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBillingInfo({
                    ...billingInfo,
                    address: { ...billingInfo.address, state: e.target.value },
                  })
                }
                placeholder="State"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code
              </label>
              <Input
                value={billingInfo.address?.postalCode ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBillingInfo({
                    ...billingInfo,
                    address: { ...billingInfo.address, postalCode: e.target.value },
                  })
                }
                placeholder="12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <Input
                value={billingInfo.address?.country ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBillingInfo({
                    ...billingInfo,
                    address: { ...billingInfo.address, country: e.target.value },
                  })
                }
                placeholder="Country"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveBillingInfo} disabled={saving}>
              {saving ? 'Saving...' : 'Save Billing Information'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Billing History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
            <p className="text-sm text-gray-500">View past invoices and payments</p>
          </div>
        </div>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(invoice.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.status === 'paid' ? (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Paid
                        </Badge>
                      ) : invoice.status === 'failed' ? (
                        <Badge variant="danger">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 inline-flex items-center"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No billing history available</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BillingSubscriptionSettings;
