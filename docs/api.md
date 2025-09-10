# docs/api.md
# Smart Tourist Safety API Documentation

## Overview

The Smart Tourist Safety API provides comprehensive monitoring and incident response capabilities for tourist safety in sensitive regions. Built with NestJS, it offers real-time tracking, emergency response, and AI-powered analytics.

## Base URL
- **Development:** `http://localhost:3000/api/v1`
- **Production:** `https://your-domain.com/api/v1`

## Authentication

All protected endpoints require a Bearer token:

```http
Authorization: Bearer 
```

### Roles
- `tourist` - Regular tourists with basic access
- `police` - Law enforcement with alert management
- `tourism_admin` - Tourism department administrators
- `emergency` - Emergency responders
- `system_admin` - Full system access

## Core Endpoints

### Authentication API

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+91-9876543210",
  "role": "tourist"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer 
```

### Tourist Management API

#### Create Digital ID
```http
POST /tourist/digital-id
Authorization: Bearer 
Content-Type: application/json

{
  "passportNumber": "A12345678",
  "nationality": "USA",
  "dateOfBirth": "1990-01-15",
  "kycData": {
    "aadhaarNumber": "1234-5678-9012",
    "address": "123 Main St, City, State",
    "emergencyContact": {
      "name": "Jane Doe",
      "phone": "+1-555-0123",
      "relationship": "spouse"
    }
  }
}
```

#### Update Itinerary
```http
PUT /tourist/:id/itinerary
Authorization: Bearer 
Content-Type: application/json

{
  "destinations": [
    {
      "name": "Kaziranga National Park",
      "arrivalDate": "2024-03-15",
      "departureDate": "2024-03-17",
      "accommodation": "Kaziranga Resort",
      "activities": ["Wildlife Safari", "Bird Watching"]
    }
  ],
  "transportMode": "private_vehicle",
  "groupSize": 4
}
```

### Location Tracking API

#### Update Location
```http
POST /location/update
Authorization: Bearer 
Content-Type: application/json

{
  "latitude": 26.5775,
  "longitude": 93.1742,
  "accuracy": 5,
  "speed": 2.5,
  "timestamp": "2024-03-15T10:30:00Z"
}
```

#### Get Location History
```http
GET /location/:touristId/history?start=2024-03-15T00:00:00Z&end=2024-03-16T00:00:00Z
Authorization: Bearer 
```

#### Batch Location Update
```http
POST /location/batch
Authorization: Bearer 
Content-Type: application/json

{
  "locations": [
    {
      "latitude": 26.5775,
      "longitude": 93.1742,
      "timestamp": "2024-03-15T10:30:00Z"
    },
    {
      "latitude": 26.5780,
      "longitude": 93.1745,
      "timestamp": "2024-03-15T10:32:00Z"
    }
  ]
}
```

### Emergency Alerts API

#### Trigger SOS Alert
```http
POST /alerts/sos
Authorization: Bearer 
Content-Type: application/json

{
  "latitude": 26.5775,
  "longitude": 93.1742,
  "message": "Emergency situation - need immediate help",
  "severity": "critical"
}
```

#### Get Alerts
```http
GET /alerts?status=active&severity=high&limit=20&offset=0
Authorization: Bearer 
```

#### Acknowledge Alert
```http
PUT /alerts/:id/acknowledge
Authorization: Bearer 
Content-Type: application/json

{
  "response": "Unit dispatched - ETA 15 minutes",
  "responderId": "officer-123"
}
```

### IoT Device API

#### Pair Device
```http
POST /iot/devices/:deviceId/pair/:touristId
Authorization: Bearer 
```

#### Send Command to Device
```http
POST /iot/devices/:deviceId/command
Authorization: Bearer 
Content-Type: application/json

{
  "command": "locate",
  "parameters": {
    "interval": 60
  }
}
```

#### Get Device Status
```http
GET /iot/devices/:deviceId/status
Authorization: Bearer 
```

### Dashboard Analytics API

#### Get Dashboard Statistics
```http
GET /dashboard/statistics?period=7d
Authorization: Bearer 
```

#### Generate Heatmap Data
```http
GET /dashboard/heatmap?start=2024-03-15T00:00:00Z&end=2024-03-16T00:00:00Z&bounds=26.5,93.1,26.6,93.2
Authorization: Bearer 
```

#### Get Risk Assessment
```http
POST /ai/assess-risk
Authorization: Bearer 
Content-Type: application/json

{
  "touristId": "tourist-uuid",
  "location": {
    "latitude": 26.5775,
    "longitude": 93.1742
  },
  "timeOfDay": "22:30",
  "weather": "heavy_rain"
}
```

## WebSocket Events

Connect to: `ws://localhost:3000/api/v1/ws`

### Client Events
- `join-room`: Join monitoring room
- `location-update`: Real-time location updates
- `alert-trigger`: Emergency alert triggered

### Server Events
- `alert-notification`: New alert notification
- `location-broadcast`: Location updates from tracked tourists
- `system-announcement`: System-wide announcements

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-03-15T10:30:00Z",
  "path": "/api/v1/auth/login"
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limits
- **General API**: 100 requests per 15 minutes
- **Location Updates**: 1000 requests per hour
- **Emergency Alerts**: 10 requests per minute