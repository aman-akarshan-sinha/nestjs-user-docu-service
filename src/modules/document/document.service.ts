import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Document, DocumentStatus, DocumentType } from './entities/document.entity';
import { User } from '../user/entities/user.entity';
import { CreateDocumentDto, UpdateDocumentDto, DocumentQueryDto } from './dtos/document.dto';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly configService: ConfigService,
  ) {}

  async createDocument(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
    user: User,
  ): Promise<Document> {
    const fileName = this.generateFileName(file.originalname);
    const filePath = path.join(this.configService.get('upload.uploadDest'), fileName);

    await this.saveFile(file.buffer, filePath);

    const document = this.documentRepository.create({
      ...createDocumentDto,
      fileName,
      originalFileName: file.originalname,
      filePath,
      fileSize: file.size,
      fileType: this.getFileType(file.originalname),
      createdBy: user,
    });

    return this.documentRepository.save(document);
  }

  async findAll(query: DocumentQueryDto): Promise<{ documents: Document[]; total: number }> {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const whereConditions: FindOptionsWhere<Document> = {};

    if (query.search) {
      whereConditions.title = Like(`%${query.search}%`);
    }

    if (query.status) {
      whereConditions.status = query.status;
    }

    if (query.fileType) {
      whereConditions.fileType = query.fileType;
    }

    if (query.createdBy) {
      whereConditions.createdById = query.createdBy;
    }

    const [documents, total] = await this.documentRepository.findAndCount({
      where: whereConditions,
      relations: ['createdBy'],
      skip,
      take: limit,
      order: { [query.sortBy || 'createdAt']: query.sortOrder || 'DESC' },
    });

    return { documents, total };
  }

  async findById(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findById(id);
    Object.assign(document, updateDocumentDto);
    return this.documentRepository.save(document);
  }

  async deleteDocument(id: string): Promise<void> {
    const document = await this.findById(id);
    
    try {
      await fs.promises.unlink(document.filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    await this.documentRepository.remove(document);
  }

  async getDocumentFile(id: string): Promise<{ filePath: string; fileName: string }> {
    const document = await this.findById(id);
    return {
      filePath: document.filePath,
      fileName: document.originalFileName,
    };
  }

  async updateDocumentStatus(id: string, status: DocumentStatus): Promise<Document> {
    const document = await this.findById(id);
    document.status = status;
    
    if (status === DocumentStatus.PUBLISHED) {
      document.processedAt = new Date();
    }

    return this.documentRepository.save(document);
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { createdById: userId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDocumentsByStatus(status: DocumentStatus): Promise<Document[]> {
    return this.documentRepository.find({
      where: { status },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  private generateFileName(originalName: string): string {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    const uuid = uuidv4();
    return `${timestamp}-${uuid}${extension}`;
  }

  private getFileType(fileName: string): DocumentType {
    const extension = path.extname(fileName).toLowerCase();
    
    switch (extension) {
      case '.pdf':
        return DocumentType.PDF;
      case '.doc':
        return DocumentType.DOC;
      case '.docx':
        return DocumentType.DOCX;
      case '.txt':
        return DocumentType.TXT;
      case '.jpg':
      case '.jpeg':
      case '.png':
        return DocumentType.IMAGE;
      default:
        throw new BadRequestException('Unsupported file type');
    }
  }

  private async saveFile(buffer: Buffer, filePath: string): Promise<void> {
    const uploadDir = path.dirname(filePath);
    
    try {
      await fs.promises.mkdir(uploadDir, { recursive: true });
      await fs.promises.writeFile(filePath, buffer);
    } catch (error) {
      throw new BadRequestException('Failed to save file');
    }
  }
} 