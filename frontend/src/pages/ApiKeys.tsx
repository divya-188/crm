import { useState, useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Key,
  Activity,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
  Book,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Search,
  Grid3x3,
  List,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiKeysService } from '@/services/api-keys.service';
import { ApiKey, ApiKeyWithPlainKey } from '@/types/models.types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import toast from '@/lib/toast';
import {
  ApiKeyInlineForm,
  ApiKeyDisplayModal,
  ApiKeyDeleteModal,
  ApiKeyUsageModal,
  ApiDocsModal,
} from '@/components/api-keys';

type ViewMode = 'grid' | 'list';

export default function ApiKeys() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);

  
  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<{ message: string; apiKey: ApiKeyWithPlainKey } | null>(null);
  
  // Dropdown state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Refs
  const formRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch API keys with infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['api-keys', searchQuery, statusFilter],
    queryFn: ({ pageParam = 1 }) =>
      apiKeysService.getApiKeys({
        page: pageParam,
        limit: 20,
        search: searchQuery,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    getNextPageParam: (lastPage) => {
      // Use hasMore flag from backend for more accurate pagination
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten pages into single array
  const apiKeys = data?.pages.flatMap((page) => page.data) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  // Toggle API key status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiKeysService.updateApiKey(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key status updated');
    },
    onError: () => {
      toast.error('Failed to update API key status');
    },
  });

  // Intersection observer for infinite scroll
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

  // Scroll to form when it opens
  useEffect(() => {
    if ((showCreateForm || showEditForm) && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showCreateForm, showEditForm]);


  // Calculate stats
  const stats = {
    total: totalCount,
    active: apiKeys.filter((k) => k.isActive && (!k.expiresAt || new Date(k.expiresAt) > new Date())).length,
    inactive: apiKeys.filter((k) => !k.isActive).length,
    expired: apiKeys.filter((k) => k.expiresAt && new Date(k.expiresAt) < new Date()).length,
  };

  // Handlers
  const handleCreate = () => {
    setSelectedApiKey(null);
    setShowEditForm(false);
    setShowCreateForm(true);
  };

  const handleEdit = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setShowCreateForm(false);
    setShowEditForm(true);
    setOpenMenuId(null);
  };

  const handleDelete = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleViewUsage = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setIsUsageModalOpen(true);
    setOpenMenuId(null);
  };

  const handleToggleStatus = (apiKey: ApiKey) => {
    toggleStatusMutation.mutate({
      id: apiKey.id,
      isActive: !apiKey.isActive,
    });
    setOpenMenuId(null);
  };

  const handleCopyPrefix = async (apiKey: ApiKey) => {
    try {
      await navigator.clipboard.writeText(apiKey.keyPrefix);
      setCopiedKeyId(apiKey.id);
      toast.success('Key prefix copied');
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy key prefix');
    }
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedApiKey(null);
    
    // Check if a new API key was created
    const createdKey = queryClient.getQueryData<{ message: string; apiKey: ApiKeyWithPlainKey }>(['new-api-key']);
    if (createdKey) {
      setNewApiKey(createdKey);
      setIsDisplayModalOpen(true);
      queryClient.removeQueries({ queryKey: ['new-api-key'] });
    }
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedApiKey(null);
  };

  const getStatusBadge = (apiKey: ApiKey) => {
    if (!apiKey.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return <Badge variant="danger">Expired</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load API keys
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['api-keys'] })}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage API keys for programmatic access to your account
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsDocsModalOpen(true)}>
            <Book className="w-4 h-4 mr-2" />
            API Docs
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Keys',
            value: stats.total,
            icon: Key,
            color: 'from-blue-500 to-blue-600',
            delay: 0,
          },
          {
            title: 'Active',
            value: stats.active,
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
            delay: 0.1,
          },
          {
            title: 'Inactive',
            value: stats.inactive,
            icon: XCircle,
            color: 'from-gray-500 to-gray-600',
            delay: 0.2,
          },
          {
            title: 'Expired',
            value: stats.expired,
            icon: Clock,
            color: 'from-red-500 to-red-600',
            delay: 0.3,
          },
        ].map((stat) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: stat.delay }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>


      {/* Info Banner */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3 p-4">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Secure Your API Keys
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              API keys provide full access to your account. Keep them secure and never share them publicly.
              Rotate keys regularly and revoke any that may have been compromised.
            </p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search API keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'expired', label: 'Expired' },
              ]}
              className="w-full sm:w-48"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Inline Form */}
      <AnimatePresence>
        {(showCreateForm || showEditForm) && (
          <div ref={formRef}>
            <ApiKeyInlineForm
              mode={showEditForm ? 'edit' : 'create'}
              apiKey={selectedApiKey}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}
      </AnimatePresence>


      {/* API Keys List */}
      {apiKeys.length === 0 && !isLoading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-12">
            <div className="text-center">
              <Key className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                No API keys found
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first API key'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <div className="mt-6 flex gap-3 justify-center">
                  <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create API Key
                  </Button>
                  <Button variant="secondary" onClick={() => setIsDocsModalOpen(true)}>
                    <Book className="w-4 h-4 mr-2" />
                    View Documentation
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      ) : (
        <>
          <div
            className={
              viewMode === 'grid'
                ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
                : 'space-y-4'
            }
          >
            {apiKeys.map((apiKey) => (
              <motion.div
                key={apiKey.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {viewMode === 'grid' ? (
                  <Card className="relative p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                    {/* Menu */}
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === apiKey.id ? null : apiKey.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {openMenuId === apiKey.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                            <button
                              onClick={() => handleEdit(apiKey)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleViewUsage(apiKey)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              View Usage
                            </button>
                            <button
                              onClick={() => handleToggleStatus(apiKey)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Activity className="w-4 h-4 mr-2" />
                              {apiKey.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDelete(apiKey)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Icon & Status */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                        <Key className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-8">
                          {apiKey.name}
                        </h3>
                        <div className="mt-1">{getStatusBadge(apiKey)}</div>
                      </div>
                    </div>

                    {/* Key Prefix */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Key Prefix:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-900 dark:text-white truncate">
                            {apiKey.keyPrefix}...
                          </code>
                          <button
                            onClick={() => handleCopyPrefix(apiKey)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                            title="Copy prefix"
                          >
                            {copiedKeyId === apiKey.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Rate Limit:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {apiKey.rateLimit} requests / {apiKey.rateLimitWindow}s
                        </p>
                      </div>

                      {apiKey.expiresAt && (
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Expires:</span>
                          <p className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(apiKey.expiresAt)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {apiKey.totalRequests.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total Requests</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(apiKey.lastUsedAt)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Last Used</div>
                      </div>
                    </div>

                    {apiKey.createdBy && (
                      <div className="pt-3 text-xs text-gray-500 dark:text-gray-400">
                        Created by {apiKey.createdBy.firstName} {apiKey.createdBy.lastName}
                      </div>
                    )}
                  </Card>
                ) : (
                  // List View
                  <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                            {apiKey.name}
                          </h3>
                          {getStatusBadge(apiKey)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                              {apiKey.keyPrefix}...
                            </code>
                          </span>
                          <span className="hidden sm:inline">
                            {apiKey.rateLimit} req/{apiKey.rateLimitWindow}s
                          </span>
                          <span className="hidden md:inline">
                            {apiKey.totalRequests.toLocaleString()} requests
                          </span>
                          {apiKey.expiresAt && (
                            <span className="hidden lg:inline flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires {formatDate(apiKey.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyPrefix(apiKey)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Copy prefix"
                        >
                          {copiedKeyId === apiKey.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === apiKey.id ? null : apiKey.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === apiKey.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                                <button
                                  onClick={() => handleEdit(apiKey)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleViewUsage(apiKey)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <BarChart3 className="w-4 h-4 mr-2" />
                                  View Usage
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(apiKey)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Activity className="w-4 h-4 mr-2" />
                                  {apiKey.isActive ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                  onClick={() => handleDelete(apiKey)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            ))}
          </div>

          {/* Infinite Scroll Indicator */}
          <div ref={observerTarget} className="flex justify-center py-8">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Spinner size="sm" />
                <span className="text-sm">Loading more API keys...</span>
              </div>
            ) : hasNextPage ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Scroll for more
              </div>
            ) : apiKeys.length > 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing all {apiKeys.length} of {totalCount} API keys
              </div>
            ) : null}
          </div>
        </>
      )}


      {/* Modals */}
      {isDeleteModalOpen && selectedApiKey && (
        <ApiKeyDeleteModal
          apiKey={selectedApiKey}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedApiKey(null);
          }}
        />
      )}

      {isUsageModalOpen && selectedApiKey && (
        <ApiKeyUsageModal
          apiKey={selectedApiKey}
          onClose={() => {
            setIsUsageModalOpen(false);
            setSelectedApiKey(null);
          }}
        />
      )}

      {isDocsModalOpen && (
        <ApiDocsModal
          onClose={() => setIsDocsModalOpen(false)}
        />
      )}

      {isDisplayModalOpen && newApiKey && (
        <ApiKeyDisplayModal
          apiKey={newApiKey.apiKey}
          onClose={() => {
            setIsDisplayModalOpen(false);
            setNewApiKey(null);
          }}
        />
      )}
    </div>
  );
}
