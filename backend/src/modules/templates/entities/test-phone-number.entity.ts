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
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Entity for managing test phone numbers (max 5 per WABA)
 * Requirement 12.2, 12.7: Test phone number management
 */
@Entity('test_phone_numbers')
@Unique(['tenantId', 'phoneNumber'])
@Index(['tenantId', 'wabaId'])
export class TestPhoneNumber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  // WhatsApp Business Account ID
  @Column({ type: 'varchar', length: 255 })
  wabaId: string;

  // Phone number in E.164 format
  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  // Optional label for the phone number
  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string;

  // Whether this phone number is active
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // User who added this phone number
  @Column({ type: 'uuid', nullable: true })
  addedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'addedByUserId' })
  addedByUser: User;

  // Last time this phone number was used for testing
  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  // Number of times this phone number has been used for testing
  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
