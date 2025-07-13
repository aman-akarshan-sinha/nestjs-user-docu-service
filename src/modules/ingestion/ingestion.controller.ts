import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { CreateIngestionJobDto, IngestionQueryDto, RetryIngestionJobDto, CancelIngestionJobDto } from './dtos/ingestion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('ingestion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('trigger')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async triggerIngestion(
    @Body() createIngestionJobDto: CreateIngestionJobDto,
    @Request() req,
  ) {
    try {
      const job = await this.ingestionService.createIngestionJob(
        createIngestionJobDto,
        req.user,
      );

      return {
        message: 'Ingestion job created successfully',
        job: {
          id: job.id,
          type: job.type,
          status: job.status,
          payload: job.payload,
          createdAt: job.createdAt,
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
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async findAll(@Query() query: IngestionQueryDto) {
    try {
      const result = await this.ingestionService.findAll(query);
      
      const jobs = result.jobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        payload: job.payload,
        result: job.result,
        errorMessage: job.errorMessage,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        duration: job.duration,
        progress: job.progress,
        retryCount: job.retryCount,
        maxRetries: job.maxRetries,
        triggeredBy: {
          id: job.triggeredBy.id,
          firstName: job.triggeredBy.firstName,
          lastName: job.triggeredBy.lastName,
        },
        createdAt: job.createdAt,
      }));

      return {
        jobs,
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

  @Get('my-jobs')
  async getMyJobs(@Request() req) {
    try {
      const jobs = await this.ingestionService.getJobsByUser(req.user.id);
      
      return {
        jobs: jobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          payload: job.payload,
          result: job.result,
          errorMessage: job.errorMessage,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          duration: job.duration,
          progress: job.progress,
          retryCount: job.retryCount,
          createdAt: job.createdAt,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('active')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async getActiveJobs() {
    try {
      const jobs = await this.ingestionService.getActiveJobs();
      
      return {
        jobs: jobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          payload: job.payload,
          startedAt: job.startedAt,
          duration: job.duration,
          progress: job.progress,
          triggeredBy: {
            id: job.triggeredBy.id,
            firstName: job.triggeredBy.firstName,
            lastName: job.triggeredBy.lastName,
          },
          createdAt: job.createdAt,
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
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    try {
      const job = await this.ingestionService.findById(id);
      
      return {
        id: job.id,
        type: job.type,
        status: job.status,
        payload: job.payload,
        result: job.result,
        errorMessage: job.errorMessage,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        duration: job.duration,
        progress: job.progress,
        retryCount: job.retryCount,
        maxRetries: job.maxRetries,
        canRetry: job.canRetry,
        isActive: job.isActive,
        triggeredBy: {
          id: job.triggeredBy.id,
          firstName: job.triggeredBy.firstName,
          lastName: job.triggeredBy.lastName,
        },
        createdAt: job.createdAt,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/retry')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async retryJob(
    @Param('id') id: string,
    @Body() retryDto: RetryIngestionJobDto,
  ) {
    try {
      const job = await this.ingestionService.retryIngestionJob(id, retryDto);
      
      return {
        message: 'Job retry initiated successfully',
        job: {
          id: job.id,
          type: job.type,
          status: job.status,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/cancel')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async cancelJob(
    @Param('id') id: string,
    @Body() cancelDto: CancelIngestionJobDto,
  ) {
    try {
      const job = await this.ingestionService.cancelIngestionJob(id, cancelDto);
      
      return {
        message: 'Job cancelled successfully',
        job: {
          id: job.id,
          status: job.status,
          errorMessage: job.errorMessage,
          completedAt: job.completedAt,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('by-status/:status')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  async getJobsByStatus(@Param('status') status: string) {
    try {
      const jobs = await this.ingestionService.getJobsByStatus(status as any);
      
      return {
        jobs: jobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          payload: job.payload,
          result: job.result,
          errorMessage: job.errorMessage,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          duration: job.duration,
          retryCount: job.retryCount,
          triggeredBy: {
            id: job.triggeredBy.id,
            firstName: job.triggeredBy.firstName,
            lastName: job.triggeredBy.lastName,
          },
          createdAt: job.createdAt,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('webhook/status-update')
  async updateJobStatusFromPython(@Body() body: any) {
    try {
      await this.ingestionService.updateJobStatusFromPython(
        body.jobId,
        body.status,
        body.result
      );
      return {
        message: 'Job status updated successfully',
        jobId: body.jobId,
        status: body.status,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }
} 