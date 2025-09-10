# Smart Tourist Safety Monitoring System - API Guide

## Overview
This backend system provides comprehensive tourist safety monitoring with real-time location tracking, geofencing, emergency alerts, weather monitoring, and automated safety features. The system supports both mock data simulation for development and real API integration for production deployment.

## Features
- 🎯 **Real-time Location Tracking** with automatic updates
- 🛡️ **Geofencing & Safety Zones** with instant alerts  
- 🚨 **Emergency SOS & Alert System** with SMS notifications
- 🌦️ **Weather-based Safety Warnings** using real APIs
- 📍 **Smart Location Services** with Google Maps & OpenStreetMap
- 📱 **Automated FIR Filing** for security incidents
- 📊 **Tourist Activity Monitoring** with inactivity detection
- 🔄 **Mock Data Simulation** for testing and development

## Quick Start

### 1. Installation
```bash
cd SIH-25
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure API keys:

```env
# Database
DATABASE_URL="your-database-url"

# Google APIs (Optional - for enhanced features)
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Weather API (Optional - for weather alerts)
OPENWEATHER_API_KEY="your-openweather-api-key"

# Alternative Maps APIs (Optional)
HERE_API_KEY="your-here-api-key"
MAPBOX_API_KEY="your-mapbox-api-key"

# Server Configuration
PORT=4567
```

### 3. Start Development Server
```bash
npm run start:dev
```

The server will start on `http://localhost:4567`

## API Documentation

### Base URL
```
http://localhost:4567
```

### Swagger Documentation
Visit `http://localhost:4567/api` for interactive API documentation.

## Tourist Management APIs

### 1. Register Tourist
```http
POST /tourists/register
Content-Type: application/json

{
  "name": "John Doe",
  "phoneNumber": "+919876543210",
  "email": "john@example.com",
  "emergencyContact": "+911234567890",
  "passportNumber": "A12345678",
  "nationality": "Indian"
}
```

### 2. Get All Tourists
```http
GET /tourists
```

### 3. Get Tourist Details
```http
GET /tourists/{touristId}
```

### 4. Update Tourist Profile
```http
PUT /tourists/{touristId}
Content-Type: application/json

{
  "name": "Updated Name",
  "phoneNumber": "+919876543210"
}
```

## Location Tracking APIs

### 1. Update Tourist Location
```http
POST /location/update
Content-Type: application/json

{
  "touristId": "tourist_123",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "accuracy": 5
}
```

**Enhanced Features:**
- Automatic address resolution using real APIs
- Safety rating assessment
- Weather condition checking
- Automatic emergency alerts for unsafe areas

### 2. Get Current Location
```http
GET /location/current/{touristId}
```

### 3. Get Location History
```http
GET /location/history/{touristId}?limit=50
```

### 4. Get Real-time Tracking Data
```http
GET /location/tracking/{touristId}
```

### 5. Detect Tourist Inactivity
```http
POST /location/detect-inactivity
```

### 6. Find Nearby Tourists
```http
GET /location/nearby-coordinates?lat=28.6139&lng=77.2090&radius=1
```

## Real Location Services APIs

### 1. Geocode Address
```http
GET /location/geocode/{address}
```
Example: `GET /location/geocode/India Gate, New Delhi`

### 2. Reverse Geocode
```http
GET /location/reverse-geocode?lat=28.6139&lng=77.2090
```

### 3. Get Safety Rating
```http
GET /location/safety-rating?lat=28.6139&lng=77.2090
```

### 4. Get Weather Data
```http
GET /location/weather?lat=28.6139&lng=77.2090
```

### 5. Find Nearby Places
```http
GET /location/nearby-places?lat=28.6139&lng=77.2090&type=hospital
```

**Supported place types:**
- `hospital` - Medical facilities
- `police` - Police stations
- `tourist_attraction` - Tourist spots
- `restaurant` - Dining options

## Emergency & Safety APIs

### 1. Trigger SOS Alert
```http
POST /emergency/sos
Content-Type: application/json

{
  "touristId": "tourist_123",
  "message": "Emergency help needed",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

### 2. Send Custom Alert
```http
POST /emergency/alert
Content-Type: application/json

{
  "touristId": "tourist_123",
  "type": "safety_warning",
  "message": "Area under security alert",
  "severity": "high",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Red Fort, Delhi"
  }
}
```

### 3. File FIR (First Information Report)
```http
POST /emergency/fir
Content-Type: application/json

