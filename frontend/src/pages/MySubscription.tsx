import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  FileText, 
  TrendingUp, 
  Download, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { subscriptionsService } from '@/services/subscriptions.service';
import { subscriptionPlansService } from '@/services/subscription-plans.service';
import toast from '@/lib/toast';
import CurrentPlanTab from '@/components/subscription/CurrentPlanTab';
import InvoicesTab from '@/components/subscription/InvoicesTab';
import ComparePlansTab from '@/components/subscription/ComparePlansTab';

type TabType = 'current' | 'invoices' | 'plans';

export default function MySubscription() {
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subData, invoicesData, plansData, usageData] = await Promise.all([
        subscriptionsService.getCurrentSubscription(),
        subscriptionsService.getInvoices(),
        subscriptionPlansService.getPlans(),
        subscriptionsService.getUsage(),
      ]);
      
      setCurrentSubscription(subData);
      setInvoices(invoicesData);
      setPlans(plansData.filter((p: any) => p.id !== subData?.plan?.id));
      setUsage(usageData);
    } catch (error: any) {
      if (error.message !== 'No active subscription found') {
        toast.error('Failed to load subscription data');
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'current' as TabType, label: 'Current Plan', icon: CreditCard },
    { id: 'invoices' as TabType, label: 'Invoices & Transactions', icon: FileText },
    { id: 'plans' as TabType, label: 'Compare Plans', icon: TrendingUp },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      await subscriptionsService.downloadInvoice(invoiceId);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      const result = await subscriptionsService.upgradePlan(currentSubscription.id, planId);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.success('Plan upgraded successfully');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to upgrade plan');
    }
  };

  const handleSwitch = async (planId: string) => {
    try {
      await subscriptionsService.downgradePlan(currentSubscription.id, planId);
      toast.success('Plan will be switched at the end of billing period');
      loadData();
    } catch (error) {
      toast.error('Failed to switch plan');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Subscription</h1>
          <p className="text-gray-600">Manage your subscription, view invoices, and compare plans</p>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6">
          <div className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'current' && (
            <CurrentPlanTab
              subscription={currentSubscription}
              usage={usage}
              loading={loading}
            />
          )}
          {activeTab === 'invoices' && (
            <InvoicesTab
              invoices={invoices}
              loading={loading}
              onDownload={handleDownloadInvoice}
            />
          )}
          {activeTab === 'plans' && (
            <ComparePlansTab
              plans={plans}
              currentPlan={currentSubscription?.plan}
              loading={loading}
              onUpgrade={handleUpgrade}
              onSwitch={handleSwitch}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

