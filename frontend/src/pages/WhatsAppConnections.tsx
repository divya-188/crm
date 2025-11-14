import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Smartphone, 
  Grid3x3, 
  List, 
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import {
  QRCodeModal,
  ConnectionDeleteModal,
  ConnectionCard,
  ConnectionInlineForm,
} from '../components/whatsapp';
import { whatsappService, WhatsAppConnection } from '../services/whatsapp.service';
import toast from '../lib/toast';
import { pageVariants } from '../lib/motion-variants';

export const WhatsAppConnections: React.FC = () => {
  const queryClient = useQueryClient();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // View and form state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<WhatsAppConnection | null>(null);
  
  // Modal state
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
  });

  // Fetch connections with infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['whatsapp-connections', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const connections = await whatsappService.getConnections();
      
      // Apply filters
      let filtered = connections;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(searchLower) ||
            c.phoneNumber?.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.status) {
        filtered = filtered.filter((c) => c.status === filters.status);
      }
      
      if (filters.type) {
        filtered = filtered.filter((c) => c.type === filters.type);
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

  // Flatten paginated data
  const connections = data?.pages.flatMap((page) => page.data) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  // Calculate stats
  const stats = {
    total: totalCount,
    connected: connections.filter((c) => c.status === 'connected').length,
    disconnected: connections.filter((c) => c.status === 'disconnected').length,
    failed: connections.filter((c) => c.status === 'failed').length,
  };

  // Intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  React.useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Reconnect mutation
  const reconnectMutation = useMutation({
    mutationFn: (connectionId: string) =>
      whatsappService.reconnectConnection(connectionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections'] });
      
      if (data.type === 'baileys') {
        setSelectedConnection(data);
        setShowQRModal(true);
        toast.success('QR code generated. Please scan to connect.');
      } else {
        toast.success('Reconnection initiated');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reconnect');
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) =>
      whatsappService.disconnectConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections'] });
      toast.success('Connection disconnected successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to disconnect');
    },
  });

  // Handlers
  const handleShowQR = (connection: WhatsAppConnection) => {
    setSelectedConnection(connection);
    setShowQRModal(true);
  };

  const handleReconnect = (connection: WhatsAppConnection) => {
    reconnectMutation.mutate(connection.id);
  };

  const handleDisconnect = (connection: WhatsAppConnection) => {
    if (
      window.confirm(
        `Are you sure you want to disconnect "${connection.name}"?`
      )
    ) {
      disconnectMutation.mutate(connection.id);
    }
  };

  const handleEdit = (connection: WhatsAppConnection) => {
    setSelectedConnection(connection);
    setShowEditForm(true);
    setShowCreateForm(false);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (connection: WhatsAppConnection) => {
    setSelectedConnection(connection);
    setShowDeleteModal(true);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['whatsapp-connections'] });
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedConnection(null);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedConnection(null);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              WhatsApp Connections
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Manage your WhatsApp Business connections
            </p>
          </div>
          <Button 
            onClick={() => {
              setShowCreateForm(true);
              setShowEditForm(false);
              setSelectedConnection(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {[
          {
            title: 'Total Connections',
            value: stats.total,
            icon: Smartphone,
            color: 'primary',
            delay: 0,
          },
          {
            title: 'Connected',
            value: stats.connected,
            icon: CheckCircle,
            color: 'success',
            delay: 0.1,
          },
          {
            title: 'Disconnected',
            value: stats.disconnected,
            icon: XCircle,
            color: 'neutral',
            delay: 0.2,
          },
          {
            title: 'Failed',
            value: stats.failed,
            icon: AlertTriangle,
            color: 'danger',
            delay: 0.3,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  stat.color === 'primary'
                    ? 'from-primary-500 to-primary-700'
                    : stat.color === 'success'
                    ? 'from-success-500 to-success-700'
                    : stat.color === 'danger'
                    ? 'from-danger-500 to-danger-700'
                    : 'from-neutral-500 to-neutral-700'
                } flex items-center justify-center shadow-lg`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters and View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search connections..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'connected', label: 'Connected' },
                { value: 'disconnected', label: 'Disconnected' },
                { value: 'connecting', label: 'Connecting' },
                { value: 'failed', label: 'Failed' },
              ]}
              className="min-w-[150px]"
            />

            {/* Type Filter */}
            <Select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'baileys', label: 'QR Code' },
                { value: 'meta_api', label: 'Meta API' },
              ]}
              className="min-w-[150px]"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-600 text-primary-600 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-600 text-primary-600 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Inline Form */}
      <AnimatePresence>
        {(showCreateForm || showEditForm) && (
          <div className="mb-6">
            <ConnectionInlineForm
              mode={showEditForm ? 'edit' : 'create'}
              connection={selectedConnection}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg text-danger-900 dark:text-danger-100">
          Failed to load connections. Please try again.
        </div>
      )}

      {/* Connections Grid/List */}
      {connections.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            No connections yet
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            Get started by adding your first WhatsApp connection. You can connect via
            QR code or Meta Business API.
          </p>
          <Button 
            onClick={() => {
              setShowCreateForm(true);
              setShowEditForm(false);
              setSelectedConnection(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Connection
          </Button>
        </motion.div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          <AnimatePresence mode="popLayout">
            {connections.map((connection) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <ConnectionCard
                  connection={connection}
                  onShowQR={handleShowQR}
                  onReconnect={handleReconnect}
                  onDisconnect={handleDisconnect}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  viewMode={viewMode}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Infinite Scroll Indicator */}
      <div ref={observerTarget} className="flex justify-center py-8">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <Spinner size="sm" />
            <span className="text-sm">Loading more connections...</span>
          </div>
        )}
        {!hasNextPage && connections.length > 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing all {connections.length} of {totalCount} connections
          </p>
        )}
      </div>

      {/* Modals */}
      {selectedConnection && (
        <>
          <QRCodeModal
            isOpen={showQRModal}
            onClose={() => {
              setShowQRModal(false);
              setSelectedConnection(null);
            }}
            connection={selectedConnection}
            onSuccess={handleSuccess}
          />

          <ConnectionDeleteModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedConnection(null);
            }}
            connection={selectedConnection}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </motion.div>
  );
};
