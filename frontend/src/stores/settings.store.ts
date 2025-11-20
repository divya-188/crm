/**
 * Settings Store
 * Manages application-wide settings state with Zustand
 */

import { create } from 'zustand';
import { BrandingConfig } from '../lib/branding';

interface PaymentGatewaySettings {
  mode: 'test' | 'live';
  defaultProvider: 'stripe' | 'paypal' | 'razorpay';
  stripe?: {
    enabled: boolean;
    publishableKey: string;
  };
  paypal?: {
    enabled: boolean;
    clientId: string;
  };
  razorpay?: {
    enabled: boolean;
    keyId: string;
  };
}

interface EmailSettings {
  smtp: {
    host: string;
    port: number;
    useSsl: boolean;
    user: string;
  };
  fromEmail: string;
  fromName: string;
}

interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  sessionTimeout: number;
  twoFactorEnabled: boolean;
  auditLogging: boolean;
}

interface WhatsAppSettings {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookToken: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface TeamSettings {
  defaultRole: string;
  autoAssignment: boolean;
  assignmentStrategy: 'round-robin' | 'least-active' | 'manual';
  departments: string[];
}

interface BillingSettings {
  billingInfo: {
    companyName: string;
    taxId: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  paymentMethod: {
    type: 'card' | 'bank';
    last4: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
}

interface IntegrationsSettings {
  apiKeys: {
    enabled: boolean;
    count: number;
  };
  webhooks: {
    enabled: boolean;
    count: number;
  };
  oauth: {
    google: boolean;
    microsoft: boolean;
    slack: boolean;
  };
}

interface AvailabilitySettings {
  status: 'available' | 'away' | 'busy' | 'offline';
  workingHours?: {
    [day: string]: { enabled: boolean; start: string; end: string };
  };
  autoReply?: {
    enabled: boolean;
    awayMessage?: string;
    offlineMessage?: string;
  };
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  inbox?: {
    viewMode: 'list' | 'compact' | 'comfortable';
    sortBy: 'recent' | 'unread' | 'priority';
    showAvatars: boolean;
    showPreviews: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  conversation?: {
    showTimestamps: boolean;
    timestampFormat: '12h' | '24h';
    showReadReceipts: boolean;
    enterToSend: boolean;
    showTypingIndicator: boolean;
  };
  keyboard?: {
    enabled: boolean;
    shortcuts: Record<string, string>;
  };
}

interface SettingsState {
  // Platform settings (Super Admin)
  platformBranding: BrandingConfig | null;
  paymentGateways: PaymentGatewaySettings | null;
  emailConfig: EmailSettings | null;
  securityConfig: SecuritySettings | null;

  // Tenant settings (Admin)
  tenantBranding: BrandingConfig | null;
  whatsappConfig: WhatsAppSettings | null;
  teamSettings: TeamSettings | null;
  billingSettings: BillingSettings | null;
  integrationsSettings: IntegrationsSettings | null;

  // User settings (All roles)
  availabilitySettings: AvailabilitySettings | null;
  userPreferences: UserPreferences | null;

  // Loading states
  loading: {
    branding: boolean;
    payment: boolean;
    email: boolean;
    security: boolean;
    whatsapp: boolean;
    team: boolean;
    billing: boolean;
    integrations: boolean;
    availability: boolean;
    preferences: boolean;
  };

  // Last update timestamps
  lastUpdated: {
    branding?: string;
    payment?: string;
    email?: string;
    security?: string;
    whatsapp?: string;
    team?: string;
    billing?: string;
    integrations?: string;
    availability?: string;
    preferences?: string;
  };

  // Actions
  setPlatformBranding: (branding: BrandingConfig) => void;
  setPaymentGateways: (settings: PaymentGatewaySettings) => void;
  setEmailConfig: (settings: EmailSettings) => void;
  setSecurityConfig: (settings: SecuritySettings) => void;
  setTenantBranding: (branding: BrandingConfig) => void;
  setWhatsAppConfig: (settings: WhatsAppSettings) => void;
  setTeamSettings: (settings: TeamSettings) => void;
  setBillingSettings: (settings: BillingSettings) => void;
  setIntegrationsSettings: (settings: IntegrationsSettings) => void;
  setAvailabilitySettings: (settings: AvailabilitySettings) => void;
  setUserPreferences: (preferences: UserPreferences) => void;

  setLoading: (key: keyof SettingsState['loading'], value: boolean) => void;
  setLastUpdated: (key: string, timestamp: string) => void;

  // WebSocket event handlers
  handleSettingsUpdate: (type: string, data: any, timestamp?: string) => void;
  
  // Cache management
  clearCache: () => void;
  refreshSettings: (type?: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  platformBranding: null,
  paymentGateways: null,
  emailConfig: null,
  securityConfig: null,
  tenantBranding: null,
  whatsappConfig: null,
  teamSettings: null,
  billingSettings: null,
  integrationsSettings: null,
  availabilitySettings: null,
  userPreferences: null,

  loading: {
    branding: false,
    payment: false,
    email: false,
    security: false,
    whatsapp: false,
    team: false,
    billing: false,
    integrations: false,
    availability: false,
    preferences: false,
  },

  lastUpdated: {},

  // Actions
  setPlatformBranding: (branding) => set({ platformBranding: branding }),
  setPaymentGateways: (settings) => set({ paymentGateways: settings }),
  setEmailConfig: (settings) => set({ emailConfig: settings }),
  setSecurityConfig: (settings) => set({ securityConfig: settings }),
  setTenantBranding: (branding) => set({ tenantBranding: branding }),
  setWhatsAppConfig: (settings) => set({ whatsappConfig: settings }),
  setTeamSettings: (settings) => set({ teamSettings: settings }),
  setBillingSettings: (settings) => set({ billingSettings: settings }),
  setIntegrationsSettings: (settings) => set({ integrationsSettings: settings }),
  setAvailabilitySettings: (settings) => set({ availabilitySettings: settings }),
  setUserPreferences: (preferences) => set({ userPreferences: preferences }),

  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),

  setLastUpdated: (key, timestamp) =>
    set((state) => ({
      lastUpdated: { ...state.lastUpdated, [key]: timestamp },
    })),

  // WebSocket event handler
  handleSettingsUpdate: (type, data, timestamp) => {
    const updateTimestamp = timestamp || new Date().toISOString();
    
    switch (type) {
      case 'branding':
        set({ 
          platformBranding: data,
          lastUpdated: { ...get().lastUpdated, branding: updateTimestamp }
        });
        break;
      case 'payment':
        set({ 
          paymentGateways: data,
          lastUpdated: { ...get().lastUpdated, payment: updateTimestamp }
        });
        break;
      case 'email':
        set({ 
          emailConfig: data,
          lastUpdated: { ...get().lastUpdated, email: updateTimestamp }
        });
        break;
      case 'security':
        set({ 
          securityConfig: data,
          lastUpdated: { ...get().lastUpdated, security: updateTimestamp }
        });
        break;
      case 'whatsapp':
        set({ 
          whatsappConfig: data,
          lastUpdated: { ...get().lastUpdated, whatsapp: updateTimestamp }
        });
        break;
      case 'team':
        set({ 
          teamSettings: data,
          lastUpdated: { ...get().lastUpdated, team: updateTimestamp }
        });
        break;
      case 'billing':
        set({ 
          billingSettings: data,
          lastUpdated: { ...get().lastUpdated, billing: updateTimestamp }
        });
        break;
      case 'integrations':
        set({ 
          integrationsSettings: data,
          lastUpdated: { ...get().lastUpdated, integrations: updateTimestamp }
        });
        break;
      case 'availability':
        set({ 
          availabilitySettings: data,
          lastUpdated: { ...get().lastUpdated, availability: updateTimestamp }
        });
        break;
      case 'preferences':
        set({ 
          userPreferences: data,
          lastUpdated: { ...get().lastUpdated, preferences: updateTimestamp }
        });
        break;
      default:
        console.warn('Unknown settings type:', type);
    }
  },

  // Cache management
  clearCache: () => {
    set({
      platformBranding: null,
      paymentGateways: null,
      emailConfig: null,
      securityConfig: null,
      tenantBranding: null,
      whatsappConfig: null,
      teamSettings: null,
      billingSettings: null,
      integrationsSettings: null,
      availabilitySettings: null,
      userPreferences: null,
      lastUpdated: {},
    });
  },

  refreshSettings: async (type) => {
    // This will be implemented by the consuming component
    // to fetch fresh settings from the API
    console.log('Refresh settings:', type);
  },
}));
