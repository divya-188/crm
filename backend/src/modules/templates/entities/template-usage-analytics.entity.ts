import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Template } from './template.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('template_usage_analytics')
@Unique(['templateId', 'date'])
@Index(['templateId', 'date'])
export class TemplateUsageAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  templateId: string;

  @ManyToOne(() => Template, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template: Template;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'integer', default: 0 })
  sendCount: number;

  @Column({ type: 'integer', default: 0 })
  deliveredCount: number;

  @Column({ type: 'integer', default: 0 })
  readCount: number;

  @Column({ type: 'integer', default: 0 })
  repliedCount: number;

  @Column({ type: 'integer', default: 0 })
  failedCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  deliveryRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  readRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  responseRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
