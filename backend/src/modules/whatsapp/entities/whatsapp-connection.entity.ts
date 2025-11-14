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

export const ConnectionType = {
  META_API: 'meta_api',
  BAILEYS: 'baileys',
} as const;

export type ConnectionTypeType = typeof ConnectionType[keyof typeof ConnectionType];

export const ConnectionStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  FAILED: 'failed',
} as const;

export type ConnectionStatusType = typeof ConnectionStatus[keyof typeof ConnectionStatus];

@Entity('whatsapp_connections')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'createdAt'])
export class WhatsAppConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  @Index()
  name: string;

  @Column({
    type: 'varchar',
  })
  @Index()
  type: ConnectionTypeType;

  @Column({
    type: 'varchar',
    default: ConnectionStatus.DISCONNECTED,
  })
  status: ConnectionStatusType;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  phoneNumberId: string;

  @Column({ nullable: true })
  businessAccountId: string;

  @Column({ type: 'text', nullable: true })
  accessToken: string;

  @Column({ type: 'jsonb', nullable: true })
  sessionData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  qrCode: string;

  @Column({ type: 'timestamp', nullable: true })
  lastConnectedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastDisconnectedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
