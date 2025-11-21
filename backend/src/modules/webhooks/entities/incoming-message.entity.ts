import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  LOCATION = 'location',
  CONTACTS = 'contacts',
  INTERACTIVE = 'interactive',
}

@Entity('incoming_messages')
export class IncomingMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  metaMessageId: string;

  @Column()
  from: string;

  @Column({ nullable: true })
  fromName: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ type: 'jsonb', nullable: true })
  media: any;

  @Column({ type: 'jsonb', nullable: true })
  context: any;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isReplied: boolean;

  @Column({ nullable: true })
  repliedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
