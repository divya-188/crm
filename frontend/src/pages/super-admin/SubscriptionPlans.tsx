import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  MessageSquare,
  Send,
  Workflow,
  Bot,
  Smartphone,
  Zap,
  TrendingUp,
  Grid3x3,
  List,
  AlertCircle,
  BarChart3,
  X,
  Check,
  Star,
} from 'lucide-react';
import {
  subscriptionPlansService,
  SubscriptionPlan,
} from '../../services/subscription-plans.service';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Toast from '@/lib/toast-system';
import {
  PlanDeleteModal,
  PlanInlineForm,
} from '../../components/subscription-plans';
import { useAuthStore } from '../../lib/auth.store';

const SubscriptionPlans: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    billingCycle: '',
  });

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Refs for scroll functionality
  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch plans with infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['subscription-plans', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const allPlans = await subscriptionPlansService.getAll(true);
      
      // Apply filters
      let filtered = allPlans;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.description?.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.status) {
        filtered = filtered.filter((p) => 
          filters.status === 'active' ? p.isActive : !p.isActive
        );
      }
      
      if (filters.billingCycle) {
        filtered = filtered.filter((p) => p.billingCycle === filters.billingCycle);
      }
      
      // Paginate
      const limit = 20;
      const start = (pageParam - 1) * limit;
      const end = start + limit;
      const paginatedData = filtered.slice(start, end);
      
      return {
        data: paginatedData,
        page: pageParam,
        limit,
        total: filtered.length,
      };
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage <= Math.ceil(lastPage.total / lastPage.limit) ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Delete plan mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionPlansService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      Toast.success('Plan deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to delete plan');
    },
  });

  // Toggle plan active status
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      subscriptionPlansService.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      Toast.success('Plan status updated successfully');
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to update plan status');
    },
  });

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowEditForm(true);
    setShowCreateForm(false);
    setOpenDropdown(null);
    
    // Scroll to edit form with smooth animation
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
    setOpenDropdown(null);
  };

  const handleToggleActive = (plan: SubscriptionPlan) => {
    toggleActiveMutation.mutate({ id: plan.id, isActive: !plan.isActive });
    setOpenDropdown(null);
  };

  const formatPrice = (price: number | string, cycle: string) => {
    const cycleLabel = cycle === 'monthly' ? '/mo' : cycle === 'quarterly' ? '/qtr' : '/yr';
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return `$${priceNum.toFixed(2)}${cycleLabel}`;
  };

  const getFeatureIcon = (key: string) => {
    const icons: Record<string, any> = {
      maxContacts: Users,
      maxUsers: Users,
      maxConversations: MessageSquare,
      maxCampaigns: Send,
      maxFlows: Workflow,
      maxAutomations: Bot,
      whatsappConnections: Smartphone,
    };
    return icons[key] || Zap;
  };

  // Flatten all pages data
  const allPlans = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Calculate stats from all loaded plans
  const stats = {
    total: totalCount,
    active: allPlans.filter(p => p.isActive).length,
    inactive: allPlans.filter(p => !p.isActive).length,
    monthly: allPlans.filter(p => p.billingCycle === 'monthly').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Subscription Plans
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage subscription plans and pricing tiers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              const newState = !showComparison;
              console.log('=== INLINE COMPARISON DEBUG ===');
              console.log('Compare Plans button clicked');
              console.log('New comparison state:', newState);
              console.log('All plans data:', allPlans);
              console.log('Number of plans:', allPlans.length);
              console.log('Plans details:', allPlans.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                features: p.features,
                isActive: p.isActive,
                billingCycle: p.billingCycle
              })));
              setShowComparison(newState);
            }}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {showComparison ? 'Hide' : 'Compare'} Plans
          </Button>
          {isSuperAdmin && (
            <Button 
              onClick={() => {
                const newState = !showCreateForm;
                setShowCreateForm(newState);
                setShowEditForm(false);
                setSelectedPlan(null);
                
                // Scroll to create form with smooth animation
                if (newState) {
                  setTimeout(() => {
                    createFormRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }, 100);
                }
              }} 
              className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              {showCreateForm ? 'Cancel' : 'Create Plan'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Total Plans
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Active
                </p>
                <p className="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">
                  {stats.active}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Inactive
                </p>
                <p className="text-3xl font-bold text-neutral-600 dark:text-neutral-400 mt-1">
                  {stats.inactive}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Monthly Plans
                </p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                  {stats.monthly}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Inline Plan Comparison */}
      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Plan Comparison</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Compare features across all subscription plans
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('=== INLINE COMPARISON DEBUG ===');
                    console.log('Closing comparison view');
                    setShowComparison(false);
                  }}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <PlanComparisonTable plans={allPlans} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and View Toggle */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by name or description..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={filters.billingCycle}
                onChange={(e) => setFilters((prev) => ({ ...prev, billingCycle: e.target.value }))}
                options={[
                  { value: '', label: 'All Cycles' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'annual', label: 'Annual' },
                ]}
              />
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-700 shadow-sm'
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-700 shadow-sm'
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Inline Create/Edit Form */}
      <AnimatePresence>
        {showCreateForm && (
          <div ref={createFormRef}>
            <PlanInlineForm
              mode="create"
              onCancel={() => setShowCreateForm(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
                setShowCreateForm(false);
              }}
            />
          </div>
        )}
        {showEditForm && selectedPlan && (
          <div ref={editFormRef}>
            <PlanInlineForm
              mode="edit"
              plan={selectedPlan}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedPlan(null);
              }}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
                setShowEditForm(false);
                setSelectedPlan(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Plans List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            Failed to load plans. Please try again.
          </p>
        </Card>
      ) : allPlans.length > 0 ? (
        <>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
            <AnimatePresence mode="popLayout">
              {allPlans.map((plan, index) => {
                const Icon = CreditCard;
                
                return viewMode === 'grid' ? (
                  // Grid View Card
                  <motion.div
                    key={plan.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="group"
                  >
                    <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800">
                      <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
                                <Icon className="w-7 h-7 text-white" />
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${plan.isActive ? 'bg-success-500' : 'bg-neutral-500'} rounded-full border-2 border-white dark:border-neutral-900`} />
                            </div>
                          </div>
                          
                          {/* Actions - Only for Super Admin */}
                          {isSuperAdmin && (
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setOpenDropdown(openDropdown === plan.id ? null : plan.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>

                              <AnimatePresence>
                                {openDropdown === plan.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 z-10"
                                  >
                                    <button
                                      onClick={() => handleEdit(plan)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit Plan
                                    </button>
                                    <button
                                      onClick={() => handleToggleActive(plan)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                    >
                                      {plan.isActive ? (
                                        <>
                                          <XCircle className="w-4 h-4" />
                                          Deactivate
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="w-4 h-4" />
                                          Activate
                                        </>
                                      )}
                                    </button>
                                    <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                                    <button
                                      onClick={() => handleDelete(plan)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-danger-600 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1 truncate">
                            {plan.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant={plan.isActive ? 'success' : 'neutral'} size="sm">
                              {plan.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="neutral" size="sm">
                              {plan.billingCycle}
                            </Badge>
                          </div>

                          {plan.description && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                              {plan.description}
                            </p>
                          )}

                          {/* Price */}
                          <div className="mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                            <div className="text-3xl font-bold text-neutral-900 dark:text-white">
                              {formatPrice(plan.price, plan.billingCycle)}
                            </div>
                          </div>

                          {/* Features */}
                          <div className="space-y-2">
                            {Object.entries(plan.features).map(([key, value]) => {
                              if (typeof value === 'boolean') {
                                if (!value) return null;
                                return (
                                  <div key={key} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400 flex-shrink-0" />
                                    <span className="text-neutral-700 dark:text-neutral-300">
                                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                    </span>
                                  </div>
                                );
                              }
                              const FeatureIcon = getFeatureIcon(key);
                              return (
                                <div key={key} className="flex items-center gap-2 text-sm">
                                  <FeatureIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
                                  <span className="text-neutral-700 dark:text-neutral-300">
                                    {typeof value === 'number' ? value.toLocaleString() : value}{' '}
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ) : (
                  // List View Card
                  <motion.div
                    key={plan.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="p-5 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${plan.isActive ? 'bg-success-500' : 'bg-neutral-500'} rounded-full border-2 border-white dark:border-neutral-900`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                                {plan.name}
                              </h3>
                              <Badge variant={plan.isActive ? 'success' : 'neutral'} className="flex-shrink-0">
                                {plan.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="neutral" size="sm" className="flex-shrink-0">
                                {plan.billingCycle}
                              </Badge>
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                              {plan.description || 'No description'}
                            </p>
                          </div>

                          {/* Price - Hidden on mobile */}
                          <div className="hidden lg:block text-right flex-shrink-0">
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                              {formatPrice(plan.price, plan.billingCycle)}
                            </div>
                          </div>

                          {/* Key Features - Hidden on mobile */}
                          <div className="hidden xl:flex items-center gap-4 text-sm flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-neutral-400" />
                              <span className="text-neutral-600 dark:text-neutral-400">
                                {plan.features.maxUsers} users
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-neutral-400" />
                              <span className="text-neutral-600 dark:text-neutral-400">
                                {plan.features.maxContacts} contacts
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions - Only for Super Admin */}
                        {isSuperAdmin && (
                          <div className="relative flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setOpenDropdown(openDropdown === plan.id ? null : plan.id)}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>

                            <AnimatePresence>
                              {openDropdown === plan.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 z-10"
                                >
                                  <button
                                    onClick={() => handleEdit(plan)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit Plan
                                  </button>
                                  <button
                                    onClick={() => handleToggleActive(plan)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                  >
                                    {plan.isActive ? (
                                      <>
                                      <XCircle className="w-4 h-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      Activate
                                    </>
                                  )}
                                  </button>
                                  <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                                  <button
                                    onClick={() => handleDelete(plan)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-danger-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Infinite Scroll Indicator */}
          <div ref={observerTarget} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <Spinner size="sm" />
                <span className="text-sm">Loading more plans...</span>
              </div>
            )}
            {!hasNextPage && allPlans.length > 0 && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing all {allPlans.length} of {totalCount} plans
              </p>
            )}
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <CreditCard className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            No subscription plans found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {isSuperAdmin 
              ? 'Get started by creating your first subscription plan'
              : 'No subscription plans are currently available'}
          </p>
          {isSuperAdmin && (
            <Button 
              onClick={() => {
                setShowCreateForm(true);
                setShowEditForm(false);
                setSelectedPlan(null);
                setTimeout(() => {
                  createFormRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }, 100);
              }} 
              className="mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          )}
        </Card>
      )}

      {/* Modals */}
      <PlanDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPlan(null);
        }}
        onConfirm={() => deleteMutation.mutateAsync(selectedPlan!.id)}
        plan={selectedPlan}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// Inline Plan Comparison Table Component
const PlanComparisonTable: React.FC<{ plans: SubscriptionPlan[] }> = ({ plans }) => {
  console.log('=== PLAN COMPARISON TABLE DEBUG ===');
  console.log('PlanComparisonTable received plans:', plans);
  console.log('Number of plans received:', plans?.length || 0);
  
  const features = [
    { key: 'maxContacts', label: 'Max Contacts', type: 'number' },
    { key: 'maxUsers', label: 'Max Users', type: 'number' },
    { key: 'maxConversations', label: 'Max Conversations', type: 'number' },
    { key: 'maxCampaigns', label: 'Max Campaigns', type: 'number' },
    { key: 'maxFlows', label: 'Max Flows', type: 'number' },
    { key: 'maxAutomations', label: 'Max Automations', type: 'number' },
    { key: 'whatsappConnections', label: 'WhatsApp Connections', type: 'number' },
    { key: 'customBranding', label: 'Custom Branding', type: 'boolean' },
    { key: 'prioritySupport', label: 'Priority Support', type: 'boolean' },
    { key: 'apiAccess', label: 'API Access', type: 'boolean' },
  ];
  
  console.log('Features to display:', features);

  const formatFeatureValue = (value: any, type: string) => {
    console.log('Formatting feature value:', { value, type, valueType: typeof value });
    
    if (type === 'boolean') {
      return value ? (
        <Check className="h-4 w-4 text-success-500 mx-auto" />
      ) : (
        <X className="h-4 w-4 text-neutral-300 mx-auto" />
      );
    }
    if (type === 'number') {
      if (value === undefined || value === null) {
        console.log('Value is undefined/null, showing dash');
        return <span className="text-neutral-400">-</span>;
      }
      return value === -1 ? (
        <span className="text-primary-600 dark:text-primary-400 font-medium">Unlimited</span>
      ) : (
        <span className="font-medium">{value.toLocaleString()}</span>
      );
    }
    return value || '-';
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    if (plan.isPopular) {
      return (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-primary-500 to-primary-700 text-white px-3 py-1 text-xs font-medium flex items-center gap-1">
            <Star className="h-3 w-3" />
            Most Popular
          </Badge>
        </div>
      );
    }
    return null;
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500 dark:text-neutral-400">No plans available for comparison</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-700">
            <th className="text-left py-4 px-4 font-medium text-neutral-900 dark:text-white w-48">
              Features
            </th>
            {plans.map((plan, index) => (
              <motion.th
                key={plan.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center py-4 px-4 min-w-32 relative"
              >
                {getPlanBadge(plan)}
                <div className="space-y-2">
                  <div className="font-semibold text-neutral-900 dark:text-white">{plan.name}</div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ${plan.price}
                    <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
                      /{plan.billingCycle === 'monthly' ? 'mo' : plan.billingCycle === 'quarterly' ? 'qtr' : 'yr'}
                    </span>
                  </div>
                  <Badge 
                    variant={plan.isActive ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </motion.th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, featureIndex) => {
            console.log(`Processing feature row: ${feature.label} (${feature.key})`);
            return (
              <motion.tr
                key={feature.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: featureIndex * 0.05 }}
                className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <td className="py-4 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                  {feature.label}
                </td>
                {plans.map((plan, planIndex) => {
                  const featureValue = plan.features?.[feature.key];
                  console.log(`Plan: ${plan.name}, Feature: ${feature.key}, Value:`, featureValue, 'Features object:', plan.features);
                  return (
                    <motion.td
                      key={`${plan.id}-${feature.key}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (featureIndex * 0.05) + (planIndex * 0.02) }}
                      className="py-4 px-4 text-center"
                    >
                      {formatFeatureValue(featureValue, feature.type)}
                    </motion.td>
                  );
                })}
              </motion.tr>
            );
          })}
          
          {/* Pricing Summary Row */}
          <motion.tr
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: features.length * 0.05 }}
            className="bg-neutral-50 dark:bg-neutral-800/50 border-t-2 border-neutral-200 dark:border-neutral-700"
          >
            <td className="py-4 px-4 font-semibold text-neutral-900 dark:text-white">
              Monthly Cost
            </td>
            {plans.map((plan, index) => (
              <motion.td
                key={`${plan.id}-pricing`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (features.length * 0.05) + (index * 0.1) }}
                className="py-4 px-4 text-center"
              >
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ${plan.price}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    per {plan.billingCycle === 'monthly' ? 'month' : plan.billingCycle === 'quarterly' ? 'quarter' : 'year'}
                  </div>
                  {plan.isPopular && (
                    <div className="flex items-center justify-center text-xs text-primary-600 dark:text-primary-400">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Best Value
                    </div>
                  )}
                </div>
              </motion.td>
            ))}
          </motion.tr>
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionPlans;
