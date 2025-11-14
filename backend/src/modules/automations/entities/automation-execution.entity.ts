import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Automation } from './automation.entity';

export const ExecutionStatus = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PARTIAL: 'partial',
} as const;

export type ExecutionStatusType = typeof ExecutionStatus[keyof typeof ExecutionStatus];

@Entity('automation_executions')
@Index(['automationId', 'createdAt'])
export class AutomationExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  automationId: string;

  @ManyToOne(() => Automation)
  @JoinColumn({ name: 'automationId' })
  automation: Automation;

  @Column({
    type: 'varchar',
  })
  status: ExecutionStatusType;

  @Column({ type: 'jsonb', nullable: true })
  triggerData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  executionResults: Array<{
    actionType: string;
    success: boolean;
    error?: string;
  }>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 0 })
  executionTimeMs: number;

  @CreateDateColumn()
  createdAt: Date;
}
