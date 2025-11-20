/**
 * useSettingsSync Hook
 * Manages real-time synchronization of all settings via WebSocket
 */

import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { applyBrandingToDOM, type BrandingConfig } from '../lib/branding';
import { useSettingsStore } from '../stores/settings.store';
import toast from '../lib/toast';

interface SettingsUpdateEvent {
  type: 'branding' | 'payment' | 'email' | 'security' | 'whatsapp' | 'team' | 'billing' | 'integrations' | 'availability' | 'preferences';
  data: any;
  updatedBy?: string;
  timestamp: string;
}

export function useSettingsSync() {
  const socket = useSocket();
  const handleStoreUpdate = useSettingsStore((state) => state.handleSettingsUpdate);

  useEffect(() => {
    if (!socket) return;

    // Handle branding updates
    const handleBrandingUpdate = (event: SettingsUpdateEvent) => {
      console.log('Settings updated:', event);
      
      if (event.type === 'branding') {
        const branding = event.data as BrandingConfig;
        applyBrandingToDOM(branding);
        
        // Show notification
        toast.success('Branding updated', {
          description: 'The platform branding has been updated.',
        });
      }
    };

    // Handle payment gateway updates
    const handlePaymentUpdate = (event: SettingsUpdateEvent) => {
      console.log('Payment settings updated:', event);
      
      toast.info('Payment settings updated', {
        description: 'Payment gateway configuration has been updated.',
      });
    };

    // Handle email configuration updates
    const handleEmailUpdate = (event: SettingsUpdateEvent) => {
      console.log('Email settings updated:', event);
      
      toast.info('Email settings updated', {
        description: 'Email configuration has been updated.',
      });
    };

    // Handle security settings updates
    const handleSecurityUpdate = (event: SettingsUpdateEvent) => {
      console.log('Security settings updated:', event);
      
      toast.warning('Security settings updated', {
        description: 'Security policies have been updated. Please review the changes.',
      });
    };

    // Handle WhatsApp configuration updates
    const handleWhatsAppUpdate = (event: SettingsUpdateEvent) => {
      console.log('WhatsApp settings updated:', event);
      
      toast.info('WhatsApp settings updated', {
        description: 'WhatsApp configuration has been updated.',
      });
    };

    // Handle team settings updates
    const handleTeamUpdate = (event: SettingsUpdateEvent) => {
      console.log('Team settings updated:', event);
      
      toast.info('Team settings updated', {
        description: 'Team configuration has been updated.',
      });
    };

    // Handle billing settings updates
    const handleBillingUpdate = (event: SettingsUpdateEvent) => {
      console.log('Billing settings updated:', event);
      
      toast.info('Billing settings updated', {
        description: 'Billing configuration has been updated.',
      });
    };

    // Handle integrations settings updates
    const handleIntegrationsUpdate = (event: SettingsUpdateEvent) => {
      console.log('Integrations settings updated:', event);
      
      toast.info('Integrations updated', {
        description: 'Integration settings have been updated.',
      });
    };

    // Handle availability settings updates
    const handleAvailabilityUpdate = (event: SettingsUpdateEvent) => {
      console.log('Availability settings updated:', event);
      
      toast.info('Availability updated', {
        description: 'Your availability settings have been updated.',
      });
    };

    // Handle preferences settings updates
    const handlePreferencesUpdate = (event: SettingsUpdateEvent) => {
      console.log('Preferences settings updated:', event);
      
      toast.info('Preferences updated', {
        description: 'Your preferences have been updated.',
      });
    };

    // Generic settings update handler
    const handleSettingsUpdate = (event: SettingsUpdateEvent) => {
      // Update store with timestamp
      handleStoreUpdate(event.type, event.data, event.timestamp);

      // Handle UI updates and notifications
      switch (event.type) {
        case 'branding':
          handleBrandingUpdate(event);
          break;
        case 'payment':
          handlePaymentUpdate(event);
          break;
        case 'email':
          handleEmailUpdate(event);
          break;
        case 'security':
          handleSecurityUpdate(event);
          break;
        case 'whatsapp':
          handleWhatsAppUpdate(event);
          break;
        case 'team':
          handleTeamUpdate(event);
          break;
        case 'billing':
          handleBillingUpdate(event);
          break;
        case 'integrations':
          handleIntegrationsUpdate(event);
          break;
        case 'availability':
          handleAvailabilityUpdate(event);
          break;
        case 'preferences':
          handlePreferencesUpdate(event);
          break;
        default:
          console.log('Unknown settings update type:', event.type);
      }
    };

    // Subscribe to settings updates
    socket.on('settings:updated', handleSettingsUpdate);

    // Also listen to specific branding updates for backward compatibility
    socket.on('branding:updated', (data: { branding: BrandingConfig }) => {
      applyBrandingToDOM(data.branding);
      toast.success('Branding updated');
    });

    return () => {
      socket.off('settings:updated', handleSettingsUpdate);
      socket.off('branding:updated');
    };
  }, [socket]);
}
