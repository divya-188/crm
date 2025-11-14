/**
 * Centralized export for all TypeScript types
 */

// Auth types
export type { User, UserRole, AuthState, LoginCredentials, RegisterData, AuthResponse } from './auth.types';

// API types
export type {
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginatedResponse,
  FilterOperator,
  Filter,
  DateRange,
  QueryOptions,
} from './api.types';

// Model types
export type {
  // Contact
  Contact,
  CreateContactDto,
  UpdateContactDto,
  
  // Conversation
  ConversationStatus,
  Conversation,
  ConversationFilters,
  
  // Message
  MessageDirection,
  MessageType,
  MessageStatus,
  Message,
  MessageMetadata,
  SendMessageDto,
  
  // Template
  TemplateCategory,
  TemplateHeaderType,
  TemplateApprovalStatus,
  Template,
  TemplateButton,
  TemplateVariable,
  CreateTemplateDto,
  
  // Campaign
  CampaignStatus,
  Campaign,
  SegmentCriteria,
  CreateCampaignDto,
  
  // Flow
  FlowTriggerType,
  FlowStatus,
  Flow,
  FlowData,
  FlowNode,
  FlowEdge,
  CreateFlowDto,
  
  // Automation
  AutomationTriggerType,
  AutomationActionType,
  Automation,
  AutomationTrigger,
  AutomationCondition,
  AutomationAction,
  CreateAutomationDto,
  
  // WhatsApp Connection
  ConnectionType,
  ConnectionStatus,
  WhatsAppConnection,
  MetaCredentials,
  CreateConnectionDto,
  
  // Webhook
  Webhook,
  CreateWebhookDto,
  
  // Analytics
  DashboardMetrics,
  TrendData,
  AgentMetric,
  StatusMetric,
  
  // Subscription
  BillingCycle,
  SubscriptionStatus,
  SubscriptionPlan,
  PlanFeatures,
  PlanLimits,
  Subscription,
  
  // API Key
  ApiKey,
  ApiKeyPermissions,
  CreateApiKeyDto,
  
  // Tenant
  Tenant,
  TenantSettings,
  
  // Agent
  Agent,
  CreateAgentDto,
} from './models.types';
