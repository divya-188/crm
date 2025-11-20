import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, FileText, TrendingUp as ComparePlans } from 'lucide-react';
import { subscriptionPlansService, SubscriptionPlan } from '@/services/subscription-plans.service';
import { subscriptionsService } from '@/services/subscriptions.service';
import { paymentConfigService } from '@/services/payment-config.service';
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
  const [paymentProvider, setPaymentProvider] = useState<string>('stripe');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [plansResponse, invoicesResponse, usageData, paymentConfig] = await Promise.all([
        subscriptionPlansService.getAll(),
        subscriptionsService.getInvoices().catch(() => []),
        subscriptionsService.getUsage().catch(() => null),
        paymentConfigService.getConfig().catch(() => ({ defaultProvider: 'stripe', paymentMode: 'sandbox', availableProviders: ['stripe'] })),
      ]);

      console.log('📊 Raw API Responses:', {
        plansResponse,
        invoicesResponse,
        usageData
      });

      // plansResponse is already extracted by the service
      const plans = Array.isArray(plansResponse) ? plansResponse : [];
      console.log('📋 Extracted plans:', plans);
      setPlans(plans.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sortOrder - b.sortOrder));

      // invoicesResponse contains {success: true, data: [...]}
      const invoicesData = invoicesResponse?.data || invoicesResponse || [];
      const invoices = Array.isArray(invoicesData) ? invoicesData : [];
      console.log('📄 Extracted invoices:', invoices);
      setInvoices(invoices);

      // usageData is already extracted by the service
      console.log('📈 Usage data:', usageData);
      setUsage(usageData);
      
      // Set payment provider from config
      setPaymentProvider(paymentConfig.defaultProvider);

      try {
        const subscriptionData = await subscriptionsService.getCurrentSubscription();
        console.log('💳 Current subscription:', subscriptionData);
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

  const handleSubscribe = async (planId: string) => {
    try {
      const response = await subscriptionsService.createSubscription({
        planId,
        paymentProvider: paymentProvider as any
      });

      const checkoutUrl = response.data?.checkoutUrl || response.data?.data?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.success('Subscription created successfully');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to subscribe to plan');
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
      console.log('🚀 [ADMIN UPGRADE] Starting upgrade process');
      console.log('🚀 [ADMIN UPGRADE] Subscription ID:', currentSubscription.id);
      console.log('🚀 [ADMIN UPGRADE] New Plan ID:', planId);
      console.log('🚀 [ADMIN UPGRADE] Payment Provider:', paymentProvider);
      
      const response = await subscriptionsService.upgradeSubscription(currentSubscription.id, {
        newPlanId: planId,
        paymentProvider: paymentProvider, // Use state instead of hardcoded 'stripe'
      });
      
      console.log('✅ [ADMIN UPGRADE] API Response:', JSON.stringify(response, null, 2));
      
      // Check multiple possible locations for checkoutUrl
      const checkoutUrl = 
        response.data?.data?.metadata?.checkoutUrl || 
        response.data?.data?.checkoutUrl || 
        response.data?.checkoutUrl;
      
      console.log('🔍 [ADMIN UPGRADE] Extracted checkout URL:', checkoutUrl);
      console.log('🔍 [ADMIN UPGRADE] Full response.data.data:', response.data?.data);
      
      if (checkoutUrl) {
        console.log('✅ [ADMIN UPGRADE] Redirecting to:', checkoutUrl);
        toast.success('Redirecting to payment page...');
        window.location.href = checkoutUrl;
      } else {
        console.log('⚠️ [ADMIN UPGRADE] No checkout URL found, showing success');
        toast.success('Plan upgraded successfully');
        loadData();
      }
    } catch (error: any) {
      console.error('❌ [ADMIN UPGRADE] Error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upgrade plan';
      toast.error(errorMessage);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"
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
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
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
            onSubscribe={handleSubscribe}       // ← MISSING FIX
            onUpgrade={handleUpgradePlan}
            onSwitch={handleSwitchPlan}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
