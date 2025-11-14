import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'simple-array' })
  events: string[];

  @Column({ nullable: true })
  secret: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'retry_count', default: 3 })
  retryCount: number;

  @Column({ name: 'timeout_seconds', default: 30 })
  timeoutSeconds: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_triggered_at', type: 'timestamp', nullable: true })
  lastTriggeredAt: Date;

  @Column({ name: 'total_deliveries', default: 0 })
  totalDeliveries: number;

  @Column({ name: 'successful_deliveries', default: 0 })
  successfulDeliveries: number;

  @Column({ name: 'failed_deliveries', default: 0 })
  failedDeliveries: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
