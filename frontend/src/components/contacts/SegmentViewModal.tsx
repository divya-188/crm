import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { ContactSegment, Contact } from '@/types/models.types';
import { contactsService } from '@/services';
import Toast from '@/lib/toast-system';
import { fadeInUp, staggerContainer } from '@/lib/motion-variants';

interface SegmentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  segment: ContactSegment | null;
}

export const SegmentViewModal = ({
  isOpen,
  onClose,
  segment,
}: SegmentViewModalProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (segment && isOpen) {
      loadContacts();
    }
  }, [segment, isOpen, page]);

  const loadContacts = async () => {
    if (!segment) return;

    setIsLoading(true);
    try {
      const result = await contactsService.getSegmentContacts(segment.id, { page, limit });
      setContacts(result.data);
      setTotal(result.total);
    } catch (error) {
      Toast.error('Failed to load segment contacts');
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!segment) return null;

  const totalPages = Math.ceil(total / limit);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={segment.name}
      size="xl"
    >
      <div className="space-y-6">
        {/* Segment Info */}
        <div className="space-y-3">
          {segment.description && (
            <p className="text-gray-600 dark:text-gray-400">{segment.description}</p>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {segment.contactCount} contacts
              </span>
            </div>
            <Badge variant="secondary">
              {segment.criteria.logic}
            </Badge>
            <Badge variant="secondary">
              {segment.criteria.conditions.length} conditions
            </Badge>
          </div>

          {/* Criteria Display */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Segment Criteria:
            </h4>
            <div className="space-y-2">
              {segment.criteria.conditions.map((condition, index) => (
                <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{condition.field}</span>{' '}
                  <span className="text-gray-500">{condition.operator}</span>{' '}
                  {condition.value && (
                    <span className="font-medium">
                      {Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Contacts List */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Contacts in this segment:
          </h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : contacts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No contacts match this segment criteria
              </p>
            </Card>
          ) : (
            <>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-2 max-h-96 overflow-y-auto"
              >
                {contacts.map((contact) => (
                  <ContactItem key={contact.id} contact={contact} />
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Contact Item Component
interface ContactItemProps {
  contact: Contact;
}

const ContactItem = ({ contact }: ContactItemProps) => {
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

  return (
    <motion.div variants={fadeInUp}>
      <Card className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
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

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {displayName}
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {contact.email && <span className="truncate">{contact.email}</span>}
              {contact.email && (contact.phone || contact.phoneNumber) && <span>•</span>}
              {(contact.phone || contact.phoneNumber) && (
                <span>{contact.phone || contact.phoneNumber}</span>
              )}
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex gap-1">
              {contact.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {contact.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{contact.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
