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
import { Conversation } from './conversation.entity';

export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  LOCATION: 'location',
  CONTACT: 'contact',
  STICKER: 'sticker',
} as const;

export type MessageTypeType = typeof MessageType[keyof typeof MessageType];

export const MessageDirection = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
} as const;

export type MessageDirectionType = typeof MessageDirection[keyof typeof MessageDirection];

export const MessageStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
} as const;

export type MessageStatusType = typeof MessageStatus[keyof typeof MessageStatus];

@Entity('messages')
@Index(['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  conversationId: string;

  @ManyToOne(() => Conversation, conversation => conversation.messages)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({
    type: 'varchar',
    default: MessageType.TEXT,
  })
  type: MessageTypeType;

  @Column({
    type: 'varchar',
  })
  direction: MessageDirectionType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    mediaUrl?: string;
    mimeType?: string;
    fileName?: string;
    fileSize?: number;
    thumbnailUrl?: string;
    duration?: number;
    latitude?: number;
    longitude?: number;
  };

  @Column({
    type: 'varchar',
    default: MessageStatus.PENDING,
  })
  status: MessageStatusType;

  @Column({ nullable: true })
  externalId: string;

  @Column({ nullable: true })
  sentBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
