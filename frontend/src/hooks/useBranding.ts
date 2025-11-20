/**
 * useBranding Hook
 * Manages branding state and real-time updates via WebSocket
 */

import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import {
  applyBrandingToDOM,
  loadBrandingFromStorage,
  getDefaultBranding,
  type BrandingConfig,
} from '../lib/branding';
import apiClient from '../lib/api-client';

export function useBranding() {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  // Load branding on mount
  useEffect(() => {
    loadBranding();
  }, []);

  // Listen for real-time branding updates
  useEffect(() => {
    if (!socket) return;

    const handleBrandingUpdate = (data: { branding: BrandingConfig }) => {
      console.log('Received branding update:', data);
      setBranding(data.branding);
      applyBrandingToDOM(data.branding);
    };

    socket.on('branding:updated', handleBrandingUpdate);

    return () => {
      socket.off('branding:updated', handleBrandingUpdate);
    };
  }, [socket]);

  // Apply branding when it changes
  useEffect(() => {
    if (branding) {
      applyBrandingToDOM(branding);
    }
  }, [branding]);

  const loadBranding = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from localStorage first for instant application
      const cached = loadBrandingFromStorage();
      if (cached) {
        setBranding(cached);
        applyBrandingToDOM(cached);
      }

      // Fetch latest from server
      const { data } = await apiClient.get('/super-admin/settings/branding');
      setBranding(data);
      applyBrandingToDOM(data);
    } catch (err: any) {
      console.error('Failed to load branding:', err);
      setError(err.message || 'Failed to load branding');
      
      // Fallback to default branding
      const defaultBranding = getDefaultBranding();
      setBranding(defaultBranding);
      applyBrandingToDOM(defaultBranding);
    } finally {
      setLoading(false);
    }
  };

  const refreshBranding = () => {
    loadBranding();
  };

  return {
    branding,
    loading,
    error,
    refreshBranding,
  };
}
