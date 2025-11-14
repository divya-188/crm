import apiClient from '@/lib/api-client';
import { LoginCredentials, RegisterData, User } from '@/types/auth.types';

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post(
      '/auth/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  }

  /**
   * Request password reset
   * Note: Backend endpoint needs to be implemented
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/forgot-password', data);
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist yet, return a helpful message
      if (error.response?.status === 404) {
        return {
          message: 'Password reset functionality will be available soon. Please contact support.',
        };
      }
      throw error;
    }
  }

  /**
   * Reset password with token
   * Note: Backend endpoint needs to be implemented
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist yet, return a helpful message
      if (error.response?.status === 404) {
        return {
          message: 'Password reset functionality will be available soon. Please contact support.',
        };
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
