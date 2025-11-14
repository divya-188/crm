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
import { Flow } from './flow.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

export const ExecutionStatus = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
} as const;

export type ExecutionStatusType = typeof ExecutionStatus[keyof typeof ExecutionStatus];

@Entity('flow_executions')
@Index(['flowId', 'status'])
@Index(['conversationId'])
export class FlowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  flowId: string;

  @ManyToOne(() => Flow)
  @JoinColumn({ name: 'flowId' })
  flow: Flow;

  @Column({ nullable: true })
  conversationId: string;

  @ManyToOne(() => Conversation, { nullable: true })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ nullable: true })
  contactId: string;

  @ManyToOne(() => Contact, { nullable: true })
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @Column({
    type: 'varchar',
    default: ExecutionStatus.RUNNING,
  })
  status: ExecutionStatusType;

  @Column({ nullable: true })
  currentNodeId: string;

  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  executionPath: string[];

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
