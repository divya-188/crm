/**
 * Core data models for the application
 */

import { UserRole } from './auth.types';

// ============================================================================
// User
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'agent' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  tenantId?: string;
  avatar?: string;
  phone?: string;
  settings?: Record<string, any>;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Contact
// ============================================================================

export interface Contact {
  id: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string; // Alias for phone
  name?: string; // Computed from firstName + lastName
  avatar?: string;
  avatarUrl?: string; // Alias for avatar
  customFields?: Record<string, any>;
  tags?: string[];
  notes?: string;
  isActive?: boolean;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string; // Alias for phone
  customFields?: Record<string, any>;
  tags?: string[];
  notes?: string;
  isActive?: boolean;
}

export interface UpdateContactDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  customFields?: Record<string, any>;
  tags?: string[];
  notes?: string;
  isActive?: boolean;
}

// ============================================================================
// Contact Segment
// ============================================================================

export interface ContactSegment {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  criteria: ContactSegmentCriteria;
  contactCount: number;
  lastCalculatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSegmentCriteria {
  logic: 'AND' | 'OR';
  conditions: SegmentCondition[];
}

export interface SegmentCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface CreateContactSegmentDto {
  name: string;
  description?: string;
  criteria: ContactSegmentCriteria;
}

export interface UpdateContactSegmentDto {
  name?: string;
  description?: string;
  criteria?: ContactSegmentCriteria;
}

// ============================================================================
// Conversation
// ============================================================================

export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'closed';

export interface Conversation {
  id: string;
  tenantId: string;
  contactId: string;
  contact?: Contact;
  whatsAppConnectionId: string;
  assignedAgentId?: string;
  assignedAgent?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  status: ConversationStatus;
  tags: string[];
  unreadCount: number;
  lastMessage?: Message;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationFilters {
  status?: ConversationStatus | 'all';
  assignedTo?: string | 'all';
  tags?: string[];
  search?: string;
}

// ============================================================================
// Message
// ============================================================================

export type MessageDirection = 'inbound' | 'outbound';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  tenantId: string;
  conversationId: string;
  whatsAppMessageId?: string;
  direction: MessageDirection;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  metadata: MessageMetadata;
  status?: MessageStatus;
  sentByUserId?: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
  latitude?: number;
  longitude?: number;
  caption?: string;
}

export interface SendMessageDto {
  conversationId: string;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  metadata?: Partial<MessageMetadata>;
}

// ============================================================================
// Template
// ============================================================================

export type TemplateCategory = 'marketing' | 'utility' | 'authentication';
export type TemplateHeaderType = 'text' | 'image' | 'video' | 'document';
export type TemplateStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'superseded';

export interface Template {
  id: string;
  tenantId: string;
  name: string;
  category: TemplateCategory;
  language: string;
  content: string;
  header?: string;
  footer?: string;
  buttons?: TemplateButton[];
  variables?: TemplateVariable[];
  externalId?: string;
  wabaId?: string;
  status: TemplateStatus;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  version: number;
  parentTemplateId?: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string;
  qualityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateButton {
  type: 'url' | 'phone' | 'quick_reply';
  text: string;
  url?: string;
  phoneNumber?: string;
}

export interface TemplateVariable {
  name: string;
  example: string;
}

export interface CreateTemplateDto {
  name: string;
  category: TemplateCategory;
  language: string;
  content: string;
  header?: string;
  footer?: string;
  buttons?: TemplateButton[];
  variables?: TemplateVariable[];
}

// ============================================================================
// Campaign
// ============================================================================

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'failed' | 'paused';

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  templateId: string;
  template?: Template;
  segmentCriteria: SegmentCriteria;
  scheduledAt?: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentCriteria {
  tags?: string[];
  customFields?: Record<string, any>;
  lastContactedBefore?: string;
  lastContactedAfter?: string;
  excludeContacts?: string[];
}

export interface CreateCampaignDto {
  name: string;
  templateId: string;
  segmentCriteria: SegmentCriteria;
  scheduledAt?: string;
}

// ============================================================================
// Flow (Chatbot)
// ============================================================================

export type FlowTriggerType = 'keyword' | 'welcome' | 'manual';
export type FlowStatus = 'draft' | 'active' | 'inactive';

export interface Flow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  triggerType: FlowTriggerType;
  triggerValue?: string;
  flowData: FlowData;
  status: FlowStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
}

export interface CreateFlowDto {
  name: string;
  description?: string;
  triggerType: FlowTriggerType;
  triggerValue?: string;
  flowData: FlowData;
}

// ============================================================================
// Automation
// ============================================================================

export type AutomationTriggerType = 'new_message' | 'keyword' | 'time_based' | 'contact_attribute_change';
export type AutomationActionType = 'send_message' | 'assign_agent' | 'add_tag' | 'update_field' | 'trigger_flow';

export interface Automation {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTrigger {
  type: AutomationTriggerType;
  config: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface AutomationAction {
  type: AutomationActionType;
  config: Record<string, any>;
}

export interface CreateAutomationDto {
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
}

// ============================================================================
// WhatsApp Connection
// ============================================================================

export type ConnectionType = 'qr' | 'meta_api';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export interface WhatsAppConnection {
  id: string;
  tenantId: string;
  phoneNumber: string;
  connectionType: ConnectionType;
  status: ConnectionStatus;
  sessionData?: Record<string, any>;
  metaCredentials?: MetaCredentials;
  lastConnectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetaCredentials {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
}

export interface CreateConnectionDto {
  phoneNumber: string;
  connectionType: ConnectionType;
  metaCredentials?: MetaCredentials;
}

// ============================================================================
// Webhook
// ============================================================================

export interface Webhook {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  status: 'active' | 'inactive';
  retryCount: number;
  timeoutSeconds: number;
  isActive: boolean;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookDto {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  retryCount?: number;
  timeoutSeconds?: number;
  isActive?: boolean;
}

export interface UpdateWebhookDto {
  name?: string;
  url?: string;
  events?: string[];
  secret?: string;
  retryCount?: number;
  timeoutSeconds?: number;
  isActive?: boolean;
}

export interface WebhookLog {
  id: string;
  tenantId: string;
  webhookId: string;
  eventType: string;
  payload: Record<string, any>;
  responseStatus: number | null;
  responseBody: string | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
  attemptCount: number;
  isSuccess: boolean;
  createdAt: string;
}

export interface WebhookStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  avgResponseTimeMs: number;
  lastTriggeredAt?: string;
}

export interface TestWebhookDto {
  eventType: string;
  payload?: Record<string, any>;
}

// ============================================================================
// Analytics
// ============================================================================

export interface DashboardMetrics {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  totalContacts: number;
  averageResponseTime: number;
  responseRate?: number;
  conversationGrowth?: number;
  contactGrowth?: number;
  messageGrowth?: number;
  responseRateChange?: number;
  conversationTrend: TrendData[];
  messageTrend: TrendData[];
  topAgents: AgentMetric[];
  conversationsByStatus: StatusMetric[];
}

export interface TrendData {
  date: string;
  value: number;
}

export interface AgentMetric {
  agentId: string;
  agentName: string;
  conversationsHandled: number;
  averageResponseTime: number;
  resolutionRate: number;
}

export interface StatusMetric {
  status: string;
  count: number;
  percentage: number;
}

// ============================================================================
// Subscription
// ============================================================================

export type BillingCycle = 'monthly' | 'quarterly' | 'annual';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: BillingCycle;
  features: PlanFeatures;
  limits: PlanLimits;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeatures {
  chatbotFlows: boolean;
  campaigns: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  advancedAnalytics: boolean;
  multipleWhatsAppNumbers: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
}

export interface PlanLimits {
  maxContacts: number;
  maxAgents: number;
  maxWhatsAppNumbers: number;
  maxCampaignsPerMonth: number;
  maxMessagesPerMonth: number;
  maxFlows: number;
  maxWebhooks: number;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paymentMethod: 'stripe' | 'paypal' | 'razorpay';
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Key
// ============================================================================

// API Key types moved to end of file (line ~700)

// ============================================================================
// Tenant
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  subdomain?: string;
  planId: string;
  status: 'active' | 'suspended' | 'cancelled';
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  timezone: string;
  language: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  features: {
    maxContacts: number;
    maxAgents: number;
    maxWhatsAppNumbers: number;
    apiAccess: boolean;
    webhooks: boolean;
    advancedAnalytics: boolean;
  };
}

// ============================================================================
// Agent/User
// ============================================================================

export interface Agent {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentDto {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password: string;
}

// ============================================================================
// Custom Field Definition
// ============================================================================

export enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DROPDOWN = 'dropdown',
  CHECKBOX = 'checkbox',
}

export interface CustomFieldDefinition {
  id: string;
  tenantId: string;
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[];
  isRequired: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomFieldDefinitionDto {
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  sortOrder?: number;
}

export interface UpdateCustomFieldDefinitionDto {
  label?: string;
  type?: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// ============================================================================
// API Key
// ============================================================================

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;
  permissions: Record<string, any>;
  rateLimit: number;
  rateLimitWindow: number;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  totalRequests: number;
  lastRequestAt?: string;
  createdBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateApiKeyDto {
  name: string;
  permissions?: Record<string, any>;
  rateLimit?: number;
  rateLimitWindow?: number;
  expiresAt?: string;
}

export interface UpdateApiKeyDto {
  name?: string;
  permissions?: Record<string, any>;
  rateLimit?: number;
  rateLimitWindow?: number;
  expiresAt?: string;
  isActive?: boolean;
}

export interface ApiKeyUsageStats {
  totalRequests: number;
  lastUsedAt?: string;
  lastRequestAt?: string;
  rateLimit: number;
  rateLimitWindow: number;
  isActive: boolean;
  expiresAt?: string;
}

export interface ApiKeyWithPlainKey extends ApiKey {
  key: string;
}
