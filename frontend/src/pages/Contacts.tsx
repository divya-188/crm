import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Upload, Download, Search, Filter, X, Users, Mail, Phone,
  Tag as TagIcon, Grid3x3, List, MoreVertical, Edit, Trash2, Eye
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { contactsService } from '@/services';
import { Contact, ContactSegment } from '@/types/models.types';
import { toast } from 'react-hot-toast';
import ContactInlineForm from '@/components/contacts/ContactInlineForm';
import { ContactDetailModal } from '@/components/contacts/ContactDetailModal';
import { ContactImportModal } from '@/components/contacts/ContactImportModal';
import { SegmentList, SegmentModal, SegmentViewModal } from '@/components/contacts';
import { CustomFieldsManager } from '@/components/contacts/CustomFieldsManager';

export const Contacts = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'contacts' | 'segments' | 'custom-fields'>('contacts');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({ search: '', tags: [] as string[] });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [segments, setSegments] = useState<ContactSegment[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<ContactSegment | null>(null);
  const [showSegmentViewModal, setShowSegmentViewModal] = useState(false);

  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['contacts', filters],
    queryFn: ({ pageParam = 1 }) => contactsService.getContacts({
      page: pageParam, limit: 20,
      search: filters.search || undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
    }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      const nextPage = lastPage.meta.page + 1;
      return nextPage <= lastPage.meta.totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
    enabled: activeTab === 'contacts',
  });

  useEffect(() => {
    if (activeTab !== 'contacts') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, activeTab]);

  useEffect(() => {
    if (activeTab === 'segments') loadSegments();
  }, [activeTab]);

  const loadSegments = async () => {
    setIsLoadingSegments(true);
    try {
      const data = await contactsService.getSegments();
      setSegments(data);
    } catch (error) {
      toast.error('Failed to load segments');
    } finally {
      setIsLoadingSegments(false);
    }
  };

  const allContacts = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.meta?.total || 0;
  const allTags = Array.from(new Set(allContacts.flatMap((contact) => contact.tags || [])));
  const stats = {
    total: totalCount,
    withEmail: allContacts.filter(c => c.email).length,
    withPhone: allContacts.filter(c => c.phone || c.phoneNumber).length,
    tagged: allContacts.filter(c => c.tags && c.tags.length > 0).length,
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setShowEditForm(true);
    setShowCreateForm(false);
    setOpenDropdown(null);
    setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleDelete = async (contact: Contact) => {
    if (window.confirm('Are you sure?')) {
      try {
        await contactsService.deleteContact(contact.id);
        toast.success('Contact deleted');
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      } catch (error) {
        toast.error('Failed to delete contact');
      }
    }
    setOpenDropdown(null);
  };

  const handleExport = async () => {
    try {
      const blob = await contactsService.exportContacts({
        search: filters.search || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Contacts exported');
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  if (activeTab !== 'contacts') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Contacts</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage your customer contacts and segments</p>
          </div>
          <Button onClick={() => { setSelectedSegment(null); setShowSegmentModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />Create Segment
          </Button>
        </div>
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <nav className="flex gap-8">
            <button onClick={() => setActiveTab('contacts')} className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'contacts' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500'}`}>All Contacts</button>
            <button onClick={() => setActiveTab('segments')} className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'segments' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500'}`}><Users className="w-4 h-4" />Segments{segments.length > 0 && <Badge variant="secondary" className="text-xs">{segments.length}</Badge>}</button>
            <button onClick={() => setActiveTab('custom-fields')} className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'custom-fields' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500'}`}>Custom Fields</button>
          </nav>
        </div>
        {activeTab === 'segments' && <SegmentList segments={segments} onView={(s) => { setSelectedSegment(s); setShowSegmentViewModal(true); }} onEdit={(s) => { setSelectedSegment(s); setShowSegmentModal(true); }} onDelete={async (id) => { if (window.confirm('Delete segment?')) { try { await contactsService.deleteSegment(id); toast.success('Segment deleted'); loadSegments(); } catch (error) { toast.error('Failed to delete'); } } }} isLoading={isLoadingSegments} />}
        {activeTab === 'custom-fields' && <CustomFieldsManager />}
        <SegmentModal isOpen={showSegmentModal} onClose={() => setShowSegmentModal(false)} segment={selectedSegment} onSuccess={() => { setShowSegmentModal(false); loadSegments(); }} />
        {selectedSegment && <SegmentViewModal isOpen={showSegmentViewModal} onClose={() => setShowSegmentViewModal(false)} segment={selectedSegment} />}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Contact Management</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage your customer contacts and segments</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} disabled={!allContacts || allContacts.length === 0}><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button variant="outline" onClick={() => setShowImportModal(true)}><Upload className="w-4 h-4 mr-2" />Import</Button>
          <Button onClick={() => { const newState = !showCreateForm; setShowCreateForm(newState); setShowEditForm(false); setSelectedContact(null); if (newState) setTimeout(() => createFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }} className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all"><Plus className="w-4 h-4" />{showCreateForm ? 'Cancel' : 'Add Contact'}</Button>
        </div>
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex gap-8">
          <button onClick={() => setActiveTab('contacts')} className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'contacts' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500'}`}>All Contacts</button>
          <button onClick={() => setActiveTab('segments')} className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'segments' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500'}`}><Users className="w-4 h-4" />Segments{segments.length > 0 && <Badge variant="secondary" className="text-xs">{segments.length}</Badge>}</button>
          <button onClick={() => setActiveTab('custom-fields')} className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'custom-fields' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500'}`}>Custom Fields</button>
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Contacts', value: stats.total, icon: Users, color: 'primary' },
          { title: 'With Email', value: stats.withEmail, icon: Mail, color: 'success' },
          { title: 'With Phone', value: stats.withPhone, icon: Phone, color: 'warning' },
          { title: 'Tagged', value: stats.tagged, icon: TagIcon, color: 'neutral' }
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{stat.title}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color === 'primary' ? 'text-neutral-900 dark:text-white' : stat.color === 'success' ? 'text-success-600 dark:text-success-400' : stat.color === 'warning' ? 'text-warning-600 dark:text-warning-400' : 'text-neutral-600 dark:text-neutral-400'}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === 'primary' ? 'bg-primary-100 dark:bg-primary-900/20' : stat.color === 'success' ? 'bg-success-100 dark:bg-success-900/20' : stat.color === 'warning' ? 'bg-warning-100 dark:bg-warning-900/20' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color === 'primary' ? 'text-primary-600 dark:text-primary-400' : stat.color === 'success' ? 'text-success-600 dark:text-success-400' : stat.color === 'warning' ? 'text-warning-600 dark:text-warning-400' : 'text-neutral-600 dark:text-neutral-400'}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex-1 max-w-md">
              <Input placeholder="Search by name, email, or phone..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} icon={<Search className="w-4 h-4" />} />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'bg-primary-50 dark:bg-primary-900/20' : ''}><Filter className="w-4 h-4 mr-2" />Filters{filters.tags.length > 0 && <Badge variant="primary" className="ml-2">{filters.tags.length}</Badge>}</Button>
          </div>
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}><Grid3x3 className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>
        {filters.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Active filters:</span>
            {filters.tags.map(tag => <Badge key={tag} variant="primary" className="flex items-center gap-1">{tag}<button onClick={() => setFilters(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))} className="ml-1 hover:bg-primary-600 rounded-full p-0.5"><X className="w-3 h-3" /></button></Badge>)}
            <Button variant="ghost" size="sm" onClick={() => setFilters(prev => ({ ...prev, tags: [] }))} className="text-xs">Clear all</Button>
          </div>
        )}
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Filter by Tags</label><div className="flex flex-wrap gap-2">{allTags.length > 0 ? allTags.map(tag => <Badge key={tag} variant={filters.tags.includes(tag) ? 'primary' : 'secondary'} className="cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag] }))}>{tag}</Badge>) : <p className="text-sm text-neutral-500 dark:text-neutral-400">No tags available</p>}</div></div>
          </motion.div>
        )}
      </Card>

      <AnimatePresence>
        {showCreateForm && <div ref={createFormRef}><ContactInlineForm mode="create" onCancel={() => setShowCreateForm(false)} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setShowCreateForm(false); }} /></div>}
        {showEditForm && selectedContact && <div ref={editFormRef}><ContactInlineForm mode="edit" contact={selectedContact} onCancel={() => { setShowEditForm(false); setSelectedContact(null); }} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setShowEditForm(false); setSelectedContact(null); }} /></div>}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Card className="p-8 text-center"><p className="text-danger-600 dark:text-danger-400">Failed to load contacts</p></Card>
      ) : allContacts.length === 0 ? (
        <Card className="p-12 text-center"><Users className="w-16 h-16 text-neutral-400 mx-auto mb-4" /><h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No contacts found</h3><p className="text-neutral-600 dark:text-neutral-400 mb-4">{filters.search || filters.tags.length > 0 ? 'Try adjusting your filters' : 'Get started by adding your first contact'}</p>{!filters.search && filters.tags.length === 0 && <Button onClick={() => setShowCreateForm(true)}><Plus className="w-4 h-4 mr-2" />Add First Contact</Button>}</Card>
      ) : (
        <>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            <AnimatePresence mode="popLayout">
              {allContacts.map((contact, index) => {
                const displayName = contact.name || (contact.firstName && contact.lastName ? `${contact.firstName} ${contact.lastName}` : contact.firstName || contact.lastName) || contact.email || contact.phone || contact.phoneNumber || 'Unknown';
                const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <motion.div key={contact.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }} className="group">
                    <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800">
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">{initials}</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-neutral-900 dark:text-white truncate">{displayName}</h3>
                              {contact.email && <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{contact.email}</p>}
                              {(contact.phone || contact.phoneNumber) && <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{contact.phone || contact.phoneNumber}</p>}
                            </div>
                          </div>
                          <div className="relative">
                            <Button variant="ghost" size="sm" onClick={() => setOpenDropdown(openDropdown === contact.id ? null : contact.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></Button>
                            <AnimatePresence>
                              {openDropdown === contact.id && (
                                <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 z-10">
                                  <button onClick={() => { setSelectedContact(contact); setIsDetailModalOpen(true); setOpenDropdown(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"><Eye className="w-4 h-4" />View Details</button>
                                  <button onClick={() => handleEdit(contact)} className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"><Edit className="w-4 h-4" />Edit</button>
                                  <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                                  <button onClick={() => handleDelete(contact)} className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-danger-600"><Trash2 className="w-4 h-4" />Delete</button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {contact.tags.slice(0, 3).map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                            {contact.tags.length > 3 && <Badge variant="secondary" className="text-xs">+{contact.tags.length - 3}</Badge>}
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <div ref={observerTarget} className="flex items-center justify-center py-8">
            {isFetchingNextPage ? <div className="flex items-center gap-3"><Spinner size="md" /><p className="text-sm text-neutral-600 dark:text-neutral-400">Loading more contacts...</p></div> : hasNextPage ? <p className="text-sm text-neutral-500 dark:text-neutral-400">Scroll down to load more</p> : <p className="text-sm text-neutral-500 dark:text-neutral-400">Showing all {allContacts.length} of {totalCount} contacts</p>}
          </div>
        </>
      )}

      <ContactImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
      {selectedContact && <ContactDetailModal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setSelectedContact(null); }} contact={selectedContact} />}
    </div>
  );
};
