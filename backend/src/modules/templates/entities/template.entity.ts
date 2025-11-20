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

export const TemplateStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUPERSEDED: 'superseded',
} as const;

export type TemplateStatusType = typeof TemplateStatus[keyof typeof TemplateStatus];

export const TemplateCategory = {
  TRANSACTIONAL: 'TRANSACTIONAL',
  UTILITY: 'UTILITY',
  MARKETING: 'MARKETING',
  ACCOUNT_UPDATE: 'ACCOUNT_UPDATE',
  OTP: 'OTP',
  // Legacy support
  marketing: 'marketing',
  utility: 'utility',
  authentication: 'authentication',
} as const;

export type TemplateCategoryType = typeof TemplateCategory[keyof typeof TemplateCategory];

export const TemplateLanguage = {
  EN: 'en',
  EN_US: 'en_US',
  ES: 'es',
  PT_BR: 'pt_BR',
  FR: 'fr',
  DE: 'de',
  IT: 'it',
  AR: 'ar',
  HI: 'hi',
} as const;

export type TemplateLanguageType = typeof TemplateLanguage[keyof typeof TemplateLanguage];

@Entity('templates')
@Index(['tenantId', 'status'])
export class Template {
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName: string;

  @Column({
    type: 'varchar',
  })
  category: TemplateCategoryType;

  @Column({
    type: 'varchar',
    default: TemplateLanguage.EN,
  })
  language: TemplateLanguageType;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Legacy field - kept for backward compatibility
  @Column({ type: 'text', nullable: true })
  content: string;

  // New structured components field
  @Column({ type: 'jsonb', default: {} })
  components: {
    header?: {
      type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
      text?: string;
      mediaUrl?: string;
      mediaHandle?: string;
    };
    body: {
      text: string;
      placeholders: Array<{
        index: number;
        example: string;
      }>;
    };
    footer?: {
      text: string;
    };
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
      text: string;
      url?: string;
      phoneNumber?: string;
    }>;
  };

  @Column({ type: 'jsonb', default: {} })
  sampleValues: Record<string, string>;

  // Legacy fields - kept for backward compatibility
  @Column({ type: 'jsonb', nullable: true })
  variables: Array<{
    name: string;
    example: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  buttons: Array<{
    type: string;
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;

  @Column({ type: 'text', nullable: true })
  header: string;

  @Column({ type: 'text', nullable: true })
  footer: string;

  // Meta Integration
  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTemplateId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTemplateName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  wabaId: string;

  // Status Management
  @Column({
    type: 'varchar',
    default: TemplateStatus.DRAFT,
  })
  status: TemplateStatusType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  approvalStatus: string;

  // Legacy field - kept for backward compatibility
  @Column({ nullable: true })
  externalId: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  // Versioning
  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true })
  parentTemplateId: string;

  @ManyToOne(() => Template, { nullable: true })
  @JoinColumn({ name: 'parentTemplateId' })
  parentTemplate: Template;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Usage Tracking
  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  // Quality Metrics
  @Column({ type: 'integer', nullable: true })
  qualityScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  deliveryRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  readRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  responseRate: number;

  // Audit Fields
  @Column({ type: 'uuid', nullable: true })
  createdByUserId: string;

  @Column({ type: 'uuid', nullable: true })
  updatedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
