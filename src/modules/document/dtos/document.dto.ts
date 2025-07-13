import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus, DocumentType } from '../entities/document.entity';

export class CreateDocumentDto {
  @ApiProperty({ example: 'Project Plan', description: 'Title of the document' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Detailed project plan for Q3', description: 'Optional document description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DocumentType, example: DocumentType.PDF, description: 'Optional file type of the document' })
  @IsOptional()
  @IsEnum(DocumentType)
  fileType?: DocumentType;

  @ApiPropertyOptional({
    type: 'object',
    description: 'Optional key-value metadata',
    additionalProperties: true,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional({ example: 'Updated Project Plan', description: 'New title of the document' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description', description: 'New description for the document' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DocumentStatus, example: DocumentStatus.PUBLISHED, description: 'New status of the document' })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({
    type: 'object',
    description: 'Updated metadata fields',
    additionalProperties: true,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class DocumentQueryDto {
  @ApiPropertyOptional({ example: 'project', description: 'Search query for document title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: DocumentStatus, example: DocumentStatus.DRAFT, description: 'Filter by document status' })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ enum: DocumentType, example: DocumentType.DOCX, description: 'Filter by file type' })
  @IsOptional()
  @IsEnum(DocumentType)
  fileType?: DocumentType;

  @ApiPropertyOptional({
    format: 'uuid',
    example: 'a3f5c814-2fc2-4ed5-95d2-d79c1dc0ad33',
    description: 'Filter documents by creator ID',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ example: '1', description: 'Page number for pagination' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '10', description: 'Number of documents per page' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Field to sort results by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    description: 'Sort order (ascending or descending)',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

export class DocumentUploadDto {
  @ApiProperty({ example: 'Uploaded Document', description: 'Title for the uploaded document' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Description of uploaded file', description: 'Optional description for the uploaded file' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: 'object',
    description: 'Optional metadata for the uploaded document',
    additionalProperties: true,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
