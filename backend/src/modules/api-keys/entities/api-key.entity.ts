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
import { User } from '../../users/entities/user.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ name: 'key_hash' })
  keyHash: string;

  @Column({ name: 'key_prefix', length: 10 })
  keyPrefix: string;

  @Column({ type: 'jsonb', default: {} })
  permissions: Record<string, any>;

  @Column({ name: 'rate_limit', default: 100 })
  rateLimit: number;

  @Column({ name: 'rate_limit_window', default: 60 })
  rateLimitWindow: number;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by_user_id', nullable: true })
  createdByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Usage tracking
  @Column({ name: 'total_requests', default: 0 })
  totalRequests: number;

  @Column({ name: 'last_request_at', type: 'timestamp', nullable: true })
  lastRequestAt: Date;
}
