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

export const FlowStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
} as const;

export type FlowStatusType = typeof FlowStatus[keyof typeof FlowStatus];

@Entity('flows')
@Index(['tenantId', 'status'])
export class Flow {
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

  @Column({ type: 'jsonb' })
  flowData: {
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: any;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }>;
  };

  @Column({ type: 'jsonb', nullable: true })
  triggerConfig: {
    type: 'keyword' | 'welcome' | 'manual' | 'webhook';
    keywords?: string[];
    conditions?: Record<string, any>;
  };

  @Column({
    type: 'varchar',
    default: FlowStatus.DRAFT,
  })
  status: FlowStatusType;

  @Column({ default: 1 })
  version: number;

  @Column({ nullable: true })
  parentFlowId: string;

  @Column({ default: 0 })
  executionCount: number;

  @Column({ default: 0 })
  successCount: number;

  @Column({ default: 0 })
  failureCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
