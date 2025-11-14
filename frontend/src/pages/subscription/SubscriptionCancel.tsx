import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  ArrowLeft, 
  RefreshCw, 
  MessageCircle,
  Shield,
  Clock,
  HelpCircle,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function SubscriptionCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-orange-400/20 to-amber-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 80, 0],
            y: [0, -80, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-12 max-w-2xl w-full text-center relative z-10"
      >
        {/* Icon with Animation */}
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
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 w-24 h-24 -left-2 -top-2 border-4 border-orange-400 rounded-full"
            />
            
            {/* Main icon */}
            <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 p-6 rounded-full shadow-lg">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>

            {/* Floating question marks */}
            <motion.div
              animate={{ 
                y: [-10, -20, -10],
                rotate: [0, 15, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <HelpCircle className="w-6 h-6 text-orange-400" />
            </motion.div>
            <motion.div
              animate={{ 
                y: [-5, -15, -5],
                rotate: [0, -15, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
              className="absolute -bottom-1 -left-2"
            >
              <Clock className="w-5 h-5 text-amber-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title with Gradient */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent mb-6"
        >
          Payment Cancelled
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg mx-auto"
        >
          Your payment was cancelled. No charges have been made to your account.
          Your data is safe and secure.
        </motion.p>

        {/* Info cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-green-50 to-emerald-100 p-5 rounded-2xl border border-green-200 shadow-sm cursor-default"
          >
            <Shield className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-green-900">No Charges</p>
            <p className="text-xs text-green-700 mt-1">Account unchanged</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200 shadow-sm cursor-default"
          >
            <CreditCard className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-blue-900">Secure Data</p>
            <p className="text-xs text-blue-700 mt-1">Information protected</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl border border-purple-200 shadow-sm cursor-default"
          >
            <CheckCircle2 className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-purple-900">Try Again</p>
            <p className="text-xs text-purple-700 mt-1">Anytime you want</p>
          </motion.div>
        </motion.div>

        {/* Help section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                If you experienced any issues during checkout or have questions about our plans, 
                our support team is here to help you.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Clock className="w-3 h-3 mr-1" />
                  24/7 Support
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Live Chat
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="space-y-4"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => navigate('/admin/plans')}
              variant="primary"
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <span className="flex items-center justify-center">
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again - View Plans
              </span>
            </Button>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => navigate('/admin/dashboard')}
                variant="secondary"
                className="w-full h-12 text-base font-medium border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => window.open('mailto:support@example.com', '_blank')}
                variant="secondary"
                className="w-full h-12 text-base font-medium border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Us
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Reassurance message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200"
        >
          <p className="text-sm text-gray-600 flex items-center justify-center">
            <Shield className="w-4 h-4 mr-2 text-green-600" />
            Your account and data remain secure. You can subscribe anytime.
          </p>
        </motion.div>

        {/* Floating particles */}
        <AnimatePresence>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0,
                x: 0,
                y: 0,
                scale: 0
              }}
              animate={{ 
                opacity: [0, 0.6, 0],
                y: [0, -100, -200],
                x: [(i - 3) * 30, (i - 3) * 50],
                scale: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 3,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '20%'
              }}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{
                  background: ['#f97316', '#fbbf24', '#fb923c'][i % 3]
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
