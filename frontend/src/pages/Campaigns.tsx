import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Send,
  Calendar,
  Users,
  TrendingUp,
  Play,
  Pause,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Grid3x3,
  List,
  MoreVertical,
  Edit,
  AlertCircle,
} from 'lucide-react';
import { campaignsService } from '@/services/campaigns.service';
import { Campaign, CampaignStatus } from '@/types/models.types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import toast from '@/lib/toast';
import { CampaignInlineForm } from '@/components/campaigns';

export default function Campaigns() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const observerTarget = useRef<HTMLDivElement>(null);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Fetch campaigns with infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['campaigns', statusFilter, searchQuery],
    queryFn: ({ pageParam = 1 }) =>
      campaignsService.getCampaigns({
        page: pageParam,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.page || !lastPage.limit || !lastPage.total) return undefined;
      const nextPage = lastPage.page + 1;
      return nextPage <= Math.ceil(lastPage.total / lastPage.limit) ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  // Infinite scroll observer
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

  // Mutations
  const startMutation = useMutation({
    mutationFn: (id: string) => campaignsService.startCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign started successfully');
    },
    onError: () => {
      toast.error('Failed to start campaign');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => campaignsService.pauseCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign paused');
    },
    onError: () => {
      toast.error('Failed to pause campaign');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignsService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
      setOpenDropdown(null);
    },
    onError: () => {
      toast.error('Failed to delete campaign');
    },
  });

  // Handlers
  const handleCreateClick = () => {
    setShowEditForm(false);
    setSelectedCampaign(null);
    setShowCreateForm(true);
    setTimeout(() => {
      document.getElementById('campaign-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleEditClick = (campaign: Campaign) => {
    setShowCreateForm(false);
    setSelectedCampaign(campaign);
    setShowEditForm(true);
    setOpenDropdown(null);
    setTimeout(() => {
      document.getElementById('campaign-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedCampaign(null);
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedCampaign(null);
  };

  const handleDeleteClick = (campaign: Campaign) => {
    if (window.confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      deleteMutation.mutate(campaign.id);
    }
  };

  // Utility functions
  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="primary">
            <Play className="w-3 h-3 mr-1" />
            Running
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="neutral">
            <Pause className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const calculateDeliveryRate = (campaign: Campaign) => {
    if (campaign.totalRecipients === 0) return 0;
    return ((campaign.deliveredCount / campaign.totalRecipients) * 100).toFixed(1);
  };

  // Flatten all pages
  const allCampaigns = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Calculate stats
  const stats = {
    total: totalCount,
    running: allCampaigns.filter((c) => c.status === 'running').length,
    scheduled: allCampaigns.filter((c) => c.status === 'scheduled').length,
    completed: allCampaigns.filter((c) => c.status === 'completed').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Campaigns</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Create and manage your WhatsApp broadcast campaigns
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          icon={<Plus className="w-4 h-4" />}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
        >
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Campaigns</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Running</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                  {stats.running}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-success-700 flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Scheduled</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                  {stats.scheduled}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Completed</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                  {stats.completed}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-500 to-neutral-700 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filters and View Toggle */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'running', label: 'Running' },
              { value: 'paused', label: 'Paused' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              aria-label="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Inline Form */}
      <AnimatePresence>
        {(showCreateForm || showEditForm) && (
          <div id="campaign-form">
            <CampaignInlineForm
              mode={showEditForm ? 'edit' : 'create'}
              campaign={selectedCampaign}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-danger-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Error loading campaigns
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['campaigns'] })}>
            Try Again
          </Button>
        </Card>
      ) : allCampaigns.length > 0 ? (
        <>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            <AnimatePresence mode="popLayout">
              {allCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {viewMode === 'grid' ? (
                    // Grid View Card
                    <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group relative">
                      {/* Dropdown Menu */}
                      <div className="absolute top-4 right-4">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenDropdown(openDropdown === campaign.id ? null : campaign.id)
                            }
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                          </button>
                          {openDropdown === campaign.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-10">
                              <button
                                onClick={() => handleEditClick(campaign)}
                                className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                              >
                                <TrendingUp className="w-4 h-4" />
                                View Details
                              </button>
                              {(campaign.status === 'draft' || campaign.status === 'failed') && (
                                <button
                                  onClick={() => handleDeleteClick(campaign)}
                                  className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Icon and Status */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                            <Send className="w-6 h-6 text-white" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center">
                            {campaign.status === 'running' && (
                              <div className="w-3 h-3 rounded-full bg-success-500 animate-pulse" />
                            )}
                            {campaign.status === 'scheduled' && (
                              <Clock className="w-3 h-3 text-warning-500" />
                            )}
                            {campaign.status === 'completed' && (
                              <CheckCircle className="w-3 h-3 text-success-500" />
                            )}
                            {campaign.status === 'failed' && (
                              <XCircle className="w-3 h-3 text-danger-500" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Campaign Info */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1 line-clamp-1">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                          {campaign.template?.name || 'No template'}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="mb-4">{getStatusBadge(campaign.status)}</div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                            <span className="text-xs text-neutral-600 dark:text-neutral-400">
                              Recipients
                            </span>
                          </div>
                          <p className="text-xl font-bold text-neutral-900 dark:text-white">
                            {campaign.totalRecipients}
                          </p>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-success-500" />
                            <span className="text-xs text-neutral-600 dark:text-neutral-400">
                              Delivered
                            </span>
                          </div>
                          <p className="text-xl font-bold text-neutral-900 dark:text-white">
                            {campaign.deliveredCount}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {calculateDeliveryRate(campaign)}%
                          </p>
                        </div>
                      </div>

                      {/* Schedule Info */}
                      {campaign.scheduledAt && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 mb-4">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(campaign.scheduledAt)}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => startMutation.mutate(campaign.id)}
                            loading={startMutation.isPending}
                            className="flex-1"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {campaign.status === 'running' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseMutation.mutate(campaign.id)}
                            loading={pauseMutation.isPending}
                            className="flex-1"
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                        )}
                        {campaign.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => startMutation.mutate(campaign.id)}
                            loading={startMutation.isPending}
                            className="flex-1"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Resume
                          </Button>
                        )}
                      </div>
                    </Card>
                  ) : (
                    // List View Card
                    <Card className="p-6 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center gap-6">
                        {/* Icon */}
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                            <Send className="w-6 h-6 text-white" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center">
                            {campaign.status === 'running' && (
                              <div className="w-3 h-3 rounded-full bg-success-500 animate-pulse" />
                            )}
                            {campaign.status === 'scheduled' && (
                              <Clock className="w-3 h-3 text-warning-500" />
                            )}
                            {campaign.status === 'completed' && (
                              <CheckCircle className="w-3 h-3 text-success-500" />
                            )}
                            {campaign.status === 'failed' && (
                              <XCircle className="w-3 h-3 text-danger-500" />
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                                {campaign.name}
                              </h3>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                                {campaign.template?.name || 'No template'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {getStatusBadge(campaign.status)}
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                              <span className="text-neutral-600 dark:text-neutral-400">
                                {campaign.totalRecipients} recipients
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-success-500" />
                              <span className="text-neutral-600 dark:text-neutral-400">
                                {campaign.deliveredCount} delivered ({calculateDeliveryRate(campaign)}%)
                              </span>
                            </div>
                            {campaign.scheduledAt && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                <span className="text-neutral-600 dark:text-neutral-400">
                                  {formatDate(campaign.scheduledAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {campaign.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => startMutation.mutate(campaign.id)}
                              loading={startMutation.isPending}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          )}
                          {campaign.status === 'running' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pauseMutation.mutate(campaign.id)}
                              loading={pauseMutation.isPending}
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Pause
                            </Button>
                          )}
                          {campaign.status === 'paused' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => startMutation.mutate(campaign.id)}
                              loading={startMutation.isPending}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Resume
                            </Button>
                          )}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenDropdown(openDropdown === campaign.id ? null : campaign.id)
                              }
                              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                            </button>
                            {openDropdown === campaign.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-10">
                                <button
                                  onClick={() => handleEditClick(campaign)}
                                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                  View Details
                                </button>
                                {(campaign.status === 'draft' || campaign.status === 'failed') && (
                                  <button
                                    onClick={() => handleDeleteClick(campaign)}
                                    className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Infinite Scroll Indicator */}
          <div ref={observerTarget} className="flex items-center justify-center py-8">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <Spinner size="sm" />
                <span className="text-sm">Loading more campaigns...</span>
              </div>
            ) : hasNextPage ? (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Scroll for more
              </div>
            ) : allCampaigns.length > 0 ? (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing all {allCampaigns.length} of {totalCount} campaigns
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <Send className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            No campaigns found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first campaign'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button onClick={handleCreateClick} icon={<Plus className="w-4 h-4" />}>
              Create Campaign
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
