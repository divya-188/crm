import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export const TenantStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TRIAL: 'trial',
  EXPIRED: 'expired',
} as const;

export type TenantStatusType = typeof TenantStatus[keyof typeof TenantStatus];

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  domain: string;

  @Column({
    type: 'varchar',
    default: TenantStatus.TRIAL,
  })
  status: TenantStatusType;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  limits: {
    maxUsers?: number;
    maxContacts?: number;
    maxMessages?: number;
    maxWhatsAppConnections?: number;
  };

  @Column({ nullable: true })
  subscriptionPlanId: string;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEndsAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  quotaWarnings: Record<string, Record<string, Date>>;

  @Column({ type: 'boolean', default: false })
  whiteLabelEnabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  branding: {
    logoUrl?: string;
    faviconUrl?: string;
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
      text?: string;
    };
    typography?: {
      fontFamily?: string;
      headingFont?: string;
      fontSize?: Record<string, string>;
    };
    customCss?: string;
    companyName?: string;
    tagline?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  teamSettings: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  integrationSettings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
