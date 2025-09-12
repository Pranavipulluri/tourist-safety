import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Query,
    ValidationPipe
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Alert, AlertSeverity, AlertStatus, AlertType } from './alert.entity';
import { AlertsFilter, AlertsService, CreateAlertDto, UpdateAlertDto } from './alerts.service';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new alert' })
  @ApiResponse({
    status: 201,
    description: 'The alert has been successfully created.',
    type: Alert,
  })
  async createAlert(@Body(ValidationPipe) createAlertDto: CreateAlertDto): Promise<Alert> {
    return this.alertsService.createAlert(createAlertDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all alerts with optional filtering' })
  @ApiQuery({ name: 'type', enum: AlertType, required: false })
  @ApiQuery({ name: 'status', enum: AlertStatus, required: false })
  @ApiQuery({ name: 'severity', enum: AlertSeverity, required: false })
  @ApiQuery({ name: 'touristId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'latitude', required: false })
  @ApiQuery({ name: 'longitude', required: false })
  @ApiQuery({ name: 'radius', required: false, description: 'Radius in meters' })
  async findAll(@Query() query: any): Promise<Alert[]> {
    const filter: AlertsFilter = {};

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.severity) filter.severity = query.severity;
    if (query.touristId) filter.touristId = query.touristId;
    if (query.startDate) filter.startDate = new Date(query.startDate);
    if (query.endDate) filter.endDate = new Date(query.endDate);
    if (query.latitude) filter.latitude = parseFloat(query.latitude);
    if (query.longitude) filter.longitude = parseFloat(query.longitude);
    if (query.radius) filter.radius = parseInt(query.radius);

    return this.alertsService.findAll(filter);
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get heatmap data for alerts visualization' })
  @ApiQuery({ name: 'type', enum: AlertType, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'severity', enum: AlertSeverity, required: false })
  async getHeatmapData(@Query() query: any): Promise<any> {
    const filter: AlertsFilter = {};

    if (query.type) filter.type = query.type;
    if (query.severity) filter.severity = query.severity;
    if (query.startDate) filter.startDate = new Date(query.startDate);
    if (query.endDate) filter.endDate = new Date(query.endDate);

    return this.alertsService.getHeatmapData(filter);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get alerts statistics' })
  async getStatistics(): Promise<any> {
    return this.alertsService.getStatistics();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get alert trends data' })
  @ApiQuery({ name: 'type', enum: AlertType, required: false })
  async getTrends(@Query() query: any): Promise<any[]> {
    const filter: AlertsFilter = {};
    if (query.type) filter.type = query.type;

    return this.alertsService.getAlertTrends(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific alert by ID' })
  @ApiResponse({
    status: 200,
    description: 'The alert data.',
    type: Alert,
  })
  @ApiResponse({
    status: 404,
    description: 'Alert not found.',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Alert> {
    return this.alertsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an alert' })
  @ApiResponse({
    status: 200,
    description: 'The alert has been successfully updated.',
    type: Alert,
  })
  async updateAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateAlertDto: UpdateAlertDto,
  ): Promise<Alert> {
    return this.alertsService.updateAlert(id, updateAlertDto);
  }

  @Patch(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @HttpCode(HttpStatus.OK)
  async acknowledgeAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('acknowledgedBy') acknowledgedBy: string,
  ): Promise<Alert> {
    return this.alertsService.acknowledgeAlert(id, acknowledgedBy);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  @HttpCode(HttpStatus.OK)
  async resolveAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('resolvedBy') resolvedBy: string,
  ): Promise<Alert> {
    return this.alertsService.resolveAlert(id, resolvedBy);
  }

  // Emergency SOS endpoint for tourists
  @Post('sos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create emergency SOS alert' })
  async createSOSAlert(@Body() sosData: {
    touristId: string;
    latitude: number;
    longitude: number;
    message?: string;
    address?: string;
  }): Promise<Alert> {
    const createAlertDto: CreateAlertDto = {
      type: AlertType.SOS,
      severity: AlertSeverity.CRITICAL,
      message: sosData.message || 'Emergency SOS Alert',
      latitude: sosData.latitude,
      longitude: sosData.longitude,
      address: sosData.address,
      touristId: sosData.touristId,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'mobile_app',
      },
    };

    return this.alertsService.createAlert(createAlertDto);
  }

  // Panic button endpoint
  @Post('panic')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create panic alert' })
  async createPanicAlert(@Body() panicData: {
    touristId: string;
    latitude: number;
    longitude: number;
    message?: string;
    address?: string;
  }): Promise<Alert> {
    const createAlertDto: CreateAlertDto = {
      type: AlertType.PANIC,
      severity: AlertSeverity.HIGH,
      message: panicData.message || 'Panic Button Pressed',
      latitude: panicData.latitude,
      longitude: panicData.longitude,
      address: panicData.address,
      touristId: panicData.touristId,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'mobile_app',
      },
    };

    return this.alertsService.createAlert(createAlertDto);
  }
}