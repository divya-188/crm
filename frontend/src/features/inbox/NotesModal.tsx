import React, { useState } from 'react';
import { X, FileText, Send } from 'lucide-react';
import { Conversation } from '@/types/models.types';
import { Modal, Button } from '@/components/ui';
import { conversationsService } from '@/services';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface NotesModalProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({ conversation, isOpen, onClose }) => {
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const { mutate: addNote, isPending } = useMutation({
    mutationFn: (noteText: string) =>
      conversationsService.addNote(conversation.id, noteText),
    onSuccess: () => {
      toast.success('Note added successfully');
      setNote('');
      onClose();
      queryClient.invalidateQueries({ queryKey: ['conversations', conversation.id] });
    },
    onError: () => {
      toast.error('Failed to add note');
    },
  });

  const handleSubmit = () => {
    if (!note.trim()) return;
    addNote(note.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 rounded-lg">
              <FileText size={20} className="text-accent-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Add Internal Note</h2>
              <p className="text-sm text-neutral-600">
                Add a note visible only to your team
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

        {/* Note Input */}
        <div className="mb-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your note here... (Cmd/Ctrl + Enter to submit)"
            className="w-full h-40 px-4 py-3 border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
          <div className="mt-2 text-xs text-neutral-500">
            {note.length} / 1000 characters
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isPending}
            disabled={!note.trim() || isPending || note.length > 1000}
            icon={<Send size={18} />}
            fullWidth
          >
            Add Note
          </Button>
        </div>
      </div>
    </Modal>
  );
};
