import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Health status information' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      service: 'Smart Tourist Safety Backend',
      ip: '192.168.0.104',
      database: 'PostgreSQL',
      message: 'System is running smoothly! 🚀',
    };
  }

  @Get('simple')
  @ApiOperation({ summary: 'Simple health check' })
  @ApiResponse({ status: 200, description: 'Simple OK response' })
  simple() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
