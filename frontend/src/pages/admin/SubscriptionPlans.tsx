import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, FileText, TrendingUp as ComparePlans } from 'lucide-react';
import { subscriptionPlansService, SubscriptionPlan } from '@/services/subscription-plans.service';
import { subscriptionsService } from '@/services/subscriptions.service';
import toast from '@/lib/toast';
import CurrentPlanTab from '../../components/subscription/CurrentPlanTab';
import InvoicesTab from '../../components/subscription/InvoicesTab';
import ComparePlansTab from '../../components/subscription/ComparePlansTab';

interface CurrentSubscription {
  id: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  plan: SubscriptionPlan;
}

type TabType = 'current' | 'invoices' | 'plans';

export default function AdminSubscriptionPlans() {
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [plansResponse, invoicesResponse, usageResponse] = await Promise.all([
        subscriptionPlansService.getAll(),
        subscriptionsService.getInvoices().catch(() => ({ data: { data: [] } })),
        subscriptionsService.getUsage().catch(() => ({ data: null })),
      ]);
      
      console.log('📊 Raw API Responses:', {
        plansResponse,
        invoicesResponse,
        usageResponse
      });
      
      // plansResponse is already extracted by the service
      const plans = Array.isArray(plansResponse) ? plansResponse : [];
      console.log('📋 Extracted plans:', plans);
      setPlans(plans.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sortOrder - b.sortOrder));
      
      // Extract invoices - API returns { success: true, data: [...] }
      const invoicesData = invoicesResponse?.data?.data || invoicesResponse?.data || [];
      console.log('📄 Extracted invoices:', invoicesData);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      
      // Extract usage data
      const usageData = usageResponse?.data || null;
      setUsage(usageData);
      
      try {
        const subResponse = await subscriptionsService.getCurrentSubscription();
        console.log('💳 Current subscription response:', subResponse);
        // Extract subscription data from Axios response
        const subscriptionData = subResponse?.data || null;
        console.log('💳 Extracted subscription:', subscriptionData);
        setCurrentSubscription(subscriptionData as any);
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Error loading subscription:', error);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      await subscriptionsService.downloadInvoice(invoiceId);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    if (!currentSubscription) return;
    try {
      const response = await subscriptionsService.upgradeSubscription(currentSubscription.id, {
        newPlanId: planId,
        paymentProvider: 'stripe',
      });
      const checkoutUrl = response.data?.data?.checkoutUrl || response.data?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.success('Plan upgraded successfully');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to upgrade plan');
    }
  };

  const handleSwitchPlan = async (planId: string) => {
    if (!currentSubscription) return;
    try {
      await subscriptionsService.downgradeSubscription(currentSubscription.id, {
        newPlanId: planId,
      });
      toast.success('Plan will be switched at the end of billing period');
      loadData();
    } catch (error) {
      toast.error('Failed to switch plan');
    }
  };

  const tabs = [
    { id: 'current' as TabType, label: 'Current Plan', icon: CreditCard },
    { id: 'invoices' as TabType, label: 'Invoices & Transactions', icon: FileText },
    { id: 'plans' as TabType, label: 'Compare Plans', icon: ComparePlans },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"
        />
      </div>
    );
  }

  // Filter out current plan from comparison
  const plansForComparison = plans.filter(p => p.id !== currentSubscription?.plan?.id);
  
  console.log('🎯 Plans for comparison:', {
    allPlans: plans,
    currentPlanId: currentSubscription?.plan?.id,
    plansForComparison
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          My Subscription
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Manage your subscription, view invoices, and compare plans
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-2">
        <div className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
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
            loading={false}
          />
        )}
        {activeTab === 'invoices' && (
          <InvoicesTab
            invoices={invoices}
            loading={false}
            onDownload={handleDownloadInvoice}
          />
        )}
        {activeTab === 'plans' && (
          <ComparePlansTab
            plans={plansForComparison}
              currentPlan={currentSubscription?.plan}
              loading={false}
              onUpgrade={handleUpgradePlan}
              onSwitch={handleSwitchPlan}
            />
          )}
      </AnimatePresence>
    </div>
  );
}
