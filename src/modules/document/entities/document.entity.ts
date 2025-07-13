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

export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  PROCESSING = 'processing',
}

export enum DocumentType {
  PDF = 'pdf',
  DOC = 'doc',
  DOCX = 'docx',
  TXT = 'txt',
  IMAGE = 'image',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  fileName: string;

  @Column()
  originalFileName: string;

  @Column()
  filePath: string;

  @Column()
  fileSize: number;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  fileType: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  ingestionJobId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get fileExtension(): string {
    return this.originalFileName.split('.').pop()?.toLowerCase() || '';
  }

  get isProcessed(): boolean {
    return this.status === DocumentStatus.PUBLISHED;
  }

  get isProcessing(): boolean {
    return this.status === DocumentStatus.PROCESSING;
  }
} 