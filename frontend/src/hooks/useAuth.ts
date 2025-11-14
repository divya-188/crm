import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api-client';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, setLoading, hasRole } =
    useAuthStore();

  // Verify authentication on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (isAuthenticated && user) {
        try {
          setLoading(true);
          const profile = await authService.getProfile();
          setAuth(profile, useAuthStore.getState().accessToken!, useAuthStore.getState().refreshToken!);
        } catch (error) {
          console.error('Failed to verify authentication:', getErrorMessage(error));
          clearAuth();
        } finally {
          setLoading(false);
        }
      }
    };

    verifyAuth();
  }, []);

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
