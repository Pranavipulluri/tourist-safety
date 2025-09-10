import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LocationService } from './location.service';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('update')
  @ApiOperation({ summary: 'Update tourist location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  async updateLocation(@Body() body: {
    touristId: string;
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  }) {
    return this.locationService.updateLocation(body);
  }

  @Get('current/:touristId')
  @ApiOperation({ summary: 'Get current location of tourist' })
  @ApiResponse({ status: 200, description: 'Current location' })
  @ApiParam({ name: 'touristId', description: 'Tourist ID' })
  async getCurrentLocation(@Param('touristId') touristId: string) {
    return this.locationService.getCurrentLocation(touristId);
  }

  @Get('history/:touristId')
  @ApiOperation({ summary: 'Get location history for tourist' })
  @ApiResponse({ status: 200, description: 'Location history' })
  @ApiParam({ name: 'touristId', description: 'Tourist ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records' })
  @ApiQuery({ name: 'hours', required: false, description: 'Hours back to fetch' })
  async getLocationHistory(
    @Param('touristId') touristId: string,
    @Query('limit') limit = 50,
    @Query('hours') hours = 24
  ) {
    return this.locationService.getLocationHistory(touristId, limit);
  }

  @Get('nearby/:touristId')
  @ApiOperation({ summary: 'Find nearby tourists' })
  @ApiResponse({ status: 200, description: 'Nearby tourists' })
  @ApiParam({ name: 'touristId', description: 'Tourist ID' })
  @ApiQuery({ name: 'radius', required: false, description: 'Search radius in meters' })
  async findNearbyTourists(
    @Param('touristId') touristId: string,
    @Query('radius') radius = 1000
  ) {
    return this.locationService.getNearbyTourists(touristId, radius);
  }

  @Get('track/:touristId')
  @ApiOperation({ summary: 'Get real-time tracking data' })
  @ApiResponse({ status: 200, description: 'Tracking data' })
  @ApiParam({ name: 'touristId', description: 'Tourist ID' })
  async getTrackingData(@Param('touristId') touristId: string) {
    return this.locationService.getTrackingData(touristId);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update locations from IoT devices' })
  @ApiResponse({ status: 200, description: 'Bulk update completed' })
  async bulkUpdateLocations(@Body() body: {
    updates: {
      touristId: string;
      latitude: number;
      longitude: number;
      timestamp: Date;
      accuracy?: number;
    }[];
  }) {
    return this.locationService.bulkUpdateLocations(body.updates);
  }
}
