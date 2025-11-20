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
import { Template } from './template.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';

export const TestSendStatus = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
} as const;

export type TestSendStatusType = typeof TestSendStatus[keyof typeof TestSendStatus];

/**
 * Entity for tracking template test sends
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
 */
@Entity('template_test_sends')
@Index(['templateId', 'sentAt'])
@Index(['tenantId', 'sentAt'])
export class TemplateTestSend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  templateId: string;

  @ManyToOne(() => Template, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template: Template;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  // Test phone number (E.164 format)
  @Column({ type: 'varchar', length: 20 })
  testPhoneNumber: string;

  // Actual placeholder values used in the test
  @Column({ type: 'jsonb', default: {} })
  placeholderValues: Record<string, string>;

  // Test send status
  @Column({
    type: 'varchar',
    length: 50,
    default: TestSendStatus.SENT,
  })
  status: TestSendStatusType;

  // Meta API message ID
  @Column({ type: 'varchar', length: 255, nullable: true })
  metaMessageId: string;

  // Error message if test failed
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  // Meta API response
  @Column({ type: 'jsonb', nullable: true })
  metaResponse: any;

  // User who initiated the test
  @Column({ type: 'uuid', nullable: true })
  sentByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sentByUserId' })
  sentByUser: User;

  // Timestamps
  @CreateDateColumn()
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
