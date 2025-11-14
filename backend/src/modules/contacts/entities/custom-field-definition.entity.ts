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

export enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DROPDOWN = 'dropdown',
  CHECKBOX = 'checkbox',
}

@Entity('custom_field_definitions')
@Index(['tenantId', 'key'], { unique: true })
export class CustomFieldDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  key: string;

  @Column()
  label: string;

  @Column({
    type: 'enum',
    enum: CustomFieldType,
    default: CustomFieldType.TEXT,
  })
  type: CustomFieldType;

  @Column({ type: 'jsonb', nullable: true })
  options: string[]; // For dropdown type

  @Column({ default: false })
  isRequired: boolean;

  @Column({ nullable: true })
  defaultValue: string;

  @Column({ nullable: true })
  placeholder: string;

  @Column({ nullable: true })
  helpText: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
