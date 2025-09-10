import { Injectable } from '@nestjs/common';

// Mock database service for development
@Injectable()
export class MockDatabaseService {
  private tourists: any[] = [];
  private locations: any[] = [];
  private alerts: any[] = [];
  private geofences: any[] = [];

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
      isResolved: false,
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
}
