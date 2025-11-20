import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Template } from './template.entity';

/**
 * Entity for tracking all template modifications with user attribution
 * Requirement 17.4: Log all template modifications with user attribution
 */
@Entity('template_audit_logs')
@Index(['templateId', 'createdAt'])
@Index(['tenantId', 'createdAt'])
@Index(['userId', 'createdAt'])
export class TemplateAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  templateId: string;

  @ManyToOne(() => Template, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template: Template;

  @Column()
  @Index()
  tenantId: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  action: string; // create, update, delete, submit, approve, reject, archive, restore, etc.

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: any; // Stores the changes made (before/after values)

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Additional context about the action

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
