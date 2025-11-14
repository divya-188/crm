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
} as const;

export type TemplateStatusType = typeof TemplateStatus[keyof typeof TemplateStatus];

export const TemplateCategory = {
  MARKETING: 'marketing',
  UTILITY: 'utility',
  AUTHENTICATION: 'authentication',
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

  @Column({
    type: 'varchar',
  })
  category: TemplateCategoryType;

  @Column({
    type: 'varchar',
    default: TemplateLanguage.EN,
  })
  language: TemplateLanguageType;

  @Column({ type: 'text' })
  content: string;

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

  @Column({
    type: 'varchar',
    default: TemplateStatus.DRAFT,
  })
  status: TemplateStatusType;

  @Column({ nullable: true })
  externalId: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
