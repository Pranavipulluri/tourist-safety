import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';

@ApiTags('Emergency')
@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post('sos')
  @ApiOperation({ summary: 'Trigger SOS alert' })
  @ApiResponse({ status: 200, description: 'SOS alert triggered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async triggerSOS(@Body() body: { touristId: string; message?: string; location?: { latitude: number; longitude: number } }) {
    return this.emergencyService.triggerSOS(body.touristId, body.message, body.location);
  }

  @Post('alert')
  @ApiOperation({ summary: 'Send emergency alert' })
  @ApiResponse({ status: 200, description: 'Alert sent successfully' })
  async sendAlert(@Body() body: {
    touristId: string;
    type: string;
    message: string;
    severity: string;
    location?: { latitude: number; longitude: number; address?: string };
  }) {
    return this.emergencyService.sendAlert(body);
  }

  @Get('alerts/:touristId')
  @ApiOperation({ summary: 'Get alerts for tourist' })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  @ApiParam({ name: 'touristId', description: 'Tourist ID' })
  async getTouristAlerts(@Param('touristId') touristId: string) {
    return this.emergencyService.getTouristAlerts(touristId);
  }

  @Post('fir')
  @ApiOperation({ summary: 'File FIR (First Information Report)' })
  @ApiResponse({ status: 201, description: 'FIR filed successfully' })
  async fileFIR(@Body() body: {
    touristId: string;
    incidentType: string;
    description: string;
    location: { latitude: number; longitude: number; address?: string };
    incidentTime: Date;
  }) {
    return this.emergencyService.fileFIR(body);
  }

  @Get('fir/:touristId')
  @ApiOperation({ summary: 'Get FIRs for tourist' })
  @ApiResponse({ status: 200, description: 'List of FIRs' })
  @ApiParam({ name: 'touristId', description: 'Tourist ID' })
  async getTouristFIRs(@Param('touristId') touristId: string) {
    return this.emergencyService.getTouristFIRs(touristId);
  }

  @Post('sms-alert')
  @ApiOperation({ summary: 'Send SMS alert' })
  @ApiResponse({ status: 200, description: 'SMS sent successfully' })
  async sendSMSAlert(@Body() body: {
    touristId: string;
    message: string;
    numbers?: string[];
  }) {
    return this.emergencyService.sendSMSAlert(body.touristId, body.message, body.numbers);
  }

  @Post('call-emergency')
  @ApiOperation({ summary: 'Initiate emergency call' })
  @ApiResponse({ status: 200, description: 'Emergency call initiated' })
  async initiateEmergencyCall(@Body() body: {
    touristId: string;
    emergencyType: string;
    location?: { latitude: number; longitude: number };
  }) {
    return this.emergencyService.initiateEmergencyCall(body.touristId, body.emergencyType, body.location);
  }
}
