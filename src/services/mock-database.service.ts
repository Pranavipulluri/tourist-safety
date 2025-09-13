import { Injectable, Logger } from '@nestjs/common';

// Mock database service for development
@Injectable()
export class MockDatabaseService {
  private readonly logger = new Logger(MockDatabaseService.name);
  private tourists: any[] = [];
  private locations: any[] = [];
  private alerts: any[] = [];
  private geofences: any[] = [];
  private digitalIds: any[] = [];
  private locationTrackingInterval: NodeJS.Timeout;

  constructor() {
    this.initializeSampleData();
    this.startLocationTracking();
  }

  // Initialize with sample tourists and their locations
  private initializeSampleData() {
    this.logger.log('Initializing sample tourist data for testing...');
    
    // Sample tourists with realistic Indian locations
    const sampleTourists = [
      {
        id: 'tourist_001',
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul.sharma@email.com',
        phoneNumber: '+91-9876543210',
        emergencyContact: '+91-9876543211',
        nationality: 'Indian',
        passportNumber: 'A1234567',
        currentLocation: {
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'India Gate, New Delhi'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date()
      },
      {
        id: 'tourist_002',
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@email.com',
        phoneNumber: '+91-9876543220',
        emergencyContact: '+91-9876543221',
        nationality: 'Indian',
        passportNumber: 'B2345678',
        currentLocation: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: 'Gateway of India, Mumbai'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        updatedAt: new Date()
      },
      {
        id: 'tourist_003',
        firstName: 'Amit',
        lastName: 'Kumar',
        email: 'amit.kumar@email.com',
        phoneNumber: '+91-9876543230',
        emergencyContact: '+91-9876543231',
        nationality: 'Indian',
        passportNumber: 'C3456789',
        currentLocation: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Bangalore Palace, Bangalore'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        updatedAt: new Date()
      }
    ];

    // Add sample tourists
    this.tourists = sampleTourists;

    // Create location history for each tourist
    sampleTourists.forEach(tourist => {
      this.createLocationHistory(tourist.id, tourist.currentLocation);
    });

    // Create sample geofences
    this.geofences = [
      {
        id: 'geofence_001',
        name: 'High Crime Area - Old Delhi',
        type: 'RESTRICTED_ZONE',
        centerLatitude: 28.6507,
        centerLongitude: 77.2334,
        radius: 500, // 500 meters
        alertMessage: 'You are entering a high crime area. Please be cautious.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'geofence_002',
        name: 'Safe Zone - Connaught Place',
        type: 'SAFE_ZONE',
        centerLatitude: 28.6315,
        centerLongitude: 77.2167,
        radius: 1000, // 1 km
        alertMessage: 'You are in a safe zone with good security.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.logger.log(`Initialized ${this.tourists.length} sample tourists with location tracking`);
  }

  private createLocationHistory(touristId: string, currentLocation: any) {
    const now = new Date();
    const locations = [];

    // Create 10 location points over the last hour (every 6 minutes)
    for (let i = 10; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 6 * 60 * 1000));
      
      // Add some random movement to simulate realistic tracking
      const latVariation = (Math.random() - 0.5) * 0.01; // ~1km variation
      const lngVariation = (Math.random() - 0.5) * 0.01;
      
      locations.push({
        id: `location_${touristId}_${i}`,
        touristId,
        latitude: currentLocation.latitude + latVariation,
        longitude: currentLocation.longitude + lngVariation,
        accuracy: Math.random() * 20 + 5, // 5-25 meters accuracy
        timestamp,
        address: currentLocation.address
      });
    }

    this.locations.push(...locations);
  }

  // Simulate real-time location updates
  private startLocationTracking() {
    // Update locations every 30 seconds for active tourists
    this.locationTrackingInterval = setInterval(() => {
      this.simulateLocationUpdates();
    }, 30000); // 30 seconds

    this.logger.log('Started automatic location tracking simulation');
  }

  private simulateLocationUpdates() {
    this.tourists.forEach(tourist => {
      if (tourist.isActive && tourist.currentLocation) {
        // Simulate small movements (within 100 meters)
        const latChange = (Math.random() - 0.5) * 0.001; // ~100m
        const lngChange = (Math.random() - 0.5) * 0.001;
        
        const newLocation = {
          latitude: tourist.currentLocation.latitude + latChange,
          longitude: tourist.currentLocation.longitude + lngChange,
          address: tourist.currentLocation.address
        };

        // Update tourist's current location
        tourist.currentLocation = newLocation;
        tourist.updatedAt = new Date();

        // Add new location record
        this.locations.push({
          id: `location_${tourist.id}_${Date.now()}`,
          touristId: tourist.id,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          accuracy: Math.random() * 15 + 5,
          timestamp: new Date(),
          address: newLocation.address
        });
      }
    });
  }

  onModuleDestroy() {
    if (this.locationTrackingInterval) {
      clearInterval(this.locationTrackingInterval);
    }
  }

  // Tourist operations
  async createTourist(touristData: any): Promise<any> {
    const tourist = {
      id: Date.now().toString(),
      ...touristData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    this.tourists.push(tourist);
    return tourist;
  }

  async findAllTourists(): Promise<any[]> {
    return this.tourists;
  }

  async findAllTouristsWithCurrentLocation(): Promise<any[]> {
    return this.tourists.map(tourist => ({
      ...tourist,
      lastLocationUpdate: this.getLastLocationUpdate(tourist.id)
    }));
  }

  private getLastLocationUpdate(touristId: string): Date | null {
    const touristLocations = this.locations
      .filter(l => l.touristId === touristId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return touristLocations.length > 0 ? touristLocations[0].timestamp : null;
  }

  async findTouristById(id: string): Promise<any | null> {
    return this.tourists.find(t => t.id === id) || null;
  }

  async updateTourist(id: string, updateData: any): Promise<any> {
    const index = this.tourists.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.tourists[index] = {
      ...this.tourists[index],
      ...updateData,
      updatedAt: new Date(),
    };
    return this.tourists[index];
  }

  async updateTouristLocation(id: string, location: { latitude: number; longitude: number; address?: string }): Promise<any> {
    const index = this.tourists.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.tourists[index] = {
      ...this.tourists[index],
      currentLocation: location,
      updatedAt: new Date(),
    };
    return this.tourists[index];
  }

  // Location operations
  async createLocation(locationData: any): Promise<any> {
    const location = {
      id: Date.now().toString(),
      ...locationData,
      timestamp: new Date(),
    };
    this.locations.push(location);
    return location;
  }

  async getTouristLocations(touristId: string): Promise<any[]> {
    return this.locations.filter(l => l.touristId === touristId);
  }

  // Alert operations
  async createAlert(alertData: any): Promise<any> {
    const alert = {
      id: Date.now().toString(),
      ...alertData,
      createdAt: new Date(),
      status: 'ACTIVE',
    };
    this.alerts.push(alert);
    return alert;
  }

  async getTouristAlerts(touristId: string): Promise<any[]> {
    return this.alerts.filter(a => a.touristId === touristId);
  }

  // Geofence operations
  async createGeofence(geofenceData: any): Promise<any> {
    const geofence = {
      id: Date.now().toString(),
      ...geofenceData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    this.geofences.push(geofence);
    return geofence;
  }

  async getActiveGeofences(): Promise<any[]> {
    return this.geofences.filter(g => g.isActive);
  }

  // Utility methods
  async detectInactivity(): Promise<any[]> {
    const inactiveTourists: any[] = [];
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);

    for (const tourist of this.tourists) {
      if (!tourist.isActive) continue;

      const recentLocations = this.locations
        .filter(l => l.touristId === tourist.id)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (recentLocations.length === 0) continue;

      const lastLocation = recentLocations[0];
      const timeSinceLastLocation = Date.now() - lastLocation.timestamp.getTime();

      if (timeSinceLastLocation > (30 * 60 * 1000)) {
        inactiveTourists.push({
          tourist,
          lastLocation,
          inactiveMinutes: Math.floor(timeSinceLastLocation / (1000 * 60)),
        });
      }
    }

    return inactiveTourists;
  }

  async detectInactivityForTourist(touristId: string): Promise<boolean> {
    const recentLocations = this.locations
      .filter(l => l.touristId === touristId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (recentLocations.length === 0) return false;

    const lastLocation = recentLocations[0];
    const timeSinceLastLocation = Date.now() - lastLocation.timestamp.getTime();
    const inactivityThreshold = 30 * 60 * 1000; // 30 minutes

    return timeSinceLastLocation > inactivityThreshold;
  }

  async getNearbyTourists(lat: number, lng: number, radius: number = 1): Promise<any[]> {
    const nearbyTourists: any[] = [];

    // Get all tourists with their latest locations
    for (const tourist of this.tourists) {
      const touristLocations = this.locations
        .filter(l => l.touristId === tourist.id)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (touristLocations.length === 0) continue;

      const lastLocation = touristLocations[0];
      const distance = this.calculateDistance(
        lat, lng,
        lastLocation.latitude,
        lastLocation.longitude
      );

      if (distance <= radius) {
        const inactiveMinutes = Math.floor((Date.now() - lastLocation.timestamp.getTime()) / (1000 * 60));
        const activityStatus = inactiveMinutes > 30 ? 'inactive' : 'active';

        nearbyTourists.push({
          tourist,
          location: lastLocation,
          distance: Math.round(distance * 1000), // Convert to meters
          activityStatus,
        });
      }
    }

    return nearbyTourists;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Digital ID Management Methods
  async createDigitalId(digitalIdData: any): Promise<any> {
    const digitalId = {
      ...digitalIdData,
      id: digitalIdData.id || `digital_id_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.digitalIds.push(digitalId);
    this.logger.log(`🆔 Digital ID created: ${digitalId.digitalIdNumber}`);
    return digitalId;
  }

  async findDigitalIdById(id: string): Promise<any | null> {
    return this.digitalIds.find(digitalId => digitalId.id === id) || null;
  }

  async findDigitalIdByNumber(digitalIdNumber: string): Promise<any | null> {
    return this.digitalIds.find(digitalId => digitalId.digitalIdNumber === digitalIdNumber) || null;
  }

  async findDigitalIdByTouristId(touristId: string): Promise<any | null> {
    return this.digitalIds.find(digitalId => digitalId.touristId === touristId) || null;
  }

  async findAllDigitalIds(): Promise<any[]> {
    return this.digitalIds;
  }

  async updateDigitalId(id: string, updateData: any): Promise<any | null> {
    const index = this.digitalIds.findIndex(digitalId => digitalId.id === id);
    if (index === -1) return null;

    this.digitalIds[index] = {
      ...this.digitalIds[index],
      ...updateData,
      updatedAt: new Date()
    };

    this.logger.log(`🆔 Digital ID updated: ${this.digitalIds[index].digitalIdNumber}`);
    return this.digitalIds[index];
  }

  async deleteDigitalId(id: string): Promise<boolean> {
    const index = this.digitalIds.findIndex(digitalId => digitalId.id === id);
    if (index === -1) return false;

    const deleted = this.digitalIds.splice(index, 1)[0];
    this.logger.log(`🆔 Digital ID deleted: ${deleted.digitalIdNumber}`);
    return true;
  }
}
