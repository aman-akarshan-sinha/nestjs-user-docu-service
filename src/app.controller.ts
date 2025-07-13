import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor() {}

  @Get('/health')
  @ApiOperation({ summary: 'Check service health', description: 'Returns a message confirming the service is up and running.' })
  checkHealth() {
    return { result: 'Health Check Successful' };
  }
}