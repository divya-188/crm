import { useState, useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Grid3x3,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Send,
  Copy,
  BarChart3,
  Upload,
  Download,
  RefreshCw,
  Globe,
  Tag,
} from 'lucide-react';
import { templatesService } from '@/services/templates.service';
import { Template } from '@/types/models.types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { BorderBeam } from '@/components/ui/BorderBeam';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import Toast from '@/lib/toast-system';
import TemplateCreationWizard from '@/components/templates/TemplateCreationWizard';
import { TemplatePreviewModal, TemplateDeleteModal, TemplateDuplicateModal } from '@/components/templates';
import { TemplateImportModal, TemplateExportModal } from '@/components/templates/import-export';
import TemplateFilters, { TemplateFilterValues, SortOptions } from '@/components/templates/TemplateFilters';

export default function Templates() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<TemplateFilterValues>({
    status: 'all',
    category: 'all',
    language: 'all',
    search: '',
    startDate: undefined,
    endDate: undefined,
  });
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Refs for scroll functionality
  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch templates with infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['templates', filters, sortOptions],
    queryFn: ({ pageParam = 1 }) =>
      templatesService.getTemplates({
        page: pageParam,
        limit: 20,
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        language: filters.language !== 'all' ? filters.language : undefined,
        search: filters.search || undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sortBy: sortOptions.sortBy,
        sortOrder: sortOptions.sortOrder,
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

  // Submit template mutation
  const submitMutation = useMutation({
    mutationFn: (id: string) => templatesService.submitTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      Toast.success('Template submitted for approval');
      setOpenDropdown(null);
    },
    onError: () => {
      Toast.error('Failed to submit template');
    },
  });

  // Sync all templates from Meta
  const syncMutation = useMutation({
    mutationFn: () => templatesService.syncTemplatesFromMeta(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      Toast.success(`Synced ${data.synced} template(s) from Meta`);
      if (data.errors.length > 0) {
        Toast.warning(`${data.errors.length} error(s) occurred during sync`);
      }
    },
    onError: () => {
      Toast.error('Failed to sync templates from Meta');
    },
  });

  // Refresh individual template status
  const refreshStatusMutation = useMutation({
    mutationFn: (id: string) => templatesService.getMetaStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      Toast.success('Template status refreshed from Meta');
      setOpenDropdown(null);
    },
    onError: () => {
      Toast.error('Failed to refresh template status');
    },
  });

  const handleCreateTemplate = () => {
    setShowCreateForm(true);
    setShowEditForm(false);
    setSelectedTemplate(null);
    
    // Scroll to create form with smooth animation
    setTimeout(() => {
      createFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
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

  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
    setOpenDropdown(null);
  };

  const handleDeleteTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
    setOpenDropdown(null);
  };

  const handleSubmitTemplate = (template: Template) => {
    if (template.status === 'draft') {
      submitMutation.mutate(template.id);
    }
  };

  const handleDuplicateTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsDuplicateModalOpen(true);
    setOpenDropdown(null);
  };

  const handleViewAnalytics = (template: Template) => {
    navigate(`/templates/${template.id}/analytics`);
    setOpenDropdown(null);
  };

  const handleRefreshStatus = async (template: Template) => {
    try {
      Toast.info('Refreshing template status...');
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
      Toast.success('Template status refreshed');
    } catch (error) {
      Toast.error('Failed to refresh status');
    }
  };

  const handleFiltersChange = (newFilters: TemplateFilterValues) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      category: 'all',
      language: 'all',
      search: '',
      startDate: undefined,
      endDate: undefined,
    });
  };

  const handleSortChange = (newSortOptions: SortOptions) => {
    setSortOptions(newSortOptions);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Flatten all pages data
  const allTemplates = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Calculate stats from all loaded templates
  const stats = {
    total: totalCount,
    approved: allTemplates.filter(t => t.status === 'approved').length,
    pending: allTemplates.filter(t => t.status === 'pending').length,
    rejected: allTemplates.filter(t => t.status === 'rejected').length,
  };

  const statusConfig = {
    approved: { 
      label: 'Approved', 
      color: 'success', 
      icon: CheckCircle,
      dotColor: 'bg-success-500'
    },
    pending: { 
      label: 'Pending', 
      color: 'warning', 
      icon: Clock,
      dotColor: 'bg-warning-500'
    },
    rejected: { 
      label: 'Rejected', 
      color: 'danger', 
      icon: XCircle,
      dotColor: 'bg-danger-500'
    },
    draft: { 
      label: 'Draft', 
      color: 'neutral', 
      icon: FileText,
      dotColor: 'bg-neutral-500'
    },
  };

  const categoryConfig = {
    marketing: { label: 'Marketing', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
    utility: { label: 'Utility', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
    authentication: { label: 'Authentication', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Templates
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage your WhatsApp message templates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsImportModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button 
            onClick={() => setIsExportModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing...' : 'Sync from Meta'}
          </Button>
          <Button 
            onClick={handleCreateTemplate}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
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
                  Total Templates
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
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
                  Approved
                </p>
                <p className="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">
                  {stats.approved}
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
                  Pending
                </p>
                <p className="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                  {stats.pending}
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
                  Rejected
                </p>
                <p className="text-3xl font-bold text-danger-600 dark:text-danger-400 mt-1">
                  {stats.rejected}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-danger-100 dark:bg-danger-900/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <TemplateFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
            sortOptions={sortOptions}
            onSortChange={handleSortChange}
          />
        </div>
        
        {/* View Mode */}
        <div className="flex flex-col sm:flex-row gap-4 lg:w-auto">
          
          {/* View Mode Toggle */}
          <Card className="p-4 flex items-center justify-center">
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-neutral-700 shadow-sm'
                    : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
                title="Grid view"
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
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Template Creation Wizard */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            ref={createFormRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TemplateCreationWizard
              mode="create"
              onCancel={() => setShowCreateForm(false)}
              onSuccess={() => setShowCreateForm(false)}
            />
          </motion.div>
        )}
        {showEditForm && selectedTemplate && (
          <motion.div
            ref={editFormRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TemplateCreationWizard
              mode="edit"
              template={selectedTemplate}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedTemplate(null);
              }}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedTemplate(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            Failed to load templates. Please try again.
          </p>
        </Card>
      ) : allTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            No templates found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            {filters.search || filters.status !== 'all' || filters.category !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first template'}
          </p>
          {!filters.search && filters.status === 'all' && filters.category === 'all' && (
            <Button onClick={handleCreateTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Template
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
            <AnimatePresence mode="popLayout">
              {allTemplates.map((template, index) => {
                const statusInfo = statusConfig[template.status as keyof typeof statusConfig] || statusConfig.draft;
                const StatusIcon = statusInfo.icon;
                const categoryInfo = categoryConfig[template.category as keyof typeof categoryConfig];
                
                return viewMode === 'grid' ? (
                  // Grid View Card
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ 
                      delay: index * 0.05,
                      duration: 0.4,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    whileHover={{ 
                      y: -8,
                      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                    }}
                    className="group h-full"
                  >
                    <Card className="p-6 h-full shadow-md hover:shadow-2xl transition-all duration-500 ease-out border-0 relative overflow-hidden bg-white dark:bg-neutral-900 rounded-xl">
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-primary-50/0 to-primary-100/0 dark:from-primary-900/0 dark:via-primary-900/0 dark:to-primary-800/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      
                      <div className="flex flex-col h-full relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
                                <FileText className="w-7 h-7 text-white" />
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusInfo.dotColor} rounded-full border-2 border-white dark:border-neutral-900`} />
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setOpenDropdown(openDropdown === template.id ? null : template.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>

                            <AnimatePresence>
                              {openDropdown === template.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 z-10"
                                >
                                  <button
                                    onClick={() => handlePreviewTemplate(template)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Preview
                                  </button>
                                  {(template.status === 'pending' || template.status === 'approved') && template.metaTemplateId && (
                                    <button
                                      onClick={() => refreshStatusMutation.mutate(template.id)}
                                      disabled={refreshStatusMutation.isPending && refreshStatusMutation.variables === template.id}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-primary-600 transition-colors disabled:opacity-50"
                                    >
                                      <RefreshCw className={`w-4 h-4 ${refreshStatusMutation.isPending && refreshStatusMutation.variables === template.id ? 'animate-spin' : ''}`} />
                                      Refresh Status
                                    </button>
                                  )}
                                  {template.status === 'approved' && (
                                    <button
                                      onClick={() => handleViewAnalytics(template)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                    >
                                      <BarChart3 className="w-4 h-4" />
                                      View Analytics
                                    </button>
                                  )}
                                  {template.status === 'draft' && (
                                    <>
                                      <button
                                        onClick={() => handleEditTemplate(template)}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                      >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleSubmitTemplate(template)}
                                        disabled={submitMutation.isPending && submitMutation.variables === template.id}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {submitMutation.isPending && submitMutation.variables === template.id ? (
                                          <>
                                            <Spinner size="sm" className="w-4 h-4" />
                                            Submitting...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="w-4 h-4" />
                                            Submit for Approval
                                          </>
                                        )}
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDuplicateTemplate(template)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                  >
                                    <Copy className="w-4 h-4" />
                                    Duplicate
                                  </button>
                                  {(template.status === 'draft' || template.status === 'rejected') && (
                                    <>
                                      <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                                      <button
                                        onClick={() => handleDeleteTemplate(template)}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-danger-600 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 line-clamp-2" title={template.name}>
                            {template.name
                              .replace(/_/g, ' ')
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(' ')
                              .substring(0, 50)}
                            {template.name.length > 50 && '...'}
                          </h3>

                          <div className="flex items-center justify-between gap-3 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex-1 justify-center">
                              <Globe className="w-3 h-3" />
                              {template.language.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-1 justify-center ${
                              statusInfo.color === 'success' ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400' :
                              statusInfo.color === 'warning' ? 'bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400' :
                              statusInfo.color === 'danger' ? 'bg-danger-100 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400' :
                              'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                            }`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-1 justify-center ${categoryInfo.color}`}>
                              <Tag className="w-3 h-3" />
                              {categoryInfo.label}
                            </span>
                          </div>

                          {/* Creation Date */}
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                            Created on {formatDate(template.createdAt)}
                          </div>

                          {/* Content Preview */}
                          {(template.content || (template as any).components?.body?.text) && (
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 mb-4">
                              <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
                                {template.content || (template as any).components?.body?.text || 'No content available'}
                              </p>
                            </div>
                          )}

                          {/* Variables */}
                          {template.variables && template.variables.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {template.variables.slice(0, 3).map((variable, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded text-xs"
                                >
                                  {variable.name}
                                </span>
                              ))}
                              {template.variables.length > 3 && (
                                <span className="px-2 py-1 text-neutral-500 text-xs">
                                  +{template.variables.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Rejection Reason */}
                          {template.status === 'rejected' && template.rejectionReason && (
                            <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-3 mb-3">
                              <p className="text-sm text-danger-700 dark:text-danger-400">
                                <strong>Rejection:</strong> {template.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Footer with Action Buttons */}
                        <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {/* Left buttons - expand RIGHT */}
                            <button
                              onClick={() => handlePreviewTemplate(template)}
                              className="group/preview relative flex items-center flex-1 h-10 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 overflow-visible justify-center hover:justify-start hover:z-10 transition-[background-color,color,justify-content] duration-[600ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                            >
                              <Eye className="w-4 h-4 flex-shrink-0" />
                              <span className="max-w-0 opacity-0 group-hover/preview:max-w-[100px] group-hover/preview:opacity-100 ml-0 group-hover/preview:ml-2 text-sm font-medium whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin] duration-[600ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]">
                                Preview
                              </span>
                            </button>

                            <button
                              onClick={() => handleRefreshStatus(template)}
                              className="group/refresh relative flex items-center flex-1 h-10 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 overflow-visible justify-center hover:justify-start hover:z-10 transition-[background-color,color,justify-content] duration-[600ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                            >
                              <RefreshCw className="w-4 h-4 flex-shrink-0" />
                              <span className="max-w-0 opacity-0 group-hover/refresh:max-w-[100px] group-hover/refresh:opacity-100 ml-0 group-hover/refresh:ml-2 text-sm font-medium whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin] duration-[600ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]">
                                Refresh
                              </span>
                            </button>

                            {/* Right buttons - expand LEFT */}
                            <button
                              onClick={() => navigate(`/templates/${template.id}/analytics`)}
                              className="group/analytics relative flex items-center flex-row-reverse flex-1 h-10 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 overflow-visible justify-center hover:justify-start hover:z-10 transition-[background-color,color,justify-content] duration-[600ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                            >
                              <BarChart3 className="w-4 h-4 flex-shrink-0" />
                              <span className="max-w-0 opacity-0 group-hover/analytics:max-w-[100px] group-hover/analytics:opacity-100 mr-0 group-hover/analytics:mr-2 text-sm font-medium whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin] duration-[600ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]">
                                Analytics
                              </span>
                            </button>

                            <button
                              onClick={() => handleDuplicateTemplate(template)}
                              className="group/duplicate relative flex items-center flex-row-reverse flex-1 h-10 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 overflow-visible justify-center hover:justify-start hover:z-10 transition-[background-color,color,justify-content] duration-[600ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                            >
                              <Copy className="w-4 h-4 flex-shrink-0" />
                              <span className="max-w-0 opacity-0 group-hover/duplicate:max-w-[100px] group-hover/duplicate:opacity-100 mr-0 group-hover/duplicate:mr-2 text-sm font-medium whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin] duration-[600ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]">
                                Duplicate
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Animated Border Beam - Only on hover */}
                      <BorderBeam
                        size={250}
                        duration={12}
                        delay={0}
                        borderWidth={1.5}
                        colorFrom="#7c3aed"
                        colorTo="#a78bfa"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      />
                    </Card>
                  </motion.div>
                ) : (
                  // List View Card
                  <motion.div
                    key={template.id}
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
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusInfo.dotColor} rounded-full border-2 border-white dark:border-neutral-900`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                                {template.name}
                              </h3>
                              <Badge variant={statusInfo.color as any} className="flex items-center gap-1 flex-shrink-0">
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </Badge>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${categoryInfo.color}`}>
                                {categoryInfo.label}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                              {template.language} • {template.content.substring(0, 60)}...
                            </p>
                          </div>

                          <div className="hidden md:block text-sm text-neutral-500 flex-shrink-0">
                            {formatDate(template.createdAt)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="relative flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpenDropdown(openDropdown === template.id ? null : template.id)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>

                          <AnimatePresence>
                            {openDropdown === template.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 z-10"
                              >
                                <button
                                  onClick={() => handlePreviewTemplate(template)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  Preview
                                </button>
                                {(template.status === 'pending' || template.status === 'approved') && template.metaTemplateId && (
                                  <button
                                    onClick={() => refreshStatusMutation.mutate(template.id)}
                                    disabled={refreshStatusMutation.isPending && refreshStatusMutation.variables === template.id}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-primary-600 transition-colors disabled:opacity-50"
                                  >
                                    <RefreshCw className={`w-4 h-4 ${refreshStatusMutation.isPending && refreshStatusMutation.variables === template.id ? 'animate-spin' : ''}`} />
                                    Refresh Status
                                  </button>
                                )}
                                {template.status === 'approved' && (
                                  <button
                                    onClick={() => handleViewAnalytics(template)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                  >
                                    <BarChart3 className="w-4 h-4" />
                                    View Analytics
                                  </button>
                                )}
                                {template.status === 'draft' && (
                                  <>
                                    <button
                                      onClick={() => handleEditTemplate(template)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleSubmitTemplate(template)}
                                      disabled={submitMutation.isPending && submitMutation.variables === template.id}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {submitMutation.isPending && submitMutation.variables === template.id ? (
                                        <>
                                          <Spinner size="sm" className="w-4 h-4" />
                                          Submitting...
                                        </>
                                      ) : (
                                        <>
                                          <Send className="w-4 h-4" />
                                          Submit for Approval
                                        </>
                                      )}
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDuplicateTemplate(template)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                  Duplicate
                                </button>
                                {(template.status === 'draft' || template.status === 'rejected') && (
                                  <>
                                    <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                                    <button
                                      onClick={() => handleDeleteTemplate(template)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-danger-600 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </>
                                )}
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
                  Loading more templates...
                </p>
              </div>
            ) : hasNextPage ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Scroll down to load more
              </p>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing all {allTemplates.length} of {totalCount} templates
              </p>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <TemplatePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />
      <TemplateDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />
      <TemplateDuplicateModal
        isOpen={isDuplicateModalOpen}
        onClose={() => {
          setIsDuplicateModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />
      <TemplateImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
      <TemplateExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
