import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

export const AutomationStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
} as const;

export type AutomationStatusType = typeof AutomationStatus[keyof typeof AutomationStatus];

export const TriggerType = {
  MESSAGE_RECEIVED: 'message_received',
  CONVERSATION_CREATED: 'conversation_created',
  CONVERSATION_ASSIGNED: 'conversation_assigned',
  TAG_ADDED: 'tag_added',
  CONTACT_CREATED: 'contact_created',
  CONTACT_UPDATED: 'contact_updated',
  SCHEDULED: 'scheduled',
} as const;

export type TriggerTypeType = typeof TriggerType[keyof typeof TriggerType];

export const ActionType = {
  SEND_MESSAGE: 'send_message',
  ASSIGN_CONVERSATION: 'assign_conversation',
  ADD_TAG: 'add_tag',
  REMOVE_TAG: 'remove_tag',
  UPDATE_CONTACT: 'update_contact',
  TRIGGER_FLOW: 'trigger_flow',
  SEND_EMAIL: 'send_email',
  WEBHOOK: 'webhook',
} as const;

export type ActionTypeType = typeof ActionType[keyof typeof ActionType];

@Entity('automations')
@Index(['tenantId', 'status'])
export class Automation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
  })
  triggerType: TriggerTypeType;

  @Column({ type: 'jsonb', nullable: true })
  triggerConfig: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;

  @Column({ type: 'jsonb' })
  actions: Array<{
    type: ActionTypeType;
    config: Record<string, any>;
  }>;

  @Column({
    type: 'varchar',
    default: AutomationStatus.DRAFT,
  })
  status: AutomationStatusType;

  @Column({ default: 0 })
  executionCount: number;

  @Column({ default: 0 })
  successCount: number;

  @Column({ default: 0 })
  failureCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastExecutedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