{
  "touristId": "tourist_123",
  "incidentType": "theft",
  "description": "Mobile phone stolen near tourist area",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Connaught Place, Delhi"
  },
  "incidentTime": "2024-01-15T10:30:00Z"
}
```

### 4. Get Tourist Alerts
```http
GET /emergency/alerts/{touristId}
```

### 5. Get Tourist FIRs
```http
GET /emergency/fir/{touristId}
```

### 6. Send SMS Alert
```http
POST /emergency/sms
Content-Type: application/json

{
  "touristId": "tourist_123",
  "message": "Emergency alert: Tourist needs assistance",
  "numbers": ["+919876543210", "+911234567890"]
}
```

### 7. Initiate Emergency Call
```http
POST /emergency/call
Content-Type: application/json

{
  "touristId": "tourist_123",
  "emergencyType": "MEDICAL_EMERGENCY",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

## Mock Data Simulation

The system comes with comprehensive mock data for immediate testing:

### Sample Tourists
- **Tourist 1**: Delhi-based with Red Fort area tracking
- **Tourist 2**: Mumbai-based with Gateway of India tracking  
- **Tourist 3**: Bangalore-based with Lalbagh tracking

### Automatic Features
- **Real-time location updates** every 30 seconds
- **Realistic movement simulation** within city boundaries
- **Sample geofences** for safety zone testing
- **Location history generation** for comprehensive tracking

### Sample API Calls
```bash
# Get all sample tourists
curl http://localhost:4567/tourists

# Get real-time tracking for sample tourist
curl http://localhost:4567/location/tracking/tourist_1

# Check nearby tourists from India Gate
curl "http://localhost:4567/location/nearby-coordinates?lat=28.6139&lng=77.2090&radius=5"
```

## Production Deployment

### 1. API Keys Setup
Configure these APIs for enhanced features:

**Google Maps Platform:**
- Geocoding API
- Places API  
- Maps JavaScript API

**OpenWeather API:**
- Current Weather Data
- Weather Alerts

### 2. Environment Variables
```env
NODE_ENV=production
GOOGLE_MAPS_API_KEY=your_actual_api_key
OPENWEATHER_API_KEY=your_actual_api_key
DATABASE_URL=your_production_db_url
```

### 3. Build and Deploy
```bash
npm run build
npm run start:prod
```

## Integration Examples

### Flutter Integration
```dart
// Update tourist location
final response = await http.post(
  Uri.parse('http://localhost:4567/location/update'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'touristId': 'tourist_123',
    'latitude': 28.6139,
    'longitude': 77.2090,
    'accuracy': 5.0
  })
);
```

### Web Frontend Integration
```javascript
// Register new tourist
const response = await fetch('http://localhost:4567/tourists/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify({
    name: 'Jane Doe',
    phoneNumber: '+919876543210',
    email: 'jane@example.com'
  })
});

const tourist = await response.json();
```

## Error Handling

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Resource not found
- `500` - Internal server error

### Error Response Format
```json
{
  "statusCode": 404,
  "message": "Tourist not found",
  "error": "Not Found"
}
```

## WebSocket Support (Future Enhancement)

The system is designed to support real-time WebSocket connections for:
- Live location updates
- Instant emergency alerts
- Real-time safety notifications
- Activity status changes

## Monitoring & Logging

### Console Logs
- 🚨 Emergency alerts with details
- 📱 SMS notifications
- 📞 Emergency call initiations
- 📄 FIR filing confirmations
- 📍 Location tracking updates

### Health Check
```http
GET /health
```

## Support & Documentation

- **Swagger UI**: `http://localhost:4567/api`
- **Health Status**: `http://localhost:4567/health`
- **CORS Enabled**: Ready for frontend integration
- **Mock Data**: Instant testing capability
- **Real APIs**: Production-ready integration

## System Architecture

```
Frontend (Flutter/Web)
        ↓
    API Gateway
        ↓
  NestJS Backend
        ↓
┌─────────────────┐
│ Location Service│ ← Google Maps API
│ Emergency Service│ ← SMS/Call APIs  
│ Tourist Service │ ← Database
│ Real Location   │ ← Weather APIs
└─────────────────┘
```

This comprehensive API provides everything needed for a production-ready tourist safety monitoring system with both development simulation and real-world API integration capabilities.
