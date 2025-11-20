import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Edit,
  Trash2,
  Activity,
  Clock,
  CheckCircle,
  Copy,
  FileText,
  MoreVertical,
  AlertCircle,
  Grid3x3,
  List,
} from 'lucide-react';
import { automationsService, Automation } from '@/services/automations.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import toast from '@/lib/toast';
import AutomationInlineForm from '@/components/automations/AutomationInlineForm';
import ExecutionLogsModal from '@/components/automations/ExecutionLogsModal';

const statusConfig = {
  active: {
    label: 'Active',
    color: 'success',
    icon: CheckCircle,
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    textColor: 'text-success-700 dark:text-success-400',
    borderColor: 'border-success-200 dark:border-success-800',
    dotColor: 'bg-success-500',
  },
  inactive: {
    label: 'Inactive',
    color: 'secondary',
    icon: Pause,
    bgColor: 'bg-neutral-100 dark:bg-neutral-800',
    textColor: 'text-neutral-700 dark:text-neutral-400',
    borderColor: 'border-neutral-200 dark:border-neutral-700',
    dotColor: 'bg-neutral-500',
  },
  draft: {
    label: 'Draft',
    color: 'warning',
    icon: Clock,
    bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    textColor: 'text-warning-700 dark:text-warning-400',
    borderColor: 'border-warning-200 dark:border-warning-800',
    dotColor: 'bg-warning-500',
  },
};

