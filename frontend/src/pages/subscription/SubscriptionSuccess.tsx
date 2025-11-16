import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  CreditCard,
  Shield,
  Zap,
  Crown,
  Star,
  Gift
} from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from '@/lib/toast';
import { useAuthStore } from '@/lib/auth.store';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(15); // Increased from 6 to 15 seconds
  
  // Support multiple payment providers
  const sessionId = searchParams.get('session_id'); // Stripe
  const subscriptionId = searchParams.get('subscription_id'); // Razorpay subscription ID
  const dbSubscriptionId = searchParams.get('db_subscription_id'); // Database subscription ID (for upgrades)
  const razorpayPaymentId = searchParams.get('razorpay_payment_id'); // Razorpay redirect
  const razorpayPaymentLinkId = searchParams.get('razorpay_payment_link_id'); // Razorpay redirect
  const provider = searchParams.get('provider') || 'razorpay'; // Default to razorpay since that's what we're using
  const tenantId = searchParams.get('tenant_id');

  useEffect(() => {
    const activateSubscription = async () => {
      // Check if we have any payment identifier
      if (!sessionId && !subscriptionId && !razorpayPaymentId) {
        setLoading(false);
        toast.error('No payment information found. Please contact support.');
        console.error('Missing payment identifiers:', { sessionId, subscriptionId, razorpayPaymentId });
        return;
      }
      
      console.log('🎉 Payment Success Page Loaded');
      console.log('📋 URL Parameters:', {
        sessionId,
        subscriptionId,
        dbSubscriptionId,
        razorpayPaymentId,
        razorpayPaymentLinkId,
        provider,
        tenantId
      });

      try {
        // Get token from auth store
        const token = useAuthStore.getState().accessToken;
        
        if (!token) {
          console.warn('⚠️ No auth token found - user might need to login again');
          toast.warning('Please login again to complete activation');
          setLoading(false);
          return;
        }
        
        console.log('🔑 Token found:', token ? 'Yes' : 'No');
        
        // For Razorpay, payment is handled by webhook automatically
        // We just need to show success and let the webhook activate the subscription
        if ((provider === 'razorpay' || razorpayPaymentId) && (subscriptionId || dbSubscriptionId || razorpayPaymentLinkId)) {
          console.log('✅ Razorpay payment detected - activating subscription');
          
          // Use database subscription ID if available (for upgrades), otherwise use Razorpay subscription ID
          const activationSubId = dbSubscriptionId || subscriptionId;
          
          // Try to activate if we have subscription ID
          if (activationSubId) {
            try {
              console.log('🔄 Calling activation API...');
              console.log('📡 Activation Subscription ID:', activationSubId);
              console.log('📡 Is Upgrade (using DB ID):', !!dbSubscriptionId);
              console.log('📡 Payment ID:', razorpayPaymentId);
              
              // Use the API client base URL (already includes /api/v1)
              const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
              const response = await fetch(`${apiBaseUrl}/subscriptions/${activationSubId}/activate-razorpay`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  subscriptionId: activationSubId,
                  tenantId,
                  razorpayPaymentId,
                  razorpayPaymentLinkId,
                }),
              });

              console.log('📡 Response status:', response.status);
              const result = await response.json();
              console.log('📡 Response data:', result);
              
              if (result.success || response.ok) {
                console.log('✅ Subscription activated successfully');
                toast.success('🎉 Payment successful! Your subscription is now active.');
              } else {
                console.log('⚠️ Activation pending - webhook will handle it');
                toast.success('🎉 Payment successful! Your subscription will be activated shortly.');
              }
            } catch (error) {
              console.log('⚠️ Activation API failed - webhook will handle it:', error);
              toast.success('🎉 Payment successful! Your subscription will be activated shortly.');
            }
          } else {
            // No subscription ID, but payment was successful
            console.log('✅ Payment successful - webhook will activate subscription');
            toast.success('🎉 Payment successful! Your subscription will be activated shortly.');
          }
        } else if (sessionId) {
          // Stripe activation
          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
          const response = await fetch(`${apiBaseUrl}/subscriptions/activate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId }),
          });

          const result = await response.json();
          
          if (result.success) {
            toast.success('🎉 Payment successful! Your subscription is now active.');
          } else {
            toast.warning('Payment completed. Your subscription will be activated shortly.');
          }
        }
      } catch (error) {
        console.error('Failed to activate subscription:', error);
        // Don't show error - payment was successful, webhook will handle activation
        toast.success('🎉 Payment successful! Your subscription will be activated shortly.');
      } finally {
        setLoading(false);
      }
    };

    // Give a moment for the page to load, then activate
    const timer = setTimeout(() => {
      activateSubscription();
    }, 1000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/admin/plans');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [sessionId, subscriptionId, razorpayPaymentId, razorpayPaymentLinkId, provider, tenantId, navigate]);

  const handleContinue = () => {
    navigate('/admin/subscription-plans');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-400/30 to-purple-400/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, -80, 0],
              y: [0, 80, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-fuchsia-400/30 to-pink-400/30 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-12 max-w-lg w-full text-center relative z-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-8"
          >
            <div className="relative">
              <Loader2 className="w-20 h-20 text-violet-600" />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 w-20 h-20 border-4 border-violet-300 rounded-full"
              />
            </div>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-4"
          >
            Processing Payment
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 text-lg mb-8"
          >
            Confirming your subscription and activating premium features...
          </motion.p>

          {/* Progress bar */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full"
            />
          </div>

          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                y: [0, -100],
                x: Math.sin(i) * 50
              }}
              transition={{ 
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="absolute pointer-events-none"
              style={{
                left: `${20 + i * 10}%`,
                bottom: '20%'
              }}
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-400/30 to-purple-400/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -80, 0],
            y: [0, 80, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-fuchsia-400/30 to-pink-400/30 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-12 max-w-2xl w-full text-center relative z-10"
      >
        {/* Success Icon with Celebration Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: 0.2, 
            type: 'spring', 
            stiffness: 200,
            damping: 15
          }}
          className="relative mb-8"
        >
          <div className="relative inline-block">
            {/* Pulsing ring effect */}
            <motion.div
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.6, 0, 0.6]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 w-24 h-24 -left-2 -top-2 border-4 border-emerald-400 rounded-full"
            />
            
            {/* Main icon */}
            <div className="relative bg-gradient-to-br from-emerald-500 to-green-500 p-6 rounded-full shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>

            {/* Floating sparkles */}
            <motion.div
              animate={{ 
                y: [-10, -25, -10],
                rotate: [0, 180, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-3 -right-3"
            >
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </motion.div>
            <motion.div
              animate={{ 
                y: [-5, -20, -5],
                rotate: [360, 180, 0],
                scale: [1, 1.3, 1]
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              className="absolute -bottom-2 -left-3"
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
            </motion.div>
            <motion.div
              animate={{ 
                y: [-8, -18, -8],
                rotate: [0, 360, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2.8, repeat: Infinity, delay: 0.3 }}
              className="absolute top-0 -right-8"
            >
              <Gift className="w-5 h-5 text-pink-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title with Gradient */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-6"
        >
          Welcome to Premium!
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg mx-auto"
        >
          Your payment was successful and your account has been upgraded. 
          You now have access to all premium features and increased limits.
        </motion.p>

        {/* Feature highlights with icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 gap-4 mb-10"
        >
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200 shadow-sm cursor-default"
          >
            <Shield className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-blue-900">Secure Payment</p>
            <p className="text-xs text-blue-700 mt-1">256-bit encryption</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl border border-purple-200 shadow-sm cursor-default"
          >
            <Zap className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-purple-900">Instant Access</p>
            <p className="text-xs text-purple-700 mt-1">Active immediately</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-2xl border border-emerald-200 shadow-sm cursor-default"
          >
            <Crown className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-emerald-900">Premium Features</p>
            <p className="text-xs text-emerald-700 mt-1">All unlocked</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-2xl border border-orange-200 shadow-sm cursor-default"
          >
            <CreditCard className="w-10 h-10 text-orange-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-orange-900">Billing Active</p>
            <p className="text-xs text-orange-700 mt-1">Auto-renewal set</p>
          </motion.div>
        </motion.div>

        {(sessionId || razorpayPaymentId) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-8 border border-gray-200"
          >
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Transaction Details
            </p>
            <p className="text-xs font-mono text-gray-600 break-all bg-white px-4 py-3 rounded-lg border border-gray-200">
              {sessionId || razorpayPaymentId}
            </p>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="space-y-4"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleContinue}
              variant="primary"
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <span className="flex items-center justify-center">
                Continue to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => navigate('/admin/plans')}
              variant="secondary"
              className="w-full h-12 text-base font-medium border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              View Subscription Details
            </Button>
          </motion.div>
        </motion.div>

        {/* Countdown with animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-8 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200"
        >
          <p className="text-sm text-gray-600 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mr-2"
            >
              <Loader2 className="w-4 h-4 text-violet-500" />
            </motion.div>
            Auto-redirecting to dashboard in{' '}
            <motion.span
              key={countdown}
              initial={{ scale: 1.5, color: '#8b5cf6' }}
              animate={{ scale: 1, color: '#6b7280' }}
              className="font-bold mx-1"
            >
              {countdown}
            </motion.span>
            {countdown === 1 ? 'second' : 'seconds'}
          </p>
        </motion.div>

        {/* Confetti particles */}
        <AnimatePresence>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0,
                x: 0,
                y: 0,
                scale: 0
              }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                y: [0, -150, -300],
                x: [(i - 6) * 20, (i - 6) * 40, (i - 6) * 60],
                scale: [0, 1, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 3,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '30%'
              }}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{
                  background: ['#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6'][i % 5]
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
