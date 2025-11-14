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
import { Template } from '../../templates/entities/template.entity';

export const CampaignStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type CampaignStatusType = typeof CampaignStatus[keyof typeof CampaignStatus];

@Entity('campaigns')
@Index(['tenantId', 'status'])
export class Campaign {
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

  @Column({ nullable: true })
  templateId: string;

  @ManyToOne(() => Template, { nullable: true })
  @JoinColumn({ name: 'templateId' })
  template: Template;

  @Column({ type: 'jsonb' })
  segmentFilters: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  variableMapping: Record<string, string>;

  @Column({
    type: 'varchar',
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatusType;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ default: 0 })
  totalRecipients: number;

  @Column({ default: 0 })
  sentCount: number;

  @Column({ default: 0 })
  deliveredCount: number;

  @Column({ default: 0 })
  readCount: number;

  @Column({ default: 0 })
  failedCount: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