const Automations: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    status: '',
    triggerType: '',
    search: '',
  });

  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [executionLogsAutomation, setExecutionLogsAutomation] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Refs for scroll functionality
  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch automations with infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['automations', filters],
    queryFn: ({ pageParam = 1 }) =>
      automationsService.getAutomations({
        page: pageParam,
        limit: 20,
        status: filters.status || undefined,
        search: filters.search || undefined,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.page || !lastPage.total || !lastPage.limit) return undefined;
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

  // Toggle automation status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      return currentStatus === 'active'
        ? automationsService.deactivateAutomation(id)
        : automationsService.activateAutomation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automation status updated');
    },
    onError: () => {
      toast.error('Failed to update automation status');
    },
  });

  // Delete automation mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => automationsService.deleteAutomation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automation deleted successfully');
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast.error('Failed to delete automation');
    },
  });

  // Duplicate automation mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => automationsService.duplicateAutomation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automation duplicated successfully');
    },
    onError: () => {
      toast.error('Failed to duplicate automation');
    },
  });

  const handleEdit = (automation: Automation) => {
    setSelectedAutomation(automation);
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

  const handleCreate = () => {
    const newState = !showCreateForm;
    setShowCreateForm(newState);
    setShowEditForm(false);
    setSelectedAutomation(null);

    // Scroll to create form with smooth animation
    if (newState) {
      setTimeout(() => {
        createFormRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  };

  const handleToggleStatus = (automation: Automation) => {
    toggleStatusMutation.mutate({
      id: automation.id,
      currentStatus: automation.status,
    });
    setOpenDropdown(null);
  };

  const handleDelete = (automation: Automation) => {
    setSelectedAutomation(automation);
    setDeleteConfirmId(automation.id);
    setOpenDropdown(null);
  };

  const handleDuplicate = (automation: Automation) => {
    duplicateMutation.mutate(automation.id);
    setOpenDropdown(null);
  };

  const handleViewLogs = (automation: Automation) => {
    setExecutionLogsAutomation({
      id: automation.id,
      name: automation.name,
    });
    setOpenDropdown(null);
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleTriggerTypeFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, triggerType: value }));
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      message_received: 'Message Received',
      conversation_created: 'Conversation Created',
      conversation_assigned: 'Conversation Assigned',
      tag_added: 'Tag Added',
      contact_created: 'Contact Created',
      contact_updated: 'Contact Updated',
      scheduled: 'Scheduled',
    };
    return labels[triggerType] || triggerType;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Flatten all pages data
  const allAutomations = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Calculate stats from all loaded automations
  const stats = {
    total: totalCount,
    active: allAutomations.filter((a) => a.status === 'active').length,
    inactive: allAutomations.filter((a) => a.status === 'inactive').length,
    draft: allAutomations.filter((a) => a.status === 'draft').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Automations
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Create automated workflows to respond to events instantly
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          {showCreateForm ? 'Cancel' : 'Create Automation'}
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
                  Total Automations
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
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
                <Pause className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
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
                  Draft
                </p>
                <p className="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                  {stats.draft}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
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
                placeholder="Search automations..."
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
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'draft', label: 'Draft' },
                ]}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={filters.triggerType}
                onChange={(e) => handleTriggerTypeFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Triggers' },
                  { value: 'message_received', label: 'Message Received' },
                  { value: 'conversation_created', label: 'Conversation Created' },
                  { value: 'conversation_assigned', label: 'Conversation Assigned' },
                  { value: 'tag_added', label: 'Tag Added' },
                  { value: 'contact_created', label: 'Contact Created' },
                  { value: 'contact_updated', label: 'Contact Updated' },
                  { value: 'scheduled', label: 'Scheduled' },
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
            <AutomationInlineForm
              mode="create"
              onCancel={() => setShowCreateForm(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['automations'] });
                setShowCreateForm(false);
              }}
            />
          </div>
        )}
        {showEditForm && selectedAutomation && (
          <div ref={editFormRef}>
            <AutomationInlineForm
              mode="edit"
              automation={selectedAutomation}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedAutomation(null);
              }}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['automations'] });
                setShowEditForm(false);
                setSelectedAutomation(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Automations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            Failed to load automations. Please try again.
          </p>
        </Card>
      ) : allAutomations.length > 0 ? (
        <>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            <AnimatePresence mode="popLayout">
              {allAutomations.map((automation, index) => {
                const statusInfo =
                  statusConfig[automation.status as keyof typeof statusConfig] ||
                  statusConfig.draft;
                const StatusIcon = statusInfo.icon;

                return viewMode === 'grid' ? (
                  // Grid View Card
                  <motion.div
                    key={automation.id}
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
                                <Zap className="w-7 h-7 text-white" />
                              </div>
                              <div
                                className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusInfo.dotColor} rounded-full border-2 border-white dark:border-neutral-900`}
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setOpenDropdown(
                                  openDropdown === automation.id ? null : automation.id
                                )
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>

                            <AnimatePresence>
                              {openDropdown === automation.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 z-10"
                                >
                                  <button
                                    onClick={() => handleEdit(automation)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(automation)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                  >
                                    {automation.status === 'active' ? (
                                      <>
                                        <Pause className="w-4 h-4" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-4 h-4" />
                                        Activate
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleViewLogs(automation)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                  >
                                    <FileText className="w-4 h-4" />
                                    View Logs
                                  </button>
                                  <button
                                    onClick={() => handleDuplicate(automation)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                  >
                                    <Copy className="w-4 h-4" />
                                    Duplicate
                                  </button>
                                  <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                                  <button
                                    onClick={() => handleDelete(automation)}
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
                            {automation.name}
                          </h3>
                          {automation.description && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2">
                              {automation.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between mb-4">
                            <Badge
                              variant={statusInfo.color as any}
                              className="flex items-center gap-1.5"
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </Badge>
                          </div>

                          {/* Trigger & Actions Info */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                              <Zap className="w-4 h-4" />
                              <span>{getTriggerLabel(automation.triggerType)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                              <Activity className="w-4 h-4" />
                              <span>{automation.actions.length} action(s)</span>
                            </div>
                            {automation.conditions && automation.conditions.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <Filter className="w-4 h-4" />
                                <span>{automation.conditions.length} condition(s)</span>
                              </div>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Activity className="w-3.5 h-3.5 text-neutral-500" />
                                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                  Executed
                                </span>
                              </div>
                              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                                {automation.executionCount}
                              </p>
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                  Success
                                </span>
                              </div>
                              <p className="text-lg font-bold text-success-600 dark:text-success-400">
                                {automation.successCount}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                          <div className="flex items-center justify-between text-xs text-neutral-500">
                            <span>Created {formatDate(automation.createdAt)}</span>
                            {automation.lastExecutedAt && (
                              <span>Last run {formatDate(automation.lastExecutedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ) : (
                  // List View Card
                  <motion.div
                    key={automation.id}
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
                              <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusInfo.dotColor} rounded-full border-2 border-white dark:border-neutral-900`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                                {automation.name}
                              </h3>
                              <Badge
                                variant={statusInfo.color as any}
                                className="flex items-center gap-1 flex-shrink-0"
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                              <span>{getTriggerLabel(automation.triggerType)}</span>
                              <span>•</span>
                              <span>{automation.actions.length} actions</span>
                              {automation.conditions && automation.conditions.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{automation.conditions.length} conditions</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Stats - Hidden on mobile */}
                          <div className="hidden lg:flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-neutral-400" />
                              <span className="text-neutral-600 dark:text-neutral-400">
                                {automation.executionCount} runs
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-success-500" />
                              <span className="text-success-600 dark:text-success-400">
                                {automation.successCount} success
                              </span>
                            </div>
                          </div>

                          <div className="hidden md:block text-sm text-neutral-500 flex-shrink-0">
                            {formatDate(automation.createdAt)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="relative flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setOpenDropdown(
                                openDropdown === automation.id ? null : automation.id
                              )
                            }
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>

                          <AnimatePresence>
                            {openDropdown === automation.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 z-10"
                              >
                                <button
                                  onClick={() => handleEdit(automation)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(automation)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                >
                                  {automation.status === 'active' ? (
                                    <>
                                      <Pause className="w-4 h-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4" />
                                      Activate
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleViewLogs(automation)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                >
                                  <FileText className="w-4 h-4" />
                                  View Logs
                                </button>
                                <button
                                  onClick={() => handleDuplicate(automation)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                  Duplicate
                                </button>
                                <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                                <button
                                  onClick={() => handleDelete(automation)}
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
                  Loading more automations...
                </p>
              </div>
            ) : hasNextPage ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Scroll down to load more
              </p>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing all {allAutomations.length} of {totalCount} automations
              </p>
            )}
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <Zap className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            No automations found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {filters.search || filters.status || filters.triggerType
              ? 'Try adjusting your filters'
              : 'Create your first automation to start automating your workflows'}
          </p>
          {!filters.search && !filters.status && !filters.triggerType && (
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Automation
            </Button>
          )}
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Modal isOpen={true} onClose={() => setDeleteConfirmId(null)} title="Delete Automation">
          <div className="space-y-4">
            <p className="text-neutral-600 dark:text-neutral-400">
              Are you sure you want to delete this automation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(selectedAutomation!)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Execution Logs Modal */}
      {executionLogsAutomation && (
        <ExecutionLogsModal
          automationId={executionLogsAutomation.id}
          automationName={executionLogsAutomation.name}
          onClose={() => setExecutionLogsAutomation(null)}
        />
      )}
    </div>
  );
};

export default Automations;
