import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum WebhookEventType {
  MESSAGE_STATUS = 'message_status',
  INCOMING_MESSAGE = 'incoming_message',
  TEMPLATE_STATUS = 'template_status',
  ACCOUNT_UPDATE = 'account_update',
  TEMPLATE_QUALITY = 'template_quality',
}

@Entity('webhook_logs')
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: WebhookEventType,
  })
  eventType: WebhookEventType;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ nullable: true })
  signature: string;

  @Column({ default: false })
  processed: boolean;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
