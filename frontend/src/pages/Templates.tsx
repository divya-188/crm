import { useState, useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
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
} from 'lucide-react';
import { templatesService } from '@/services/templates.service';
import { Template } from '@/types/models.types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import TemplateInlineForm from '@/components/templates/TemplateInlineForm';
import { TemplatePreviewModal, TemplateDeleteModal } from '@/components/templates';

export default function Templates() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    language: 'all',
    search: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
    queryKey: ['templates', filters],
    queryFn: ({ pageParam = 1 }) =>
      templatesService.getTemplates({
        page: pageParam,
        limit: 20,
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
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

  // Submit template mutation
  const submitMutation = useMutation({
    mutationFn: (id: string) => templatesService.submitTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template submitted for approval');
      setOpenDropdown(null);
    },
    onError: () => {
      toast.error('Failed to submit template');
    },
  });

  const handleCreateTemplate = () => {
    const newState = !showCreateForm;
    setShowCreateForm(newState);
    setShowEditForm(false);
    setSelectedTemplate(null);
    
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

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleCategoryFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, category: value }));
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
        <Button 
          onClick={handleCreateTemplate}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          {showCreateForm ? 'Cancel' : 'Create Template'}
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

      {/* Filters and View Toggle */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search templates..."
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
                  { value: 'all', label: 'All Status' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={filters.category}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'marketing', label: 'Marketing' },
                  { value: 'utility', label: 'Utility' },
                  { value: 'authentication', label: 'Authentication' },
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
            <TemplateInlineForm
              mode="create"
              onCancel={() => setShowCreateForm(false)}
              onSuccess={() => {
                setShowCreateForm(false);
              }}
            />
          </div>
        )}
        {showEditForm && selectedTemplate && (
          <div ref={editFormRef}>
            <TemplateInlineForm
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
          </div>
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
            <Button onClick={() => setShowCreateForm(true)}>
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
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-primary-600 transition-colors"
                                      >
                                        <Send className="w-4 h-4" />
                                        Submit for Approval
                                      </button>
                                    </>
                                  )}
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
                          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1 truncate">
                            {template.name}
                          </h3>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                            {template.language}
                          </p>

                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant={statusInfo.color as any} className="flex items-center gap-1.5">
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </Badge>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                          </div>

                          {/* Content Preview */}
                          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 mb-4">
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
                              {template.content}
                            </p>
                          </div>

                          {/* Variables */}
                          {template.variables && template.variables.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
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
                            <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-3 mb-4">
                              <p className="text-sm text-danger-700 dark:text-danger-400">
                                <strong>Rejection:</strong> {template.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                          <div className="flex items-center justify-between text-xs text-neutral-500">
                            <span>Created {formatDate(template.createdAt)}</span>
                          </div>
                        </div>
                      </div>
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
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-primary-600 transition-colors"
                                    >
                                      <Send className="w-4 h-4" />
                                      Submit for Approval
                                    </button>
                                  </>
                                )}
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
    </div>
  );
}
