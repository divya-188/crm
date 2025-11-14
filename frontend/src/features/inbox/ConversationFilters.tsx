import { useState } from 'react';
import { Select, Button } from '@/components/ui';
import { useInboxStore } from '@/stores/inbox.store';
import { ConversationStatus } from '@/types/models.types';
import { X } from 'lucide-react';
import Badge from '@/components/ui/Badge';

export const ConversationFilters = () => {
  const { filters, updateFilters, setFilters } = useInboxStore();
  const [tagInput, setTagInput] = useState('');

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'open', label: 'Open' },
    { value: 'pending', label: 'Pending' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  const assignmentOptions = [
    { value: 'all', label: 'All Agents' },
    { value: 'me', label: 'Assigned to Me' },
    { value: 'unassigned', label: 'Unassigned' },
  ];

  const handleStatusChange = (value: string) => {
    updateFilters({
      status: value as ConversationStatus | 'all',
    });
  };

  const handleAssignmentChange = (value: string) => {
    updateFilters({
      assignedTo: value,
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const currentTags = filters.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        updateFilters({
          tags: [...currentTags, tagInput.trim()],
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateFilters({
      tags: (filters.tags || []).filter((tag) => tag !== tagToRemove),
    });
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      assignedTo: 'all',
      tags: [],
      search: filters.search || '',
    });
    setTagInput('');
  };

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.assignedTo !== 'all' ||
    (filters.tags && filters.tags.length > 0);

  return (
    <div className="p-4 space-y-3 bg-neutral-50">
      {/* Status Filter */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1">Status</label>
        <Select
          value={filters.status || 'all'}
          onChange={(e) => handleStatusChange(e.target.value)}
          options={statusOptions}
        />
      </div>

      {/* Assignment Filter */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1">Assignment</label>
        <Select
          value={filters.assignedTo || 'all'}
          onChange={(e) => handleAssignmentChange(e.target.value)}
          options={assignmentOptions}
        />
      </div>

      {/* Tags Filter */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1">Tags</label>
        <input
          type="text"
          placeholder="Type tag and press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {filters.tags && filters.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.tags.map((tag) => (
              <Badge key={tag} variant="primary" size="sm">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-primary-700"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={handleClearFilters} className="w-full">
          Clear Filters
        </Button>
      )}
    </div>
  );
};
