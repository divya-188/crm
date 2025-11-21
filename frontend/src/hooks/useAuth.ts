import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api-client';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, setLoading, hasRole } =
    useAuthStore();

  // Verify authentication on mount (only once per session)
  useEffect(() => {
    const verifyAuth = async () => {
      // Skip if already verified or not authenticated
      if (!isAuthenticated || !user || isLoading) {
        return;
      }

      // Only verify once per session
      const hasVerified = sessionStorage.getItem('auth_verified');
      if (hasVerified) {
        return;
      }

      try {
        setLoading(true);
        const profile = await authService.getProfile();
        setAuth(profile, useAuthStore.getState().accessToken!, useAuthStore.getState().refreshToken!);
        sessionStorage.setItem('auth_verified', 'true');
      } catch (error: any) {
        // Don't clear auth on rate limit errors
        if (error?.response?.status === 429) {
          console.warn('Rate limited - skipping auth verification');
          sessionStorage.setItem('auth_verified', 'true'); // Mark as verified to prevent retry
          return;
        }
        console.error('Failed to verify authentication:', getErrorMessage(error));
        clearAuth();
        sessionStorage.removeItem('auth_verified');
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      setAuth(response.user, response.tokens.accessToken, response.tokens.refreshToken);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantName: string;
  }) => {
    setLoading(true);
    try {
      const response = await authService.register(data);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', getErrorMessage(error));
    } finally {
      clearAuth();
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    hasRole,
    login,
    register,
    logout,
  };
};
