import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentService } from './document.service';
import { CreateDocumentDto, UpdateDocumentDto, DocumentQueryDto } from './dtos/document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import * as fs from 'fs';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
  ) {}

  @Post()
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async createDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(pdf|doc|docx|txt|jpg|jpeg|png)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req,
  ) {
    try {
      const document = await this.documentService.createDocument(
        createDocumentDto,
        file,
        req.user,
      );

      return {
        message: 'Document uploaded successfully',
        document: {
          id: document.id,
          title: document.title,
          description: document.description,
          fileName: document.fileName,
          originalFileName: document.originalFileName,
          fileSize: document.fileSize,
          fileType: document.fileType,
          status: document.status,
          createdAt: document.createdAt,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query() query: DocumentQueryDto, @Request() req) {
    try {
      const result = await this.documentService.findAll(query);
      
      const documents = result.documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        originalFileName: doc.originalFileName,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        status: doc.status,
        createdBy: {
          id: doc.createdBy.id,
          firstName: doc.createdBy.firstName,
          lastName: doc.createdBy.lastName,
        },
        createdAt: doc.createdAt,
        processedAt: doc.processedAt,
      }));

      return {
        documents,
        total: result.total,
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 10,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('my-documents')
  async getMyDocuments(@Request() req) {
    try {
      const documents = await this.documentService.getDocumentsByUser(req.user.id);
      
      return {
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          originalFileName: doc.originalFileName,
          fileSize: doc.fileSize,
          fileType: doc.fileType,
          status: doc.status,
          createdAt: doc.createdAt,
          processedAt: doc.processedAt,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    try {
      const document = await this.documentService.findById(id);
      
      return {
        id: document.id,
        title: document.title,
        description: document.description,
        originalFileName: document.originalFileName,
        fileSize: document.fileSize,
        fileType: document.fileType,
        status: document.status,
        metadata: document.metadata,
        createdBy: {
          id: document.createdBy.id,
          firstName: document.createdBy.firstName,
          lastName: document.createdBy.lastName,
        },
        createdAt: document.createdAt,
        processedAt: document.processedAt,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/download')
  async downloadDocument(@Param('id') id: string, @Res() res: Response) {
    try {
      const { filePath, fileName } = await this.documentService.getDocumentFile(id);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    try {
      const document = await this.documentService.updateDocument(id, updateDocumentDto);
      
      return {
        message: 'Document updated successfully',
        document: {
          id: document.id,
          title: document.title,
          description: document.description,
          status: document.status,
          metadata: document.metadata,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async deleteDocument(@Param('id') id: string) {
    try {
      await this.documentService.deleteDocument(id);
      return { message: 'Document deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('by-status/:status')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async getDocumentsByStatus(@Param('status') status: string) {
    try {
      const documents = await this.documentService.getDocumentsByStatus(status as any);
      
      return {
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          originalFileName: doc.originalFileName,
          fileSize: doc.fileSize,
          fileType: doc.fileType,
          status: doc.status,
          createdBy: {
            id: doc.createdBy.id,
            firstName: doc.createdBy.firstName,
            lastName: doc.createdBy.lastName,
          },
          createdAt: doc.createdAt,
          processedAt: doc.processedAt,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }
} 