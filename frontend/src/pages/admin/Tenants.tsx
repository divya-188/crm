import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  MessageSquare,
  Phone,
  Grid3x3,
  List,
} from 'lucide-react';
import { tenantsService, Tenant } from '../../services/tenants.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import TenantInlineForm from '../../components/tenants/TenantInlineForm';
import TenantDetailModal from '../../components/tenants/TenantDetailModal';
import TenantDeleteModal from '../../components/tenants/TenantDeleteModal';

const statusConfig = {
  active: { 
    label: 'Active', 
    color: 'success', 
    icon: CheckCircle,
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    textColor: 'text-success-700 dark:text-success-400',
    borderColor: 'border-success-200 dark:border-success-800',
    dotColor: 'bg-success-500'
  },
  trial: { 
    label: 'Trial', 
    color: 'warning', 
    icon: Clock,
    bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    textColor: 'text-warning-700 dark:text-warning-400',
    borderColor: 'border-warning-200 dark:border-warning-800',
    dotColor: 'bg-warning-500'
  },
  suspended: { 
    label: 'Suspended', 
    color: 'danger', 
    icon: AlertCircle,
    bgColor: 'bg-danger-50 dark:bg-danger-900/20',
    textColor: 'text-danger-700 dark:text-danger-400',
    borderColor: 'border-danger-200 dark:border-danger-800',
    dotColor: 'bg-danger-500'
  },
  expired: { 
    label: 'Expired', 
    color: 'neutral', 
    icon: XCircle,
    bgColor: 'bg-neutral-100 dark:bg-neutral-800',
    textColor: 'text-neutral-700 dark:text-neutral-400',
    borderColor: 'border-neutral-200 dark:border-neutral-700',
    dotColor: 'bg-neutral-500'
  },
};

