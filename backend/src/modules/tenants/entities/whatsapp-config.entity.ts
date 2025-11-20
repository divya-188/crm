import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('whatsapp_configs')
@Index(['tenantId'])
export class WhatsAppConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'phone_number_id', length: 255 })
  phoneNumberId: string;

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string;

  @Column({ name: 'business_account_id', length: 255 })
  businessAccountId: string;

  @Column({ name: 'webhook_secret', length: 255 })
  webhookSecret: string;

  @Column({ name: 'webhook_url', type: 'text' })
  webhookUrl: string;

  @Column({ 
    type: 'enum', 
    enum: ['connected', 'disconnected', 'pending'],
    default: 'pending'
  })
  status: 'connected' | 'disconnected' | 'pending';

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_tested_at', type: 'timestamp', nullable: true })
  lastTestedAt: Date;

  @Column({ name: 'test_result', type: 'text', nullable: true })
  testResult: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
