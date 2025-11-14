import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  Sparkles, 
  Crown,
  Users,
  Contact,
  MessageSquare,
  Megaphone,
  GitBranch,
  Bot,
  Smartphone,
  Palette,
  Headphones,
  Code,
  ArrowRight,
  Star
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface ComparePlansTabProps {
  plans: any[];
  currentPlan: any;
  loading: boolean;
  onUpgrade: (planId: string) => void;
  onSwitch: (planId: string) => void;
}

export default function ComparePlansTab({
  plans,
  currentPlan,
  loading,
  onUpgrade,
  onSwitch,
}: ComparePlansTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full"
        />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
      >
        <div className="text-gray-400 mb-4">
          <Sparkles className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Other Plans Available</h3>
        <p className="text-gray-600">You're already on the best plan, or there are no other plans to compare.</p>
      </motion.div>
    );
  }

  const isUpgrade = (plan: any) => {
    if (!currentPlan) return true;
    return parseFloat(plan.price) > parseFloat(currentPlan.price);
  };

  const isCurrentPlan = (plan: any) => {
    return currentPlan && plan.id === currentPlan.id;
  };

  const getFeatureValue = (feature: any, key: string) => {
    const value = feature[key];
    if (value === -1 || value === 'unlimited') return '∞';
    if (typeof value === 'boolean') return value;
    return value;
  };

  const featuresList = [
    { key: 'maxUsers', label: 'Team Members', Icon: Users },
    { key: 'maxContacts', label: 'Contacts', Icon: Contact },
    { key: 'maxConversations', label: 'Conversations', Icon: MessageSquare },
    { key: 'maxCampaigns', label: 'Campaigns', Icon: Megaphone },
    { key: 'maxFlows', label: 'Automation Flows', Icon: GitBranch },
    { key: 'maxAutomations', label: 'Automations', Icon: Bot },
    { key: 'whatsappConnections', label: 'WhatsApp Connections', Icon: Smartphone },
    { key: 'customBranding', label: 'Custom Branding', Icon: Palette },
    { key: 'prioritySupport', label: 'Priority Support', Icon: Headphones },
    { key: 'apiAccess', label: 'API Access', Icon: Code },
  ];

  // Sort plans by price
  const sortedPlans = [...plans].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

  return (
    <div className="relative min-h-screen">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-200/40 to-purple-200/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-200/40 to-pink-200/40 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-full mb-4 border border-violet-100"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Star className="w-3.5 h-3.5 text-violet-600" />
            </motion.div>
            <span className="text-xs font-medium text-violet-700">
              Simple, transparent pricing
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            className="text-3xl md:text-4xl font-medium text-gray-900 mb-3 tracking-tight"
          >
            Choose Your Perfect Plan
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base text-gray-500 max-w-2xl mx-auto font-normal"
          >
            Scale your business with flexible pricing that grows with you
          </motion.p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {sortedPlans.map((plan, index) => {
            const upgrade = isUpgrade(plan);
            const current = isCurrentPlan(plan);
            const isPopular = index === 1;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.15,
                  type: 'spring',
                  stiffness: 100,
                  damping: 15
                }}
                whileHover={{ 
                  y: -12,
                  transition: { duration: 0.3, type: 'spring', stiffness: 300 }
                }}
                className={`relative bg-white rounded-2xl overflow-hidden group ${
                  isPopular 
                    ? 'shadow-lg ring-2 ring-violet-500' 
                    : current
                    ? 'shadow-lg ring-2 ring-blue-500'
                    : 'shadow-md hover:shadow-lg border border-gray-200'
                }`}
              >
                {/* Shine Effect on Hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                  }}
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                />

                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
                    <motion.div
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                      className="bg-violet-600 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1.5"
                    >
                      <Crown className="w-3 h-3" />
                      <span className="text-xs font-medium">Most Popular</span>
                    </motion.div>
                  </div>
                )}

                {/* Current Badge */}
                {current && !isPopular && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
                    <motion.div
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                      className="bg-blue-600 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3" />
                      <span className="text-xs font-medium">Your Plan</span>
                    </motion.div>
                  </div>
                )}

                <div className="relative p-6 pt-10">
                  {/* Plan Name */}
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.15 + 0.2 }}
                    className="text-lg font-medium text-gray-900 mb-1"
                  >
                    {plan.name}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.15 + 0.3 }}
                    className="text-sm text-gray-500 mb-6 min-h-[40px] font-normal"
                  >
                    {plan.description}
                  </motion.p>

                  {/* Price */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.15 + 0.4, type: 'spring' }}
                    className="mb-6"
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-semibold text-gray-900 tracking-tight">
                        ${plan.price}
                      </span>
                      <span className="text-gray-500 text-sm font-normal">/{plan.billingCycle}</span>
                    </div>
                  </motion.div>

                  {/* CTA Button */}
                  {current ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 + 0.5 }}
                      className="w-full h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-normal text-sm mb-6"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      Current Plan
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 + 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative mb-6 group/button"
                    >
                      <Button
                        onClick={() => upgrade ? onUpgrade(plan.id) : onSwitch(plan.id)}
                        className={`relative w-full h-10 rounded-lg font-medium text-sm shadow-sm transition-all ${
                          isPopular
                            ? 'bg-violet-600 hover:bg-violet-700 text-white'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          {upgrade ? (
                            <>
                              Upgrade Now
                              <ArrowRight className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              Get Started
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </span>
                      </Button>
                    </motion.div>
                  )}

                  {/* Features */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                      What's included
                    </p>
                    {featuresList.map((feature, idx) => {
                      const value = getFeatureValue(plan.features, feature.key);
                      const isBoolean = typeof plan.features[feature.key] === 'boolean';
                      const hasFeature = isBoolean ? plan.features[feature.key] : value !== 0;
                      const FeatureIcon = feature.Icon;
                      
                      return (
                        <motion.div
                          key={feature.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.15 + 0.6 + idx * 0.03 }}
                          className="flex items-center justify-between group/feature"
                        >
                          <div className="flex items-center gap-2.5">
                            <FeatureIcon className="w-4 h-4 text-gray-400 group-hover/feature:text-violet-600 transition-colors" />
                            <span className="text-sm text-gray-600 font-normal">{feature.label}</span>
                          </div>
                          {isBoolean ? (
                            hasFeature ? (
                              <motion.div 
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                                className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center"
                              >
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                              </motion.div>
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                                <X className="w-2.5 h-2.5 text-gray-300" strokeWidth={2} />
                              </div>
                            )
                          ) : (
                            <span className="text-sm font-medium text-gray-700">
                              {value}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Money-back Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-normal text-green-700">
              30-day money-back guarantee • Cancel anytime
            </span>
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md"
        >
          <div className="bg-gray-50 px-8 py-5 border-b border-gray-200">
            <h3 className="text-xl font-medium text-gray-900 mb-1">Compare all features</h3>
            <p className="text-gray-500 text-sm font-normal">Everything you need to know about our plans</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-white sticky left-0 z-10">
                    Feature
                  </th>
                  {sortedPlans.map((plan, idx) => {
                    const isPopular = idx === 1;
                    const current = isCurrentPlan(plan);
                    
                    return (
                      <th
                        key={plan.id}
                        className={`px-8 py-4 text-center text-xs font-medium uppercase tracking-wide ${
                          isPopular ? 'bg-violet-50 text-violet-700' :
                          current ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-sm font-medium">{plan.name}</span>
                          {isPopular && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-600 text-white text-xs rounded-full">
                              <Crown className="w-2.5 h-2.5" />
                              Popular
                            </span>
                          )}
                          {current && !isPopular && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              <Check className="w-2.5 h-2.5" />
                              Current
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {featuresList.map((feature, index) => {
                  const FeatureIcon = feature.Icon;
                  
                  return (
                    <motion.tr
                      key={feature.key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 + index * 0.03 }}
                      className="hover:bg-gray-50/50 transition-colors group/row"
                    >
                      <td className="px-8 py-4 sticky left-0 bg-white group-hover/row:bg-gray-50/50 z-10">
                        <div className="flex items-center gap-3">
                          <FeatureIcon className="w-4 h-4 text-gray-400 group-hover/row:text-violet-600 transition-colors" />
                          <span className="font-normal text-gray-700 text-sm">{feature.label}</span>
                        </div>
                      </td>
                      {sortedPlans.map((plan, idx) => {
                        const value = getFeatureValue(plan.features, feature.key);
                        const isBoolean = typeof plan.features[feature.key] === 'boolean';
                        const hasFeature = isBoolean ? plan.features[feature.key] : value !== 0;
                        const isPopular = idx === 1;
                        const current = isCurrentPlan(plan);
                        
                        return (
                          <td 
                            key={plan.id} 
                            className={`px-8 py-4 text-center ${
                              isPopular ? 'bg-violet-50/30' :
                              current ? 'bg-blue-50/30' :
                              ''
                            }`}
                          >
                            {isBoolean ? (
                              hasFeature ? (
                                <motion.div 
                                  whileHover={{ scale: 1.1 }}
                                  transition={{ duration: 0.2 }}
                                  className="inline-flex w-5 h-5 rounded-full bg-violet-600 items-center justify-center"
                                >
                                  <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                                </motion.div>
                              ) : (
                                <div className="inline-flex w-5 h-5 rounded-full bg-gray-100 items-center justify-center">
                                  <X className="w-3 h-3 text-gray-300" strokeWidth={2} />
                                </div>
                              )
                            ) : (
                              <span className="inline-block font-medium text-gray-700 text-sm">
                                {value}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
