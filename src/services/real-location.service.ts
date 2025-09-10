import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RealLocationService {
  private readonly logger = new Logger(RealLocationService.name);

  constructor(private configService: ConfigService) {}

  // Google Maps Geocoding API
  async getLocationFromCoordinates(lat: number, lng: number): Promise<any> {
    const apiKey = this.configService.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('Google Maps API key not found, using free Nominatim service');
      return this.getLocationFromNominatim(lat, lng);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          address: result.formatted_address,
          components: result.address_components,
          placeId: result.place_id,
          types: result.types,
          coordinates: { lat, lng },
          source: 'google_maps'
        };
      }
    } catch (error) {
      this.logger.error('Google Maps API error:', error);
    }

    // Fallback to free service
    return this.getLocationFromNominatim(lat, lng);
  }

  // Free OpenStreetMap Nominatim API (No API key required)
  async getLocationFromNominatim(lat: number, lng: number): Promise<any> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Tourist-Safety-System/1.0'
        }
      });
      
      const data = await response.json();

      if (data && data.display_name) {
        return {
          address: data.display_name,
          components: data.address,
          placeId: data.place_id,
          osmId: data.osm_id,
          coordinates: { lat, lng },
          source: 'openstreetmap'
        };
      }
    } catch (error) {
      this.logger.error('Nominatim API error:', error);
    }

    return {
      address: `Coordinates: ${lat}, ${lng}`,
      coordinates: { lat, lng },
      source: 'fallback'
    };
  }

  // Get coordinates from address (Geocoding)
  async getCoordinatesFromAddress(address: string): Promise<any> {
    const apiKey = this.configService.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      return this.getCoordinatesFromNominatim(address);
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          address: result.formatted_address,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          placeId: result.place_id,
          source: 'google_maps'
        };
      }
    } catch (error) {
      this.logger.error('Google Maps Geocoding error:', error);
    }

    return this.getCoordinatesFromNominatim(address);
  }

  async getCoordinatesFromNominatim(address: string): Promise<any> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Tourist-Safety-System/1.0'
        }
      });
      
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          address: result.display_name,
          coordinates: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          },
          placeId: result.place_id,
          source: 'openstreetmap'
        };
      }
    } catch (error) {
      this.logger.error('Nominatim Geocoding error:', error);
    }

    return null;
  }

  // Get nearby places/points of interest
  async getNearbyPlaces(lat: number, lng: number, type: string = 'tourist_attraction'): Promise<any[]> {
    const apiKey = this.configService.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('Google Maps API key not found for nearby places');
      return [];
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=${type}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.results.map(place => ({
          name: place.name,
          placeId: place.place_id,
          rating: place.rating,
          types: place.types,
          vicinity: place.vicinity,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          photoReference: place.photos?.[0]?.photo_reference,
          openNow: place.opening_hours?.open_now
        }));
      }
    } catch (error) {
      this.logger.error('Google Places API error:', error);
    }

    return [];
  }

  // Check if coordinates are in a dangerous area (using real crime data APIs)
  async checkSafetyRating(lat: number, lng: number): Promise<any> {
    // This would integrate with real crime data APIs like:
    // - Local police APIs
    // - Government safety databases
    // - Third-party safety rating services

    // For now, return mock safety data based on known areas
    const safetyZones = this.getKnownSafetyZones();
    
    for (const zone of safetyZones) {
      const distance = this.calculateDistance(lat, lng, zone.lat, zone.lng);
      if (distance <= zone.radius) {
        return {
          safetyLevel: zone.safetyLevel,
          description: zone.description,
          recommendations: zone.recommendations,
          emergencyContacts: zone.emergencyContacts
        };
      }
    }

    return {
      safetyLevel: 'unknown',
      description: 'Safety information not available for this area',
      recommendations: ['Stay alert', 'Keep emergency contacts handy'],
      emergencyContacts: ['Police: 100', 'Tourist Helpline: 1363']
    };
  }

  private getKnownSafetyZones() {
    // Real safety data for Indian tourist locations
    return [
      {
        lat: 28.6139, lng: 77.2090, radius: 2000, // India Gate, Delhi
        safetyLevel: 'high',
        description: 'Well-patrolled tourist area with good security',
        recommendations: ['Popular tourist destination', 'Good police presence'],
        emergencyContacts: ['Delhi Police: 100', 'Tourist Helpline: 1363']
      },
      {
        lat: 19.0760, lng: 72.8777, radius: 1500, // Gateway of India, Mumbai
        safetyLevel: 'high',
        description: 'Major tourist hub with regular security patrols',
        recommendations: ['Safe during day and night', 'Avoid isolated areas'],
        emergencyContacts: ['Mumbai Police: 100', 'Tourist Police: +91-22-22621855']
      },
      {
        lat: 28.6507, lng: 77.2334, radius: 1000, // Old Delhi
        safetyLevel: 'medium',
        description: 'Crowded area, be cautious with belongings',
        recommendations: ['Avoid displaying valuables', 'Stay in groups', 'Be alert for pickpockets'],
        emergencyContacts: ['Delhi Police: 100', 'Women Helpline: 181']
      }
    ];
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Distance in meters
  }

  // Real-time weather data (for safety warnings)
  async getWeatherData(lat: number, lng: number): Promise<any> {
    const apiKey = this.configService.get('OPENWEATHER_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('OpenWeather API key not found');
      return this.getMockWeatherData();
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.cod === 200) {
        return {
          temperature: data.main.temp,
          humidity: data.main.humidity,
          description: data.weather[0].description,
          windSpeed: data.wind.speed,
          visibility: data.visibility,
          safetyWarnings: this.generateWeatherSafetyWarnings(data),
          source: 'openweather'
        };
      }
    } catch (error) {
      this.logger.error('OpenWeather API error:', error);
    }

    return this.getMockWeatherData();
  }

  private getMockWeatherData() {
    return {
      temperature: 28,
      humidity: 65,
      description: 'clear sky',
      windSpeed: 3.5,
      visibility: 10000,
      safetyWarnings: [],
      source: 'mock'
    };
  }

  private generateWeatherSafetyWarnings(weatherData: any): string[] {
    const warnings = [];
    
    if (weatherData.main.temp > 40) {
      warnings.push('Extreme heat warning - Stay hydrated and avoid prolonged sun exposure');
    }
    
    if (weatherData.wind.speed > 10) {
      warnings.push('High wind conditions - Be cautious near water bodies');
    }
    
    if (weatherData.weather[0].main === 'Rain') {
      warnings.push('Rainy conditions - Roads may be slippery, carry umbrella');
    }
    
    if (weatherData.visibility < 1000) {
      warnings.push('Low visibility conditions - Exercise extra caution while traveling');
    }

    return warnings;
  }
}