const Tenants: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Refs for scroll functionality
  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch tenants with infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['tenants', filters],
    queryFn: ({ pageParam = 1 }) =>
      tenantsService.getAll({
        page: pageParam,
        limit: 20,
        status: filters.status,
        search: filters.search,
      }),
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

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tenantsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update tenant status');
    },
  });

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleViewDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDetailModalOpen(true);
    setOpenDropdown(null);
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
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

  const handleDelete = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDeleteModalOpen(true);
    setOpenDropdown(null);
  };

  const handleStatusChange = (tenant: Tenant, newStatus: string) => {
    updateStatusMutation.mutate({ id: tenant.id, status: newStatus });
    setOpenDropdown(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Flatten all pages data
  const allTenants = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Calculate stats from all loaded tenants
  const stats = {
    total: totalCount,
    active: allTenants.filter(t => t.status === 'active').length,
    trial: allTenants.filter(t => t.status === 'trial').length,
    suspended: allTenants.filter(t => t.status === 'suspended').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Tenant Management
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage all tenant accounts and their configurations
          </p>
        </div>
        <Button 
          onClick={() => {
            const newState = !showCreateForm;
            setShowCreateForm(newState);
            setShowEditForm(false);
            setSelectedTenant(null);
            
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
          {showCreateForm ? 'Cancel' : 'Create Tenant'}
        </Button>
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
                  Total Tenants
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
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
                  Trial
                </p>
                <p className="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                  {stats.trial}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
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
                  Suspended
                </p>
                <p className="text-3xl font-bold text-danger-600 dark:text-danger-400 mt-1">
                  {stats.suspended}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-danger-100 dark:bg-danger-900/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filters and View Toggle */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by name or slug..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'trial', label: 'Trial' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'expired', label: 'Expired' },
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
            <TenantInlineForm
              mode="create"
              onCancel={() => setShowCreateForm(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['tenants'] });
                setShowCreateForm(false);
              }}
            />
          </div>
        )}
        {showEditForm && selectedTenant && (
          <div ref={editFormRef}>
            <TenantInlineForm
              mode="edit"
              tenant={selectedTenant}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedTenant(null);
              }}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['tenants'] });
                setShowEditForm(false);
                setSelectedTenant(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Tenants List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            Failed to load tenants. Please try again.
          </p>
        </Card>
      ) : allTenants.length > 0 ? (
        <>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
            <AnimatePresence mode="popLayout">
              {allTenants.map((tenant, index) => {
                const statusInfo = statusConfig[tenant.status as keyof typeof statusConfig] || statusConfig.expired;
                const StatusIcon = statusInfo.icon;
                
                return viewMode === 'grid' ? (
                  // Grid View Card
                  <motion.div
                    key={tenant.id}
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
                                <Building2 className="w-7 h-7 text-white" />
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusInfo.dotColor} rounded-full border-2 border-white dark:border-neutral-900`} />
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setOpenDropdown(openDropdown === tenant.id ? null : tenant.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>

                            <AnimatePresence>
                              {openDropdown === tenant.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 z-10"
                                >
                                  <button
                                    onClick={() => handleViewDetails(tenant)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => handleEdit(tenant)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                  </button>
                                  {tenant.status !== 'active' && (
                                    <button
                                      onClick={() => handleStatusChange(tenant, 'active')}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-success-600 transition-colors"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Activate
                                    </button>
                                  )}
                                  {tenant.status !== 'suspended' && (
                                    <button
                                      onClick={() => handleStatusChange(tenant, 'suspended')}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-warning-600 transition-colors"
                                    >
                                      <AlertCircle className="w-4 h-4" />
                                      Suspend
                                    </button>
                                  )}
                                  <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                                  <button
                                    onClick={() => handleDelete(tenant)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-danger-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1 truncate">
                            {tenant.name}
                          </h3>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3 truncate">
                            {tenant.slug}
                          </p>

                          <div className="flex items-center justify-between mb-4">
                            <Badge variant={statusInfo.color as any} className="flex items-center gap-1.5">
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </Badge>
                            {tenant.domain && (
                              <span className="text-xs text-neutral-500 truncate max-w-[150px]">
                                {tenant.domain}
                              </span>
                            )}
                          </div>

                          {/* Stats */}
                          {tenant.limits && (
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Users className="w-3.5 h-3.5 text-neutral-500" />
                                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Users</span>
                                </div>
                                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                                  {tenant.limits.maxUsers || 0}
                                </p>
                              </div>
                              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
                                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Messages</span>
                                </div>
                                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                                  {tenant.limits.maxMessages ? (tenant.limits.maxMessages / 1000).toFixed(0) + 'K' : 0}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                          <div className="flex items-center justify-between text-xs text-neutral-500">
                            <span>Created {formatDate(tenant.createdAt)}</span>
                            {tenant.trialEndsAt && tenant.status === 'trial' && (
                              <span className="text-warning-600">
                                Trial ends {formatDate(tenant.trialEndsAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ) : (
                  // List View Card
                  <motion.div
                    key={tenant.id}
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
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusInfo.dotColor} rounded-full border-2 border-white dark:border-neutral-900`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                                {tenant.name}
                              </h3>
                              <Badge variant={statusInfo.color as any} className="flex items-center gap-1 flex-shrink-0">
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                              {tenant.slug}
                            </p>
                          </div>

                          {/* Stats - Hidden on mobile */}
                          {tenant.limits && (
                            <div className="hidden lg:flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-neutral-400" />
                                <span className="text-neutral-600 dark:text-neutral-400">
                                  {tenant.limits.maxUsers} users
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-neutral-400" />
                                <span className="text-neutral-600 dark:text-neutral-400">
                                  {tenant.limits.maxWhatsAppConnections} connections
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="hidden md:block text-sm text-neutral-500 flex-shrink-0">
                            {formatDate(tenant.createdAt)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="relative flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpenDropdown(openDropdown === tenant.id ? null : tenant.id)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>

                          <AnimatePresence>
                            {openDropdown === tenant.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 z-10"
                              >
                                <button
                                  onClick={() => handleViewDetails(tenant)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleEdit(tenant)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                {tenant.status !== 'active' && (
                                  <button
                                    onClick={() => handleStatusChange(tenant, 'active')}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-success-600 transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Activate
                                  </button>
                                )}
                                {tenant.status !== 'suspended' && (
                                  <button
                                    onClick={() => handleStatusChange(tenant, 'suspended')}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-warning-600 transition-colors"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    Suspend
                                  </button>
                                )}
                                <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                                <button
                                  onClick={() => handleDelete(tenant)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-danger-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Infinite Scroll Trigger & Loading Indicator */}
          <div ref={observerTarget} className="flex items-center justify-center py-8">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-3">
                <Spinner size="md" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Loading more tenants...
                </p>
              </div>
            ) : hasNextPage ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Scroll down to load more
              </p>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing all {allTenants.length} of {totalCount} tenants
              </p>
            )}
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            No tenants found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            {filters.search || filters.status
              ? 'Try adjusting your filters'
              : 'Get started by creating your first tenant'}
          </p>
          {!filters.search && !filters.status && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Tenant
            </Button>
          )}
        </Card>
      )}

      {/* Modals */}
      {selectedTenant && (
        <>
          <TenantDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedTenant(null);
            }}
            tenant={selectedTenant}
          />

          <TenantDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedTenant(null);
            }}
            tenant={selectedTenant}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['tenants'] });
              setIsDeleteModalOpen(false);
              setSelectedTenant(null);
            }}
          />
        </>
      )}
    </div>
  );
};

export default Tenants;
