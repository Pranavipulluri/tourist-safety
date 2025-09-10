import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GeofencingService } from './geofencing.service';

@ApiTags('Geofencing')
@Controller('geofencing')
export class GeofencingController {
  constructor(private readonly geofencingService: GeofencingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new geofence' })
  @ApiResponse({ status: 201, description: 'Geofence created successfully' })
  async create(@Body() body: {
    name: string;
    description?: string;
    type: string;
    coordinates: { latitude: number; longitude: number }[];
    centerLatitude: number;
    centerLongitude: number;
    radius: number;
    alertMessage?: string;
  }) {
    return this.geofencingService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all geofences' })
  @ApiResponse({ status: 200, description: 'List of geofences' })
  @ApiQuery({ name: 'type', required: false, description: 'Geofence type filter' })
  @ApiQuery({ name: 'active', required: false, description: 'Active status filter' })
  async findAll(@Query('type') type?: string, @Query('active') active?: boolean) {
    return this.geofencingService.findAll(type, active);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get geofence by ID' })
  @ApiResponse({ status: 200, description: 'Geofence details' })
  @ApiParam({ name: 'id', description: 'Geofence ID' })
  async findOne(@Param('id') id: string) {
    return this.geofencingService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update geofence' })
  @ApiResponse({ status: 200, description: 'Geofence updated successfully' })
  @ApiParam({ name: 'id', description: 'Geofence ID' })
  async update(@Param('id') id: string, @Body() body: {
    name?: string;
    description?: string;
    type?: string;
    coordinates?: { latitude: number; longitude: number }[];
    centerLatitude?: number;
    centerLongitude?: number;
    radius?: number;
    alertMessage?: string;
    isActive?: boolean;
  }) {
    return this.geofencingService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete geofence' })
  @ApiResponse({ status: 200, description: 'Geofence deleted successfully' })
  @ApiParam({ name: 'id', description: 'Geofence ID' })
  async remove(@Param('id') id: string) {
    return this.geofencingService.remove(id);
  }

  @Post('check-violation')
  @ApiOperation({ summary: 'Check if location violates any geofences' })
  @ApiResponse({ status: 200, description: 'Geofence violation check result' })
  async checkViolation(@Body() body: {
    touristId: string;
    latitude: number;
    longitude: number;
  }) {
    return this.geofencingService.checkViolation(body.touristId, body.latitude, body.longitude);
  }

  @Get('violations/:touristId')
  @ApiOperation({ summary: 'Get geofence violations for tourist' })
  @ApiResponse({ status: 200, description: 'List of violations' })
  @ApiParam({ name: 'touristId', description: 'Tourist ID' })
  async getViolations(@Param('touristId') touristId: string) {
    return this.geofencingService.getViolations(touristId);
  }

  @Post('bulk-check')
  @ApiOperation({ summary: 'Check multiple tourists for geofence violations' })
  @ApiResponse({ status: 200, description: 'Bulk violation check results' })
  async bulkCheckViolations(@Body() body: {
    tourists: {
      touristId: string;
      latitude: number;
      longitude: number;
    }[];
  }) {
    return this.geofencingService.bulkCheckViolations(body.tourists);
  }

  @Get('stats/violations')
  @ApiOperation({ summary: 'Get geofence violation statistics' })
  @ApiResponse({ status: 200, description: 'Violation statistics' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look back' })
  async getViolationStats(@Query('days') days = 7) {
    return this.geofencingService.getViolationStats(days);
  }
}
