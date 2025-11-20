import { useState } from 'react';
import {
  Mail,
  Phone,
  Calendar,
  Tag,
  Edit,
  MessageSquare,
  User,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { Contact } from '@/types/models.types';
import { ContactForm } from './ContactForm';
import { useNavigate } from 'react-router-dom';

interface ContactDetailModalProps {
  contact: Contact;
  onClose: () => void;
}

export const ContactDetailModal = ({ contact, onClose }: ContactDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const displayName =
    contact.name ||
    (contact.firstName && contact.lastName
      ? `${contact.firstName} ${contact.lastName}`
      : contact.firstName || contact.lastName) ||
    contact.email ||
    contact.phone ||
    contact.phoneNumber ||
    'Unknown Contact';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleEditSuccess = () => {
    setIsEditing(false);
  };

  const handleStartConversation = () => {
    // Navigate to inbox with this contact
    navigate(`/inbox?contact=${contact.id}`);
    onClose();
  };

  if (isEditing) {
    return (
      <Modal
        isOpen={true}
        onClose={() => setIsEditing(false)}
        title="Edit Contact"
        size="lg"
      >
        <ContactForm contact={contact} onSuccess={handleEditSuccess} />
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Contact Details" size="lg">
      <div className="space-y-6">
        {/* Header with Avatar */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-primary-600 flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
            {contact.avatarUrl || contact.avatar ? (
              <img
                src={contact.avatarUrl || contact.avatar}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {displayName}
            </h2>
            {contact.lastContactedAt && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Last contacted: {new Date(contact.lastContactedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Contact Information */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            {(contact.phone || contact.phoneNumber) && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-gray-900 dark:text-white">
                    {contact.phone || contact.phoneNumber}
                  </p>
                </div>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white">{contact.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-gray-900 dark:text-white">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="primary">
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Custom Fields */}
        {contact.customFields && Object.keys(contact.customFields).length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Custom Fields
              </h3>
            </div>
            <div className="space-y-2">
              {Object.entries(contact.customFields).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {key}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleStartConversation} className="flex-1">
            <MessageSquare className="w-4 h-4 mr-2" />
            Start Conversation
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
