import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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

  @Get('tracking/:touristId')
  @ApiOperation({ summary: 'Get tracking data for tourist' })
  @ApiResponse({ status: 200, description: 'Tracking data' })
  @ApiParam({ name: 'touristId', description: 'Tourist ID' })
  async getTrackingData(@Param('touristId') touristId: string) {
    return this.locationService.getTrackingData(touristId);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update locations' })
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

  @Post('detect-inactivity')
  @ApiOperation({ summary: 'Detect inactive tourists and trigger safety alerts' })
  @ApiResponse({ status: 200, description: 'Inactivity detection completed' })
  async detectInactivity() {
    return this.locationService.detectInactivityAndAlert();
  }

  @Get('activity-status/:touristId')
  @ApiOperation({ summary: 'Get tourist activity status' })
  @ApiResponse({ status: 200, description: 'Activity status' })
  @ApiParam({ name: 'touristId', description: 'Tourist ID' })
  async getActivityStatus(@Param('touristId') touristId: string) {
    return this.locationService.getTouristActivityStatus(touristId);
  }

  @Get('nearby-coordinates')
  @ApiOperation({ summary: 'Find nearby tourists by coordinates' })
  @ApiResponse({ status: 200, description: 'Nearby tourists with activity status' })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude' })
  @ApiQuery({ name: 'radius', required: false, description: 'Search radius in km' })
  async getNearbyTouristsByCoordinates(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius = 1
  ) {
    return this.locationService.getNearbyTourists(lat, lng, radius);
  }
}
