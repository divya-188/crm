import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Tag as TagIcon, Plus } from 'lucide-react';
import { Conversation } from '@/types/models.types';
import { Modal, Button, Badge } from '@/components/ui';
import { useAddConversationTags } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

interface TagManagementModalProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

// Predefined tags - in production, fetch from API
const PREDEFINED_TAGS = [
  'urgent',
  'vip',
  'support',
  'sales',
  'billing',
  'technical',
  'feedback',
  'complaint',
  'follow-up',
  'resolved',
];

export const TagManagementModal: React.FC<TagManagementModalProps> = ({
  conversation,
  isOpen,
  onClose,
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(conversation.tags || []);
  const [newTag, setNewTag] = useState('');

  const { mutate: addTags, isPending } = useAddConversationTags();

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (!newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setNewTag('');
  };

  const handleSave = () => {
    addTags(
      { id: conversation.id, tags: selectedTags },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <TagIcon size={20} className="text-secondary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Manage Tags</h2>
              <p className="text-sm text-neutral-600">
                Add or remove tags for this conversation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-600" />
          </button>
        </div>

        {/* Current Tags */}
        {selectedTags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Selected Tags</h3>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <motion.div
                  key={tag}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Badge
                    variant="primary"
                    size="md"
                    className="cursor-pointer hover:bg-primary-700"
                    onClick={() => handleToggleTag(tag)}
                  >
                    {tag}
                    <X size={14} className="ml-1" />
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Add Custom Tag */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Add Custom Tag</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter tag name..."
              className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleAddCustomTag}
              disabled={!newTag.trim()}
              icon={<Plus size={18} />}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Predefined Tags */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Quick Tags</h3>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map((tag) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleToggleTag(tag)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  selectedTags.includes(tag)
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                )}
              >
                {tag}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isPending}
            disabled={isPending}
            fullWidth
          >
            Save Tags
          </Button>
        </div>
      </div>
    </Modal>
  );
};
