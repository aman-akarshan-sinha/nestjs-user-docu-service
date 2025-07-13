import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngestionJob, IngestionStatus, IngestionType } from './entities/ingestion-job.entity';
import { User } from '../user/entities/user.entity';
import { CreateIngestionJobDto, UpdateIngestionJobDto, IngestionQueryDto } from './dtos/ingestion.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(IngestionJob)
    private readonly ingestionJobRepository: Repository<IngestionJob>,
    private readonly configService: ConfigService,
  ) {}

  async createIngestionJob(
    createIngestionJobDto: CreateIngestionJobDto,
    user: User,
  ): Promise<IngestionJob> {
    const ingestionJob = this.ingestionJobRepository.create({
      ...createIngestionJobDto,
      triggeredBy: user,
    });

    const savedJob = await this.ingestionJobRepository.save(ingestionJob);

    if (createIngestionJobDto.type === IngestionType.DOCUMENT) {
      await this.triggerPythonIngestion(savedJob);
    }

    return savedJob;
  }

  async findAll(query: IngestionQueryDto): Promise<{ jobs: IngestionJob[]; total: number }> {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (query.type) {
      whereConditions.type = query.type;
    }

    if (query.status) {
      whereConditions.status = query.status;
    }

    if (query.triggeredBy) {
      whereConditions.triggeredById = query.triggeredBy;
    }

    const [jobs, total] = await this.ingestionJobRepository.findAndCount({
      where: whereConditions,
      relations: ['triggeredBy'],
      skip,
      take: limit,
      order: { [query.sortBy || 'createdAt']: query.sortOrder || 'DESC' },
    });

    return { jobs, total };
  }

  async findById(id: string): Promise<IngestionJob> {
    const job = await this.ingestionJobRepository.findOne({
      where: { id },
      relations: ['triggeredBy'],
    });

    if (!job) {
      throw new NotFoundException('Ingestion job not found');
    }

    return job;
  }

  async updateIngestionJob(id: string, updateDto: UpdateIngestionJobDto): Promise<IngestionJob> {
    const job = await this.findById(id);
    Object.assign(job, updateDto);

    if (updateDto.status === IngestionStatus.PROCESSING && !job.startedAt) {
      job.startedAt = new Date();
    }

    if (updateDto.status === IngestionStatus.COMPLETED || updateDto.status === IngestionStatus.FAILED) {
      job.completedAt = new Date();
    }

    return this.ingestionJobRepository.save(job);
  }

  async retryIngestionJob(id: string, retryDto: any): Promise<IngestionJob> {
    const job = await this.findById(id);

    if (!job.canRetry) {
      throw new BadRequestException('Job cannot be retried');
    }

    job.status = IngestionStatus.PENDING;
    job.retryCount += 1;
    job.errorMessage = null;
    job.startedAt = null;
    job.completedAt = null;

    if (retryDto.payload) {
      job.payload = { ...job.payload, ...retryDto.payload };
    }

    const updatedJob = await this.ingestionJobRepository.save(job);

    if (job.type === IngestionType.DOCUMENT) {
      await this.triggerPythonIngestion(updatedJob);
    }

    return updatedJob;
  }

  async cancelIngestionJob(id: string, cancelDto: any): Promise<IngestionJob> {
    const job = await this.findById(id);

    if (!job.isActive) {
      throw new BadRequestException('Job is not active');
    }

    job.status = IngestionStatus.CANCELLED;
    job.completedAt = new Date();
    job.errorMessage = cancelDto.reason || 'Cancelled by user';

    if (job.pythonJobId) {
      await this.cancelPythonJob(job.pythonJobId);
    }

    return this.ingestionJobRepository.save(job);
  }

  async getActiveJobs(): Promise<IngestionJob[]> {
    return this.ingestionJobRepository.find({
      where: { status: IngestionStatus.PROCESSING },
      relations: ['triggeredBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async getJobsByStatus(status: IngestionStatus): Promise<IngestionJob[]> {
    return this.ingestionJobRepository.find({
      where: { status },
      relations: ['triggeredBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getJobsByUser(userId: string): Promise<IngestionJob[]> {
    return this.ingestionJobRepository.find({
      where: { triggeredById: userId },
      relations: ['triggeredBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateJobStatusFromPython(pythonJobId: string, status: string, result?: any): Promise<void> {
    const job = await this.ingestionJobRepository.findOne({
      where: { pythonJobId },
    });

    if (!job) {
      throw new NotFoundException('Ingestion job not found');
    }

    const updateData: any = {};

    switch (status) {
      case 'processing':
        updateData.status = IngestionStatus.PROCESSING;
        updateData.startedAt = new Date();
        break;
      case 'completed':
        updateData.status = IngestionStatus.COMPLETED;
        updateData.completedAt = new Date();
        updateData.result = result;
        break;
      case 'failed':
        updateData.status = IngestionStatus.FAILED;
        updateData.completedAt = new Date();
        updateData.errorMessage = result?.error || 'Processing failed';
        break;
      default:
        throw new BadRequestException('Invalid status');
    }

    await this.ingestionJobRepository.update(job.id, updateData);
  }

  private async triggerPythonIngestion(job: IngestionJob): Promise<void> {
    try {
      const pythonBackendUrl = this.configService.get('pythonBackend.url');
      const timeout = this.configService.get('pythonBackend.timeout');

      const response = await axios.post(
        `${pythonBackendUrl}/api/ingestion/trigger`,
        {
          jobId: job.id,
          type: job.type,
          payload: job.payload,
        },
        {
          timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.jobId) {
        await this.ingestionJobRepository.update(job.id, {
          pythonJobId: response.data.jobId,
          status: IngestionStatus.PROCESSING,
          startedAt: new Date(),
        });
      }
    } catch (error) {
      await this.ingestionJobRepository.update(job.id, {
        status: IngestionStatus.FAILED,
        errorMessage: error.message || 'Failed to trigger Python ingestion',
        completedAt: new Date(),
      });
    }
  }

  private async cancelPythonJob(pythonJobId: string): Promise<void> {
    try {
      const pythonBackendUrl = this.configService.get('pythonBackend.url');
      const timeout = this.configService.get('pythonBackend.timeout');

      await axios.post(
        `${pythonBackendUrl}/api/ingestion/cancel`,
        { jobId: pythonJobId },
        { timeout },
      );
    } catch (error) {
      console.error('Failed to cancel Python job:', error);
    }
  }
} 