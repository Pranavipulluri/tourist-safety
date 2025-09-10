import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDatabaseService } from '../../services/mock-database.service';
import { RealLocationService } from '../../services/real-location.service';
import { EmergencyService } from '../emergency/emergency.service';

@Injectable()
export class LocationService {
  constructor(
    private readonly mockDb: MockDatabaseService,
    private readonly realLocationService: RealLocationService,
    private readonly emergencyService: EmergencyService,
  ) {}

  async updateLocation(locationData: {
    touristId: string;
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  }) {
    const tourist = await this.mockDb.findTouristById(locationData.touristId);
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    // Get enhanced location data from real APIs if available
    const realLocationData = await this.realLocationService.getLocationFromCoordinates(
      locationData.latitude, 
      locationData.longitude
    );

    // Get safety rating for the location
    const safetyData = await this.realLocationService.checkSafetyRating(
      locationData.latitude, 
      locationData.longitude
    );

    // Get weather information
    const weatherData = await this.realLocationService.getWeatherData(
      locationData.latitude, 
      locationData.longitude
    );

    // Create new location record with enhanced data
    const location = await this.mockDb.createLocation({
      touristId: locationData.touristId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: realLocationData?.address || locationData.address || 'Unknown location',
      accuracy: locationData.accuracy,
    });

    // Update tourist's current location
    await this.mockDb.updateTouristLocation(locationData.touristId, {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: realLocationData?.address || locationData.address || 'Unknown location',
    });

    // Check for safety alerts
    const safetyRating = safetyData?.rating || 'medium';
    if (safetyRating === 'low' || safetyRating === 'very-low') {
      await this.emergencyService.sendAlert({
        touristId: locationData.touristId,
        type: 'unsafe-area',
        severity: safetyRating === 'very-low' ? 'critical' : 'high',
        message: `Tourist entered ${safetyRating} safety area`,
        location: { 
          latitude: locationData.latitude, 
          longitude: locationData.longitude,
          address: realLocationData?.address || locationData.address
        },
      });
    }

    // Check for severe weather alerts
    if (weatherData?.alerts && weatherData.alerts.length > 0) {
      await this.emergencyService.sendAlert({
        touristId: locationData.touristId,
        type: 'weather-alert',
        severity: 'high',
        message: `Severe weather detected: ${weatherData.alerts.join(', ')}`,
        location: { 
          latitude: locationData.latitude, 
          longitude: locationData.longitude,
          address: realLocationData?.address || locationData.address
        },
      });
    }

    return {
      ...location,
      safetyRating,
      weatherData,
      realLocationData,
    };
  }

  async getCurrentLocation(touristId: string) {
    const tourist = await this.mockDb.findTouristById(touristId);
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const locations = await this.mockDb.getTouristLocations(touristId);
    const lastLocation = locations.length > 0 ? locations[locations.length - 1] : null;

    return {
      tourist,
      currentLocation: tourist.currentLocation,
      lastUpdate: lastLocation?.timestamp,
    };
  }

  async getLocationHistory(touristId: string, limit = 50) {
    const locations = await this.mockDb.getTouristLocations(touristId);
    return locations.slice(-limit).reverse(); // Get last 50, most recent first
  }

  async getTrackingData(touristId: string) {
    const tourist = await this.mockDb.findTouristById(touristId);
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const allLocations = await this.mockDb.getTouristLocations(touristId);
    const recentLocations = allLocations.slice(-10).reverse();

    return {
      tourist,
      currentLocation: tourist.currentLocation,
      recentLocations,
      isTracking: tourist.isActive,
    };
  }

  async bulkUpdateLocations(updates: {
    touristId: string;
    latitude: number;
    longitude: number;
    timestamp: Date;
    accuracy?: number;
  }[]) {
    let processed = 0;
    let errors = 0;

    for (const update of updates) {
      try {
        await this.updateLocation({
          touristId: update.touristId,
          latitude: update.latitude,
          longitude: update.longitude,
          accuracy: update.accuracy,
        });
        processed++;
      } catch (error) {
        console.error(`Error updating location for tourist ${update.touristId}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  }

  async detectInactivityAndAlert() {
    const inactivityResults = await this.mockDb.detectInactivity();
    let alertsTriggered = 0;

    for (const result of inactivityResults) {
      if (result.tourist.phoneNumber) {
        await this.emergencyService.initiateEmergencyCall(
          result.tourist.id,
          'INACTIVITY_ALERT',
          {
            latitude: result.lastLocation.latitude,
            longitude: result.lastLocation.longitude,
          }
        );
        alertsTriggered++;
      }
    }

    return {
      inactiveTourists: inactivityResults,
      alertsTriggered,
    };
  }

  async getTouristActivityStatus(touristId: string) {
    const tourist = await this.mockDb.findTouristById(touristId);
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const locations = await this.mockDb.getTouristLocations(touristId);
    const lastLocation = locations.length > 0 ? locations[locations.length - 1] : null;

    if (!lastLocation) {
      return {
        isActive: tourist.isActive,
        status: 'unknown' as const,
      };
    }

    const inactiveMinutes = Math.floor((Date.now() - lastLocation.timestamp.getTime()) / (1000 * 60));
    const status = inactiveMinutes > 30 ? 'inactive' : 'active';

    return {
      isActive: tourist.isActive,
      lastLocation,
      inactiveMinutes,
      status: status as 'active' | 'inactive',
    };
  }

  async getNearbyTourists(lat: number, lng: number, radiusKm: number = 1) {
    const nearbyTourists = await this.mockDb.getNearbyTourists(lat, lng, radiusKm);

    return {
      nearbyTourists,
      center: { lat, lng },
      radius: radiusKm,
      count: nearbyTourists.length,
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }
}