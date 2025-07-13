import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum IngestionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum IngestionType {
  DOCUMENT = 'document',
  BATCH = 'batch',
  SCHEDULED = 'scheduled',
}

@Entity('ingestion_jobs')
export class IngestionJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: IngestionType,
  })
  type: IngestionType;

  @Column({
    type: 'enum',
    enum: IngestionStatus,
    default: IngestionStatus.PENDING,
  })
  status: IngestionStatus;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any>;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  pythonJobId: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @Column({ nullable: true })
  nextRetryAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'triggered_by' })
  triggeredBy: User;

  @Column({ name: 'triggered_by', nullable: true })
  triggeredById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get duration(): number {
    if (!this.startedAt) return 0;
    const endTime = this.completedAt || new Date();
    return endTime.getTime() - this.startedAt.getTime();
  }

  get isActive(): boolean {
    return [IngestionStatus.PENDING, IngestionStatus.PROCESSING].includes(this.status);
  }

  get canRetry(): boolean {
    return this.status === IngestionStatus.FAILED && this.retryCount < this.maxRetries;
  }

  get progress(): number {
    if (this.status === IngestionStatus.COMPLETED) return 100;
    if (this.status === IngestionStatus.FAILED || this.status === IngestionStatus.CANCELLED) return 0;
    if (this.status === IngestionStatus.PENDING) return 0;
    return 50;
  }
} 