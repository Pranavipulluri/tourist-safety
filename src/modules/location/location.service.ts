import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../../entities/location.entity';
import { Tourist } from '../../entities/tourist.entity';
import { RealLocationService } from '../../services/real-location.service';
import { EmergencyService } from '../emergency/emergency.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Tourist)
    private readonly touristRepository: Repository<Tourist>,
    private readonly realLocationService: RealLocationService,
    private readonly emergencyService: EmergencyService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async updateLocation(locationData: {
    touristId: string;
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  }) {
    const tourist = await this.touristRepository.findOne({ 
      where: { id: locationData.touristId } 
    });
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
    const location = this.locationRepository.create({
      touristId: locationData.touristId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: realLocationData?.address || locationData.address || 'Unknown location',
      accuracy: locationData.accuracy,
    });
    await this.locationRepository.save(location);

    // Update tourist's current location
    await this.touristRepository.update(locationData.touristId, {
      currentLocation: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: realLocationData?.address || locationData.address || 'Unknown location',
      }
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

    // Broadcast real-time location update to admin panels
    const locationUpdateData = {
      touristId: locationData.touristId,
      touristName: `${tourist.firstName} ${tourist.lastName}`,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: realLocationData?.address || locationData.address || 'Unknown location',
      accuracy: locationData.accuracy,
      safetyRating,
      timestamp: new Date().toISOString(),
      weatherCondition: weatherData?.current?.condition || 'unknown'
    };
    
    // Broadcast to all admin users for real-time tracking
    this.websocketGateway.broadcastLocationUpdate(locationUpdateData);

    return {
      ...location,
      safetyRating,
      weatherData,
      realLocationData,
    };
  }

  async getCurrentLocation(touristId: string) {
    const tourist = await this.touristRepository.findOne({ 
      where: { id: touristId } 
    });
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const locations = await this.locationRepository.find({
      where: { touristId },
      order: { timestamp: 'DESC' },
      take: 1
    });
    const lastLocation = locations.length > 0 ? locations[locations.length - 1] : null;

    return {
      tourist,
      currentLocation: tourist.currentLocation,
      lastUpdate: lastLocation?.timestamp,
    };
  }

  async getLocationHistory(touristId: string, limit: number = 100) {
    const locations = await this.locationRepository.find({
      where: { touristId },
      order: { timestamp: 'DESC' },
      take: limit // Use provided limit or default to 100
    });

    return {
      touristId,
      locations: locations.map(loc => ({
        id: loc.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: loc.address,
        accuracy: loc.accuracy,
        timestamp: loc.timestamp
      }))
    };
  }

  async getTrackingStatus(touristId: string) {
    const tourist = await this.touristRepository.findOne({ 
      where: { id: touristId } 
    });
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const allLocations = await this.locationRepository.find({
      where: { touristId },
      order: { timestamp: 'DESC' },
      take: 10 // Last 10 locations for tracking analysis
    });

    const lastLocation = allLocations[0];
    const isTracking = tourist.isActive && lastLocation && 
      (new Date().getTime() - new Date(lastLocation.timestamp).getTime()) < 300000; // 5 minutes

    return {
      touristId,
      isTracking,
      lastUpdate: lastLocation?.timestamp,
      currentLocation: lastLocation ? {
        latitude: lastLocation.latitude,
        longitude: lastLocation.longitude,
        address: lastLocation.address
      } : null,
      locationHistory: allLocations.length
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
    // Find tourists who haven't updated location in the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const inactiveTourists = await this.touristRepository
      .createQueryBuilder('tourist')
      .leftJoin('tourist.locations', 'location')
      .where('tourist.isActive = :isActive', { isActive: true })
      .andWhere(
        'tourist.id NOT IN ' +
        '(SELECT DISTINCT l.touristId FROM locations l WHERE l.timestamp > :thirtyMinutesAgo)',
        { thirtyMinutesAgo }
      )
      .getMany();
    let alertsTriggered = 0;

    for (const result of inactiveTourists) {
      if (result.phoneNumber) {
        await this.emergencyService.initiateEmergencyCall(
          result.id,
          'INACTIVITY_ALERT',
          result.currentLocation ? {
            latitude: result.currentLocation.latitude,
            longitude: result.currentLocation.longitude,
          } : null
        );
        alertsTriggered++;
      }
    }

    return {
      inactiveTourists: inactiveTourists,
      alertsTriggered,
    };
  }

  async getTouristActivityStatus(touristId: string) {
    const tourist = await this.touristRepository.findOne({ 
      where: { id: touristId } 
    });
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const locations = await this.locationRepository.find({
      where: { touristId },
      order: { timestamp: 'DESC' },
      take: 50 // Last 50 locations for activity analysis
    });
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
    // For now, return all tourists within a simple bounding box
    // In production, this should use PostGIS spatial queries
    const tourists = await this.touristRepository.find({
      where: { isActive: true },
      relations: ['locations']
    });

    const nearbyTourists = tourists.filter(tourist => {
      if (!tourist.currentLocation) return false;
      
      const distance = this.calculateDistance(
        lat, lng,
        tourist.currentLocation.latitude,
        tourist.currentLocation.longitude
      );
      return distance <= radiusKm * 1000; // Convert km to meters
    });

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