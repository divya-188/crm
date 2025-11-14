import apiClient from '../lib/api-client';

export interface ProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserSettings {
  timezone?: string;
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    newMessage?: boolean;
    newConversation?: boolean;
    assignedConversation?: boolean;
    mentionedInNote?: boolean;
  };
  preferences?: Record<string, any>;
}

export interface BusinessProfile {
  businessName?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  businessHours?: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };
}

export interface Branding {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}

const settingsService = {
  // Profile
  getProfile: async () => {
    const response = await apiClient.get('/users/me/profile');
    return response.data;
  },

  updateProfile: async (data: ProfileData) => {
    const response = await apiClient.patch('/users/me/profile', data);
    return response.data;
  },

  // Password
  changePassword: async (data: PasswordData) => {
    const response = await apiClient.post('/users/me/change-password', data);
    return response.data;
  },

  // User Settings
  getSettings: async () => {
    const response = await apiClient.get('/users/me/settings');
    return response.data;
  },

  updateSettings: async (data: UserSettings) => {
    const response = await apiClient.patch('/users/me/settings', data);
    return response.data;
  },

  // Business Profile
  getBusinessProfile: async () => {
    const response = await apiClient.get('/tenants/me/business-profile');
    return response.data;
  },

  updateBusinessProfile: async (data: BusinessProfile) => {
    const response = await apiClient.patch('/tenants/me/business-profile', data);
    return response.data;
  },

  // Branding
  getBranding: async () => {
    const response = await apiClient.get('/tenants/me/branding');
    return response.data;
  },

  updateBranding: async (data: Branding) => {
    const response = await apiClient.patch('/tenants/me/branding', data);
    return response.data;
  },
};

export default settingsService;
