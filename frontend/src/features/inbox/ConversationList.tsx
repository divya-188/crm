import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Filter, X } from 'lucide-react';
import { Conversation } from '@/types/models.types';
import { ConversationItem } from './ConversationItem';
import { ConversationFilters } from './ConversationFilters';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  isLoading?: boolean;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading = false,
  onSearch,
  searchQuery = '',
}: ConversationListProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    onSearch?.(value);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    onSearch?.('');
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            Conversations
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showFilters
                ? 'bg-primary-100 text-primary-600'
                : 'hover:bg-neutral-100 text-neutral-600'
            )}
            aria-label="Toggle filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {localSearchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-neutral-200"
          >
            <ConversationFilters />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner size="md" />
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState searchQuery={localSearchQuery} />
        ) : (
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-neutral-100"
          >
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                variants={listItemVariants}
                whileHover={{ backgroundColor: '#f8fafc' }}
                onClick={() => onSelectConversation(conversation)}
                className={cn(
                  'cursor-pointer transition-colors',
                  selectedConversationId === conversation.id && 'bg-primary-50'
                )}
              >
                <ConversationItem
                  conversation={conversation}
                  isSelected={selectedConversationId === conversation.id}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ searchQuery }: { searchQuery: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-64 px-4 text-center"
    >
      <div className="w-16 h-16 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        {searchQuery ? 'No conversations found' : 'No conversations yet'}
      </h3>
      <p className="text-sm text-neutral-600 max-w-xs">
        {searchQuery
          ? "Try adjusting your search or filters to find what you're looking for."
          : 'When customers message you, their conversations will appear here.'}
      </p>
    </motion.div>
  );
};
