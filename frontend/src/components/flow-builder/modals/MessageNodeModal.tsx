import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import VariablePicker from '../VariablePicker';
import { MessageSquare } from 'lucide-react';

interface MessageNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MessageNodeData) => void;
  initialData?: MessageNodeData;
}

export interface MessageNodeData {
  message: string;
  label?: string;
}

const MessageNodeModal: React.FC<MessageNodeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [message, setMessage] = useState(initialData?.message || '');
  const [label, setLabel] = useState(initialData?.label || 'Send Message');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialData) {
      setMessage(initialData.message || '');
      setLabel(initialData.label || 'Send Message');
    }
  }, [initialData]);

  const handleVariableSelect = (variable: string) => {
    const newMessage =
      message.slice(0, cursorPosition) +
      variable +
      message.slice(cursorPosition);
    setMessage(newMessage);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = cursorPosition + variable.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleSave = () => {
    if (!message.trim()) {
      return;
    }

    onSave({
      message: message.trim(),
      label: label.trim() || 'Send Message',
    });
    onClose();
  };

  const handleCancel = () => {
    setMessage(initialData?.message || '');
    setLabel(initialData?.label || 'Send Message');
    onClose();
  };

  const characterCount = message.length;
  const isValid = message.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Configure Message Node"
      description="Set the message content to send to the user"
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            {characterCount} characters
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!isValid}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Node Label */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Node Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Welcome Message"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="mt-1 text-xs text-neutral-500">
            This label will appear on the node in the flow
          </p>
        </div>

        {/* Message Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-neutral-700">
              Message Content *
            </label>
            <VariablePicker
              onSelect={handleVariableSelect}
              placeholder="Insert variable"
            />
          </div>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            placeholder="Enter the message to send to the user..."
            rows={8}
            className="font-sans"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Use variables like {'{{contact.name}}'} to personalize messages
          </p>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Preview
          </label>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-neutral-200">
                  {message || (
                    <span className="text-neutral-400 italic">
                      Your message will appear here...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-primary-900 mb-2">
            💡 Tips
          </h4>
          <ul className="text-sm text-primary-800 space-y-1">
            <li>• Keep messages concise and clear</li>
            <li>• Use variables to personalize the experience</li>
            <li>• WhatsApp supports emojis and formatting</li>
            <li>• Test your flow to see how messages appear</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default MessageNodeModal;
