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

  async getAlertsHeatmapData(timeRange?: { start: Date; end: Date }) {
    const alertRepository = this.locationRepository.manager.getRepository('Alert');
    
    let query = alertRepository.createQueryBuilder('alert')
      .select([
        'alert.location',
        'alert.type',
        'alert.severity',
        'alert.createdAt'
      ])
      .where('alert.location IS NOT NULL');

    if (timeRange) {
      query = query.andWhere('alert.createdAt BETWEEN :start AND :end', {
        start: timeRange.start,
        end: timeRange.end
      });
    }

    const alerts = await query.getMany();

    // Group alerts by location grid (for heatmap)
    const heatmapData = [];
    const gridSize = 0.001; // Approximately 100m grid

    const locationGroups = new Map();
    
    alerts.forEach(alert => {
      if (alert.location && alert.location.latitude && alert.location.longitude) {
        // Round to grid
        const gridLat = Math.round(alert.location.latitude / gridSize) * gridSize;
        const gridLng = Math.round(alert.location.longitude / gridSize) * gridSize;
        const key = `${gridLat},${gridLng}`;

        if (!locationGroups.has(key)) {
          locationGroups.set(key, {
            latitude: gridLat,
            longitude: gridLng,
            count: 0,
            severityWeights: { low: 0, medium: 0, high: 0, critical: 0 },
            types: {}
          });
        }

        const group = locationGroups.get(key);
        group.count++;
        
        // Weight by severity
        const severityWeight = {
          'low': 1,
          'medium': 2,
          'high': 3,
          'critical': 5
        }[alert.severity] || 1;
        
        group.severityWeights[alert.severity] = (group.severityWeights[alert.severity] || 0) + 1;
        group.types[alert.type] = (group.types[alert.type] || 0) + 1;
      }
    });

    // Convert to array with intensity
    locationGroups.forEach((group, key) => {
      const totalWeight = Object.entries(group.severityWeights)
        .reduce((sum, [severity, count]) => {
          const weight = { low: 1, medium: 2, high: 3, critical: 5 }[severity] || 1;
          return sum + (Number(count) * weight);
        }, 0);

      heatmapData.push({
        ...group,
        intensity: Math.min(totalWeight / 10, 1) // Normalize intensity 0-1
      });
    });

    return {
      heatmapData: heatmapData.sort((a, b) => b.intensity - a.intensity),
      totalAlerts: alerts.length,
      timeRange: timeRange || { start: null, end: null },
      hotspots: heatmapData.filter(point => point.intensity > 0.5).slice(0, 10)
    };
  }

  async getGeofenceViolations(geofences: Array<{
    id: string;
    name: string;
    type: 'safe_zone' | 'restricted_zone';
    coordinates: Array<{ latitude: number; longitude: number }>;
  }>) {
    const activeTourists = await this.touristRepository.find({
      where: { isActive: true },
    });

    const violations = [];
    
    for (const tourist of activeTourists) {
      if (!tourist.currentLocation) continue;

      for (const geofence of geofences) {
        const isInside = this.isPointInPolygon(
          tourist.currentLocation.latitude,
          tourist.currentLocation.longitude,
          geofence.coordinates
        );

        // Check for violations based on geofence type
        const isViolation = 
          (geofence.type === 'restricted_zone' && isInside) ||
          (geofence.type === 'safe_zone' && !isInside);

        if (isViolation) {
          violations.push({
            touristId: tourist.id,
            touristName: `${tourist.firstName} ${tourist.lastName}`,
            geofenceId: geofence.id,
            geofenceName: geofence.name,
            geofenceType: geofence.type,
            violationType: geofence.type === 'restricted_zone' ? 'ENTERED_RESTRICTED' : 'LEFT_SAFE_ZONE',
            location: tourist.currentLocation,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return {
      violations,
      totalViolations: violations.length,
      geofencesChecked: geofences.length,
      touristsMonitored: activeTourists.length
    };
  }

  async createGeofence(geofenceData: {
    name: string;
    type: 'safe_zone' | 'restricted_zone';
    coordinates: Array<{ latitude: number; longitude: number }>;
    description?: string;
    isActive?: boolean;
  }) {
    // In a real implementation, you'd save this to a Geofence entity
    const geofence = {
      id: `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...geofenceData,
      isActive: geofenceData.isActive !== false,
      createdAt: new Date().toISOString()
    };

    console.log(`🗺️ Geofence created: ${geofence.name} (${geofence.type})`);

    return geofence;
  }

  async getTouristLocationStats(timeRange?: { start: Date; end: Date }) {
    let query = this.locationRepository.createQueryBuilder('location')
      .leftJoin('location.tourist', 'tourist');

    if (timeRange) {
      query = query.where('location.timestamp BETWEEN :start AND :end', {
        start: timeRange.start,
        end: timeRange.end
      });
    }

    const locations = await query.getMany();

    // Calculate stats
    const uniqueTourists = new Set(locations.map(l => l.touristId)).size;
    const totalLocations = locations.length;
    
    // Group by hour for activity patterns
    const hourlyActivity = Array(24).fill(0);
    locations.forEach(location => {
      const hour = new Date(location.timestamp).getHours();
      hourlyActivity[hour]++;
    });

    // Find most active areas
    const areaActivity = new Map();
    locations.forEach(location => {
      if (location.address) {
        const area = location.address.split(',')[0]; // First part of address
        areaActivity.set(area, (areaActivity.get(area) || 0) + 1);
      }
    });

    const topAreas = Array.from(areaActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([area, count]) => ({ area, count }));

    return {
      uniqueTourists,
      totalLocations,
      averageLocationsPerTourist: totalLocations / uniqueTourists || 0,
      hourlyActivity,
      topAreas,
      timeRange: timeRange || { start: null, end: null }
    };
  }

  // Helper method to check if a point is inside a polygon
  private isPointInPolygon(lat: number, lng: number, polygon: Array<{ latitude: number; longitude: number }>): boolean {
    let inside = false;
    const x = lng;
    const y = lat;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude;
      const yi = polygon[i].latitude;
      const xj = polygon[j].longitude;
      const yj = polygon[j].latitude;

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
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