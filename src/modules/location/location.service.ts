import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Location } from '../../entities/location.entity';
import { Tourist } from '../../entities/tourist.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Tourist)
    private readonly touristRepository: Repository<Tourist>,
  ) {}

  async updateLocation(locationData: {
    touristId: string;
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  }): Promise<Location> {
    const tourist = await this.touristRepository.findOne({ where: { id: locationData.touristId } });
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    // Create new location record
    const location = this.locationRepository.create({
      touristId: locationData.touristId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: locationData.address,
      accuracy: locationData.accuracy,
    });

    const savedLocation = await this.locationRepository.save(location);

    // Update tourist's current location
    tourist.currentLocation = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: locationData.address,
    };
    await this.touristRepository.save(tourist);

    return savedLocation;
  }

  async getCurrentLocation(touristId: string): Promise<{
    tourist: Tourist;
    currentLocation?: { latitude: number; longitude: number; address?: string };
    lastUpdate?: Date;
  }> {
    const tourist = await this.touristRepository.findOne({ where: { id: touristId } });
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const lastLocation = await this.locationRepository.findOne({
      where: { touristId },
      order: { timestamp: 'DESC' },
    });

    return {
      tourist,
      currentLocation: tourist.currentLocation,
      lastUpdate: lastLocation?.timestamp,
    };
  }

  async getLocationHistory(touristId: string, limit = 50): Promise<Location[]> {
    return await this.locationRepository.find({
      where: { touristId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getNearbyTourists(touristId: string, radius = 1000): Promise<{
    currentTourist: Tourist;
    nearbyTourists: Tourist[];
    count: number;
  }> {
    const currentTourist = await this.touristRepository.findOne({ where: { id: touristId } });
    if (!currentTourist || !currentTourist.currentLocation) {
      throw new NotFoundException('Tourist not found or location not available');
    }

    // Simple distance calculation (this is a basic implementation)
    // In production, you would use PostGIS or similar spatial functions
    const allTourists = await this.touristRepository.find({
      where: { isActive: true },
    });

    const nearbyTourists = allTourists.filter(tourist => {
      if (tourist.id === touristId || !tourist.currentLocation) return false;

      const distance = this.calculateDistance(
        currentTourist.currentLocation.latitude,
        currentTourist.currentLocation.longitude,
        tourist.currentLocation.latitude,
        tourist.currentLocation.longitude
      );

      return distance <= radius;
    });

    return {
      currentTourist,
      nearbyTourists,
      count: nearbyTourists.length,
    };
  }

  async getTrackingData(touristId: string): Promise<{
    tourist: Tourist;
    currentLocation?: { latitude: number; longitude: number; address?: string };
    recentLocations: Location[];
    isTracking: boolean;
  }> {
    const tourist = await this.touristRepository.findOne({ where: { id: touristId } });
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const recentLocations = await this.locationRepository.find({
      where: { touristId },
      order: { timestamp: 'DESC' },
      take: 10,
    });

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
  }[]): Promise<{ processed: number; errors: number }> {
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