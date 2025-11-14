import { useState, useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Grid3x3,
  List,
  Users as UsersIcon,
} from 'lucide-react';
import { usersService } from '@/services/users.service';
import { User } from '@/types/models.types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import UserInlineForm from '@/components/users/UserInlineForm';
import { UserDeleteModal } from '@/components/users/UserDeleteModal';
import { UserDetailModal } from '@/components/users/UserDetailModal';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function Users() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Refs for scroll functionality
  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch users with infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['users', filters],
    queryFn: ({ pageParam = 1 }) =>
      usersService.getUsers({
        page: pageParam,
        limit: 20,
        role: filters.role !== 'all' ? filters.role : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined,
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

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'suspended' }) =>
      usersService.updateUser(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });

  const handleCreateUser = () => {
    const newState = !showCreateForm;
    setShowCreateForm(newState);
    setShowEditForm(false);
    setSelectedUser(null);
    
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

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditForm(true);
    setShowCreateForm(false);
    
    // Scroll to edit form with smooth animation
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    toggleStatusMutation.mutate({ id: user.id, status: newStatus });
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleRoleFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, role: value }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  // Flatten all pages data
  const allUsers = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.total || 0;

  const getRoleBadgeVariant = (role: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (role) {
      case 'super_admin':
        return 'danger';
      case 'admin':
        return 'warning';
      case 'agent':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'agent':
        return 'Agent';
      default:
        return 'User';
    }
  };

  // Calculate stats from all loaded users
  const stats = {
    total: totalCount,
    active: allUsers.filter(u => u.status === 'active').length,
    inactive: allUsers.filter(u => u.status === 'inactive').length,
    suspended: allUsers.filter(u => u.status === 'suspended').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            User Management
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage team members and their permissions
          </p>
        </div>
        <Button 
          onClick={handleCreateUser}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          {showCreateForm ? 'Cancel' : 'Add User'}
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
                  Total Users
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
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
                <Clock className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
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
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={filters.role}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="agent">Agent</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
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
            <UserInlineForm
              mode="create"
              onCancel={() => setShowCreateForm(false)}
              onSuccess={() => {
                setShowCreateForm(false);
              }}
            />
          </div>
        )}
        {showEditForm && selectedUser && (
          <div ref={editFormRef}>
            <UserInlineForm
              mode="edit"
              user={selectedUser}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedUser(null);
              }}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedUser(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Users Grid */}
      {error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            Failed to load users. Please try again.
          </p>
        </Card>
      ) : allUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <UserPlus className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            No users found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            {filters.search || filters.role !== 'all' || filters.status !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first team member'}
          </p>
          {!filters.search && filters.role === 'all' && filters.status === 'all' && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First User
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            <AnimatePresence mode="popLayout">
              {allUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewUser(user)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                          {getRoleLabel(user.role)}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(user.status)} size="sm">
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditUser(user);
                    }}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(user);
                    }}
                    className="flex-1"
                  >
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </Card>
            </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Infinite Scroll Trigger & Loading Indicator */}
          <div ref={observerTarget} className="flex items-center justify-center py-8">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-3">
                <Spinner size="md" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Loading more users...
                </p>
              </div>
            ) : hasNextPage ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Scroll down to load more
              </p>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing all {allUsers.length} of {totalCount} users
              </p>
            )}
          </div>
        </>
      )}

      {/* Modals */}

      <UserDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />
    </div>
  );
}
