import { IsString, IsOptional, IsEnum, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IngestionType, IngestionStatus } from '../entities/ingestion-job.entity';

export class CreateIngestionJobDto {
  @ApiProperty({
    enum: IngestionType,
    example: IngestionType.DOCUMENT,
    description: 'Type of ingestion job',
  })
  @IsEnum(IngestionType)
  type: IngestionType;

  @ApiProperty({
    type: 'object',
    description: 'Payload data required to process the ingestion',
    additionalProperties: true,
  })
  @IsObject()
  payload: Record<string, any>;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '4d2f4c7e-8d6d-4f3a-b1e5-37b7a5b622c4',
    description: 'Optional document ID to associate with this ingestion job',
  })
  @IsOptional()
  @IsUUID()
  documentId?: string;
}

export class UpdateIngestionJobDto {
  @ApiPropertyOptional({
    enum: IngestionStatus,
    example: IngestionStatus.COMPLETED,
    description: 'Updated status of the ingestion job',
  })
  @IsOptional()
  @IsEnum(IngestionStatus)
  status?: IngestionStatus;

  @ApiPropertyOptional({
    type: 'object',
    description: 'Resulting data from ingestion process',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  result?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'Timeout while processing file',
    description: 'Optional error message if job failed',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({
    example: 'python-job-abc123',
    description: 'Reference ID for the associated Python background job',
  })
  @IsOptional()
  @IsString()
  pythonJobId?: string;
}

export class IngestionQueryDto {
  @ApiPropertyOptional({
    enum: IngestionType,
    example: IngestionType.BATCH,
    description: 'Filter ingestion jobs by type',
  })
  @IsOptional()
  @IsEnum(IngestionType)
  type?: IngestionType;

  @ApiPropertyOptional({
    enum: IngestionStatus,
    example: IngestionStatus.FAILED,
    description: 'Filter ingestion jobs by status',
  })
  @IsOptional()
  @IsEnum(IngestionStatus)
  status?: IngestionStatus;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '6e40e620-0f9b-412b-b0e4-0b792c6c8036',
    description: 'Filter by the user who triggered the ingestion',
  })
  @IsOptional()
  @IsUUID()
  triggeredBy?: string;

  @ApiPropertyOptional({ example: '1', description: 'Page number for pagination' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '20', description: 'Limit of records per page' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    description: 'Sort order',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

export class RetryIngestionJobDto {
  @ApiPropertyOptional({
    type: 'object',
    description: 'Optional payload to override during retry',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class CancelIngestionJobDto {
  @ApiPropertyOptional({
    example: 'User requested cancellation',
    description: 'Optional reason for cancelling the ingestion job',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
