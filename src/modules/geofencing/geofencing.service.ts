import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDatabaseService } from '../../services/mock-database.service';
import { EmergencyService } from '../emergency/emergency.service';

@Injectable()
export class GeofencingService {
  constructor(
    private readonly mockDb: MockDatabaseService,
    private readonly emergencyService: EmergencyService,
  ) {}

  async create(geofenceData: {
    name: string;
    description?: string;
    type: string;
    coordinates: { latitude: number; longitude: number }[];
    centerLatitude: number;
    centerLongitude: number;
    radius: number;
    alertMessage?: string;
  }) {
    const geofence = await this.mockDb.createGeofence({
      ...geofenceData,
    });

    return geofence;
  }

  async findAll(type?: string, active?: boolean) {
    const geofences = await this.mockDb.getActiveGeofences();
    
    let filtered = geofences;
    
    if (type) {
      filtered = filtered.filter(g => g.type === type);
    }
    
    if (active !== undefined) {
      filtered = filtered.filter(g => g.isActive === active);
    }

    return filtered;
  }

  async findOne(id: string) {
    // For now, just get the first geofence from the list (mock data)
    const geofences = await this.mockDb.getActiveGeofences();
    const geofence = geofences.find(g => g.id === id);
    
    if (!geofence) {
      throw new NotFoundException(`Geofence with ID ${id} not found`);
    }
    return geofence;
  }

  async update(id: string, updateData: {
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
    const geofence = await this.findOne(id);
    
    // Mock update - just return the geofence with updated data
    return {
      ...geofence,
      ...updateData,
      updatedAt: new Date(),
    };
  }

  async remove(id: string) {
    const geofence = await this.findOne(id);
    // Mock removal - just confirm it exists
    return { message: 'Geofence deleted successfully' };
  }

  async checkViolation(touristId: string, latitude: number, longitude: number) {
    const activeGeofences = await this.mockDb.getActiveGeofences();
    const violations: any[] = [];
    const safeZones: any[] = [];

    for (const geofence of activeGeofences) {
      const isInside = this.isPointInGeofence(latitude, longitude, geofence);

      if (geofence.type === 'RESTRICTED_ZONE' && isInside) {
        violations.push(geofence);

        // Create alert for violation
        await this.mockDb.createAlert({
          type: 'GEOFENCE_VIOLATION',
          severity: 'HIGH',
          message: geofence.alertMessage || `Entered restricted zone: ${geofence.name}`,
          location: { latitude, longitude },
          touristId,
        });

        // Send SMS warning to tourist
        const tourist = await this.mockDb.findTouristById(touristId);
        if (tourist && tourist.phoneNumber) {
          const smsMessage = geofence.alertMessage || `WARNING: You have entered a restricted zone: ${geofence.name}. Please leave immediately for your safety.`;
          await this.emergencyService.sendSMSAlert(touristId, smsMessage, [tourist.phoneNumber]);
        }
      } else if (geofence.type === 'SAFE_ZONE' && isInside) {
        safeZones.push(geofence);
      }
    }

    return {
      violations,
      safeZones,
      touristLocation: { latitude, longitude },
    };
  }

  async getViolations(touristId: string) {
    const alerts = await this.mockDb.getTouristAlerts(touristId);
    return alerts.filter(alert => alert.type === 'GEOFENCE_VIOLATION');
  }

  async bulkCheckViolations(tourists: {
    touristId: string;
    latitude: number;
    longitude: number;
  }[]) {
    const results: any[] = [];
    let totalViolations = 0;

    for (const tourist of tourists) {
      const checkResult = await this.checkViolation(
        tourist.touristId,
        tourist.latitude,
        tourist.longitude
      );

      results.push({
        touristId: tourist.touristId,
        violations: checkResult.violations,
        safeZones: checkResult.safeZones,
      });

      totalViolations += checkResult.violations.length;
    }

    return {
      totalChecked: tourists.length,
      totalViolations,
      results,
    };
  }

  async getViolationStats(days = 7) {
    // Mock stats for development
    return {
      totalViolations: 5,
      violationsByType: {
        'RESTRICTED_ZONE': 5,
      },
      violationsByGeofence: {
        'High Crime Area': 3,
        'Construction Zone': 2,
      },
      dailyViolations: {
        [new Date().toISOString().split('T')[0]]: 5,
      },
    };
  }

  private isPointInGeofence(latitude: number, longitude: number, geofence: any): boolean {
    // Simple circular geofence check using radius
    const distance = this.calculateDistance(
      latitude,
      longitude,
      geofence.centerLatitude,
      geofence.centerLongitude
    );

    return distance <= geofence.radius;
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