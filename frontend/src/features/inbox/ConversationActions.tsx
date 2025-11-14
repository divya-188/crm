import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Tag,
  FileText,
  CheckCircle,
  MoreVertical,
} from 'lucide-react';
import { Conversation } from '@/types/models.types';
import { cn } from '@/lib/utils';
import { AssignmentModal } from './AssignmentModal';
import { TagManagementModal } from './TagManagementModal';
import { NotesModal } from './NotesModal';
import { StatusChangeModal } from './StatusChangeModal';

interface ConversationActionsProps {
  conversation: Conversation;
}

export const ConversationActions: React.FC<ConversationActionsProps> = ({ conversation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const actions = [
    {
      icon: UserPlus,
      label: 'Assign to Agent',
      onClick: () => {
        setShowAssignmentModal(true);
        setIsOpen(false);
      },
      color: 'text-primary-600',
    },
    {
      icon: Tag,
      label: 'Manage Tags',
      onClick: () => {
        setShowTagModal(true);
        setIsOpen(false);
      },
      color: 'text-secondary-600',
    },
    {
      icon: FileText,
      label: 'Add Note',
      onClick: () => {
        setShowNotesModal(true);
        setIsOpen(false);
      },
      color: 'text-accent-600',
    },
    {
      icon: CheckCircle,
      label: 'Change Status',
      onClick: () => {
        setShowStatusModal(true);
        setIsOpen(false);
      },
      color: 'text-success-600',
    },
  ];

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isOpen
              ? 'bg-primary-100 text-primary-600'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          )}
          title="More options"
        >
          <MoreVertical className="w-5 h-5" />
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden z-50"
            >
              <div className="py-2">
                {actions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={index}
                      whileHover={{ backgroundColor: '#f8fafc', x: 4 }}
                      onClick={action.onClick}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    >
                      <Icon size={18} className={action.color} />
                      <span className="text-sm font-medium text-neutral-900">
                        {action.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AssignmentModal
        conversation={conversation}
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
      />

      <TagManagementModal
        conversation={conversation}
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
      />

      <NotesModal
        conversation={conversation}
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
      />

      <StatusChangeModal
        conversation={conversation}
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
      />
    </>
  );
};
