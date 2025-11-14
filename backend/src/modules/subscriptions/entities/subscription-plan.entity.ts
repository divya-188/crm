import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'monthly' })
  billingCycle: string; // monthly, yearly

  @Column({ type: 'jsonb' })
  features: {
    maxContacts: number;
    maxUsers: number;
    maxConversations: number;
    maxCampaigns: number;
    maxFlows: number;
    maxAutomations: number;
    whatsappConnections: number;
    apiAccess: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
