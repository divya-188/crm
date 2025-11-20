import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../ui/Card';
import Switch from '../ui/Switch';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Toast from '@/lib/toast-system';
import settingsService from '../../services/settings.service';
import { Bell } from 'lucide-react';

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    newMessage: true,
    newConversation: true,
    assignedConversation: true,
    mentionedInNote: true,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
  });

  useEffect(() => {
    if (settings?.notifications) {
      setNotifications({
        email: settings.notifications.email ?? true,
        push: settings.notifications.push ?? true,
        newMessage: settings.notifications.newMessage ?? true,
        newConversation: settings.notifications.newConversation ?? true,
        assignedConversation: settings.notifications.assignedConversation ?? true,
        mentionedInNote: settings.notifications.mentionedInNote ?? true,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      Toast.success('Notification preferences updated');
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to update preferences');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ notifications });
  };

  const handleToggle = (field: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Notification Preferences</h2>
          <p className="text-sm text-neutral-600">Manage how you receive notifications</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notification Channels */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">Email Notifications</p>
                <p className="text-sm text-neutral-600">Receive notifications via email</p>
              </div>
              <Switch
                checked={notifications.email}
                onChange={() => handleToggle('email')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">Push Notifications</p>
                <p className="text-sm text-neutral-600">Receive push notifications in browser</p>
              </div>
              <Switch
                checked={notifications.push}
                onChange={() => handleToggle('push')}
              />
            </div>
          </div>
        </div>

        {/* Event Notifications */}
        <div className="pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Event Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">New Messages</p>
                <p className="text-sm text-neutral-600">Get notified when you receive a new message</p>
              </div>
              <Switch
                checked={notifications.newMessage}
                onChange={() => handleToggle('newMessage')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">New Conversations</p>
                <p className="text-sm text-neutral-600">Get notified when a new conversation starts</p>
              </div>
              <Switch
                checked={notifications.newConversation}
                onChange={() => handleToggle('newConversation')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">Assigned Conversations</p>
                <p className="text-sm text-neutral-600">Get notified when a conversation is assigned to you</p>
              </div>
              <Switch
                checked={notifications.assignedConversation}
                onChange={() => handleToggle('assignedConversation')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">Mentioned in Notes</p>
                <p className="text-sm text-neutral-600">Get notified when someone mentions you in a note</p>
              </div>
              <Switch
                checked={notifications.mentionedInNote}
                onChange={() => handleToggle('mentionedInNote')}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (settings?.notifications) {
                setNotifications({
                  email: settings.notifications.email ?? true,
                  push: settings.notifications.push ?? true,
                  newMessage: settings.notifications.newMessage ?? true,
                  newConversation: settings.notifications.newConversation ?? true,
                  assignedConversation: settings.notifications.assignedConversation ?? true,
                  mentionedInNote: settings.notifications.mentionedInNote ?? true,
                });
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
