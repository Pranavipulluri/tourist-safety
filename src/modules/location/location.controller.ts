import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RealLocationService } from '../../services/real-location.service';
import { LocationService } from './location.service';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly realLocationService: RealLocationService,
  ) {}

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
    return this.locationService.getTrackingStatus(touristId);
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

  @Get('geocode/:address')
  @ApiOperation({ summary: 'Get coordinates from address using real APIs' })
  @ApiResponse({ status: 200, description: 'Coordinates and location details' })
  @ApiParam({ name: 'address', description: 'Address to geocode' })
  async geocodeAddress(@Param('address') address: string) {
    return this.realLocationService.getCoordinatesFromAddress(address);
  }

  @Get('reverse-geocode')
  @ApiOperation({ summary: 'Get address from coordinates using real APIs' })
  @ApiResponse({ status: 200, description: 'Address and location details' })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude' })
  async reverseGeocode(
    @Query('lat') lat: number,
    @Query('lng') lng: number
  ) {
    return this.realLocationService.getLocationFromCoordinates(lat, lng);
  }

  @Get('safety-rating')
  @ApiOperation({ summary: 'Get safety rating for location' })
  @ApiResponse({ status: 200, description: 'Safety rating and details' })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude' })
  async getSafetyRating(
    @Query('lat') lat: number,
    @Query('lng') lng: number
  ) {
    return this.realLocationService.checkSafetyRating(lat, lng);
  }

  @Get('weather')
  @ApiOperation({ summary: 'Get weather data for location' })
  @ApiResponse({ status: 200, description: 'Weather information' })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude' })
  async getWeatherData(
    @Query('lat') lat: number,
    @Query('lng') lng: number
  ) {
    return this.realLocationService.getWeatherData(lat, lng);
  }

  @Get('nearby-places')
  @ApiOperation({ summary: 'Get nearby places of interest' })
  @ApiResponse({ status: 200, description: 'Nearby places' })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude' })
  @ApiQuery({ name: 'type', required: false, description: 'Place type (hospital, police, tourist_attraction)' })
  async getNearbyPlaces(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('type') type?: string
  ) {
    return this.realLocationService.getNearbyPlaces(lat, lng, type);
  }

  @Get('heatmap/alerts')
  @ApiOperation({ summary: 'Get alerts heatmap data for visualization' })
  @ApiResponse({ status: 200, description: 'Heatmap data with alert density' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering (ISO string)' })
  async getAlertsHeatmap(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const timeRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined;

    return this.locationService.getAlertsHeatmapData(timeRange);
  }

  @Post('geofence/check-violations')
  @ApiOperation({ summary: 'Check for geofence violations' })
  @ApiResponse({ status: 200, description: 'Geofence violations detected' })
  async checkGeofenceViolations(@Body() body: {
    geofences: Array<{
      id: string;
      name: string;
      type: 'safe_zone' | 'restricted_zone';
      coordinates: Array<{ latitude: number; longitude: number }>;
    }>;
  }) {
    return this.locationService.getGeofenceViolations(body.geofences);
  }

  @Post('geofence/create')
  @ApiOperation({ summary: 'Create a new geofence' })
  @ApiResponse({ status: 201, description: 'Geofence created successfully' })
  async createGeofence(@Body() body: {
    name: string;
    type: 'safe_zone' | 'restricted_zone';
    coordinates: Array<{ latitude: number; longitude: number }>;
    description?: string;
    isActive?: boolean;
  }) {
    return this.locationService.createGeofence(body);
  }

  @Get('stats/tourist-activity')
  @ApiOperation({ summary: 'Get tourist location activity statistics' })
  @ApiResponse({ status: 200, description: 'Location activity stats' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering (ISO string)' })
  async getTouristLocationStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const timeRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined;

    return this.locationService.getTouristLocationStats(timeRange);
  }
}
