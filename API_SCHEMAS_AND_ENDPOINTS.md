# 📊 Tourist Safety System - Complete API Schema & Endpoints Documentation

## 🎯 Base URL
```
http://localhost:3000/api
```

## 📚 API Documentation URL
```
http://localhost:3000/api/docs (Swagger UI)
```

---

## 📋 1. HEALTH CHECK ENDPOINTS

### **GET /health**
**Description**: Complete system health check
**Response Schema**:
```json
{
  "status": "ok",
  "timestamp": "2025-09-10T15:45:32.123Z",
  "uptime": 3600,
  "memory": {
    "rss": 123456789,
    "heapTotal": 123456789,
    "heapUsed": 123456789,
    "external": 123456789
  },
  "version": "v18.17.0",
  "service": "Smart Tourist Safety Backend",
  "ip": "192.168.0.104",
  "database": "PostgreSQL",
  "message": "System is running smoothly! 🚀"
}
```

### **GET /health/simple**
**Description**: Simple health status check
**Response Schema**:
```json
{
  "status": "ok",
  "timestamp": "2025-09-10T15:45:32.123Z"
}
```

---

## 👥 2. TOURIST MANAGEMENT ENDPOINTS

### **POST /tourist**
**Description**: Register a new tourist
**Request Schema (CreateTouristDto)**:
```json
{
  "email": "john.doe@email.com",           // Required, string, valid email
  "firstName": "John",                     // Required, string
  "lastName": "Doe",                       // Required, string
  "phoneNumber": "+91-9999999999",         // Optional, string
  "emergencyContact": "+91-8888888888",    // Optional, string
  "passportNumber": "US123456789",         // Optional, string
  "nationality": "American",               // Optional, string
  "currentLocation": {                     // Optional, object
    "latitude": 28.6139,                   // number
    "longitude": 77.2090,                  // number
    "address": "India Gate, New Delhi"     // string
  }
}
```
**Response Schema**:
```json
{
  "id": "tourist_1694847600123",
  "email": "john.doe@email.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+91-9999999999",
  "emergencyContact": "+91-8888888888",
  "passportNumber": "US123456789",
  "nationality": "American",
  "currentLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "India Gate, New Delhi"
  },
  "isActive": true,
  "createdAt": "2025-09-10T15:45:32.123Z",
  "updatedAt": "2025-09-10T15:45:32.123Z"
}
```

### **GET /tourist**
**Description**: Get all tourists with pagination
**Query Parameters**:
- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 10)
- `withLocation`: boolean (optional, includes location data)

**Response Schema**:
```json
[
  {
    "id": "tourist_1694847600123",
    "email": "john.doe@email.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+91-9999999999",
    "emergencyContact": "+91-8888888888",
    "nationality": "American",
    "isActive": true,
    "createdAt": "2025-09-10T15:45:32.123Z",
    "updatedAt": "2025-09-10T15:45:32.123Z",
    "lastLocationUpdate": "2025-09-10T15:45:32.123Z"  // if withLocation=true
  }
]
```

### **GET /tourist/:id**
**Description**: Get specific tourist by ID
**Path Parameters**:
- `id`: string (Tourist ID)

**Response Schema**: Same as POST /tourist response

### **PUT /tourist/:id**
**Description**: Update tourist information
**Path Parameters**:
- `id`: string (Tourist ID)
**Request Schema (UpdateTouristDto)**: Same as CreateTouristDto but all fields optional
**Response Schema**: Updated tourist object

### **DELETE /tourist/:id**
**Description**: Delete tourist
**Path Parameters**:
- `id`: string (Tourist ID)
**Response Schema**:
```json
{
  "message": "Tourist deleted successfully",
  "id": "tourist_1694847600123"
}
```

### **POST /tourist/:id/location**
**Description**: Update tourist location
**Path Parameters**:
- `id`: string (Tourist ID)
**Request Schema**:
```json
{
  "latitude": 28.6139,              // Required, number
  "longitude": 77.2090,             // Required, number
  "address": "India Gate, Delhi"    // Optional, string
}
```

### **GET /tourist/:id/status**
**Description**: Get tourist safety status
**Path Parameters**:
- `id`: string (Tourist ID)
**Response Schema**:
```json
{
  "touristId": "tourist_1694847600123",
  "isActive": true,
  "currentLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "India Gate, Delhi"
  },
  "lastUpdate": "2025-09-10T15:45:32.123Z",
  "safetyStatus": "safe",
  "alerts": 0,
  "inSafeZone": true
}
```

---

## 📍 3. LOCATION TRACKING ENDPOINTS

### **POST /location/update**
**Description**: Update tourist location with safety checks
**Request Schema**:
```json
{
  "touristId": "tourist_1694847600123",    // Required, string
  "latitude": 28.6139,                     // Required, number
  "longitude": 77.2090,                    // Required, number
  "address": "India Gate, Delhi",          // Optional, string
  "accuracy": 10                           // Optional, number (meters)
}
```
**Response Schema**:
```json
{
  "id": "location_1694847600123",
  "touristId": "tourist_1694847600123",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "India Gate, New Delhi, Delhi, India",
  "accuracy": 10,
  "timestamp": "2025-09-10T15:45:32.123Z",
  "safetyRating": "high",
  "weatherData": {
    "temperature": 28,
    "humidity": 65,
    "description": "clear sky",
    "safetyWarnings": []
  },
  "realLocationData": {
    "address": "India Gate, New Delhi, Delhi, India",
    "components": {},
    "placeId": "ChIJC03yNpjEDTkRkPCRaEgzH2s",
    "source": "google_maps"
  }
}
```

### **GET /location/current/:touristId**
**Description**: Get current location of tourist
**Path Parameters**:
- `touristId`: string (Tourist ID)
**Response Schema**:
```json
{
  "tourist": {
    "id": "tourist_1694847600123",
    "firstName": "John",
    "lastName": "Doe",
    "currentLocation": {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "address": "India Gate, Delhi"
    }
  },
  "currentLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "India Gate, Delhi"
  },
  "lastUpdate": "2025-09-10T15:45:32.123Z"
}
```

### **GET /location/history/:touristId**
**Description**: Get location history for tourist
**Path Parameters**:
- `touristId`: string (Tourist ID)
**Query Parameters**:
- `limit`: number (optional, default: 50)
- `hours`: number (optional, default: 24)
**Response Schema**:
```json
[
  {
    "id": "location_1694847600123",
    "touristId": "tourist_1694847600123",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "India Gate, Delhi",
    "accuracy": 10,
    "timestamp": "2025-09-10T15:45:32.123Z"
  }
]
```

### **GET /location/tracking/:touristId**
**Description**: Get tracking data for tourist
**Response Schema**:
```json
{
  "tourist": {
    "id": "tourist_1694847600123",
    "firstName": "John",
    "lastName": "Doe"
  },
  "currentLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "India Gate, Delhi"
  },
  "recentLocations": [
    {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "timestamp": "2025-09-10T15:45:32.123Z"
    }
  ],
  "isTracking": true
}
```

### **POST /location/bulk-update**
**Description**: Bulk update multiple locations
**Request Schema**:
```json
{
  "updates": [
    {
      "touristId": "tourist_1694847600123",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "timestamp": "2025-09-10T15:45:32.123Z",
      "accuracy": 10
    }
  ]
}
```

### **POST /location/detect-inactivity**
**Description**: Detect inactive tourists and trigger alerts
**Response Schema**:
```json
{
  "inactiveTourists": [
    {
      "tourist": {
        "id": "tourist_1694847600123",
        "firstName": "John",
        "lastName": "Doe"
      },
      "lastLocation": {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "timestamp": "2025-09-10T15:15:32.123Z"
      },
      "inactiveMinutes": 35
    }
  ],
  "alertsTriggered": 1
}
```

### **GET /location/activity-status/:touristId**
**Description**: Get tourist activity status
**Response Schema**:
```json
{
  "isActive": true,
  "lastLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "timestamp": "2025-09-10T15:45:32.123Z"
  },
  "inactiveMinutes": 0,
  "status": "active"
}
```

### **GET /location/nearby-coordinates**
**Description**: Find nearby tourists by coordinates
**Query Parameters**:
- `lat`: number (required, latitude)
- `lng`: number (required, longitude)
- `radius`: number (optional, default: 1, radius in km)
**Response Schema**:
```json
{
  "nearbyTourists": [
    {
      "tourist": {
        "id": "tourist_1694847600123",
        "firstName": "John",
        "lastName": "Doe"
      },
      "location": {
        "latitude": 28.6139,
        "longitude": 77.2090
      },
      "distance": 250,
      "activityStatus": "active"
    }
  ],
  "center": { "lat": 28.6139, "lng": 77.2090 },
  "radius": 1,
  "count": 1
}
```

---

## 🗺️ 4. GOOGLE MAPS INTEGRATION ENDPOINTS

### **GET /location/geocode/:address**
**Description**: Convert address to coordinates
**Path Parameters**:
- `address`: string (Address to geocode)
**Response Schema**:
```json
{
  "address": "India Gate, New Delhi, Delhi, India",
  "coordinates": {
    "lat": 28.6139,
    "lng": 77.2090
  },
  "placeId": "ChIJC03yNpjEDTkRkPCRaEgzH2s",
  "source": "google_maps"
}
```

### **GET /location/reverse-geocode**
**Description**: Convert coordinates to address
**Query Parameters**:
- `lat`: number (required, latitude)
- `lng`: number (required, longitude)
**Response Schema**:
```json
{
  "address": "India Gate, New Delhi, Delhi, India",
  "components": {
    "country": "India",
    "state": "Delhi",
    "city": "New Delhi",
    "postal_code": "110003"
  },
  "placeId": "ChIJC03yNpjEDTkRkPCRaEgzH2s",
  "coordinates": { "lat": 28.6139, "lng": 77.2090 },
  "source": "google_maps"
}
```

### **GET /location/nearby-places**
**Description**: Find nearby places of interest
**Query Parameters**:
- `lat`: number (required, latitude)
- `lng`: number (required, longitude)
- `type`: string (optional, place type: hospital, police, tourist_attraction, restaurant, etc.)
**Response Schema**:
```json
[
  {
    "name": "All India Institute of Medical Sciences",
    "placeId": "ChIJXQYm9M3DDTkRWx2Vs4hLHbA",
    "rating": 4.2,
    "types": ["hospital", "establishment"],
    "vicinity": "Ansari Nagar, New Delhi",
    "coordinates": {
      "lat": 28.5672,
      "lng": 77.2100
    },
    "photoReference": "photo_reference_string",
    "openNow": true
  }
]
```

### **GET /location/safety-rating**
**Description**: Get safety rating for location
**Query Parameters**:
- `lat`: number (required, latitude)
- `lng`: number (required, longitude)
**Response Schema**:
```json
{
  "safetyLevel": "high",
  "description": "Well-patrolled tourist area with good security",
  "recommendations": [
    "Popular tourist destination",
    "Good police presence"
  ],
  "emergencyContacts": [
    "Delhi Police: 100",
    "Tourist Helpline: 1363"
  ]
}
```

### **GET /location/weather**
**Description**: Get weather data for location
**Query Parameters**:
- `lat`: number (required, latitude)
- `lng`: number (required, longitude)
**Response Schema**:
```json
{
  "temperature": 28,
  "humidity": 65,
  "description": "clear sky",
  "windSpeed": 3.5,
  "visibility": 10000,
  "safetyWarnings": [],
  "source": "openweather"
}
```

---

## 🚨 5. EMERGENCY SERVICES ENDPOINTS

### **POST /emergency/sos**
**Description**: Trigger SOS alert
**Request Schema**:
```json
{
  "touristId": "tourist_1694847600123",     // Required, string
  "message": "Need immediate help",         // Optional, string
  "location": {                             // Optional, object
    "latitude": 28.6139,                    // number
    "longitude": 77.2090                    // number
  }
}
```
**Response Schema**:
```json
{
  "id": "alert_1694847600123",
  "type": "sos",
  "severity": "critical",
  "message": "Need immediate help",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "touristId": "tourist_1694847600123",
  "createdAt": "2025-09-10T15:45:32.123Z",
  "isResolved": false
}
```

### **POST /emergency/alert**
**Description**: Send emergency alert
**Request Schema**:
```json
{
  "touristId": "tourist_1694847600123",     // Required, string
  "type": "safety_concern",                 // Required, string
  "message": "Feeling unsafe",              // Required, string
  "severity": "high",                       // Required, string (low, medium, high, critical)
  "location": {                             // Optional, object
    "latitude": 28.6139,                    // number
    "longitude": 77.2090,                   // number
    "address": "India Gate, Delhi"          // string
  }
}
```

### **GET /emergency/alerts/:touristId**
**Description**: Get alerts for tourist
**Path Parameters**:
- `touristId`: string (Tourist ID)
**Response Schema**:
```json
[
  {
    "id": "alert_1694847600123",
    "type": "sos",
    "severity": "critical",
    "message": "Need immediate help",
    "location": {
      "latitude": 28.6139,
      "longitude": 77.2090
    },
    "touristId": "tourist_1694847600123",
    "createdAt": "2025-09-10T15:45:32.123Z",
    "isResolved": false
  }
]
```

### **POST /emergency/fir**
**Description**: File FIR (First Information Report)
**Request Schema**:
```json
{
  "touristId": "tourist_1694847600123",     // Required, string
  "incidentType": "theft",                  // Required, string
  "description": "Mobile phone stolen",     // Required, string
  "location": {                             // Required, object
    "latitude": 28.6139,                    // number
    "longitude": 77.2090,                   // number
    "address": "India Gate, Delhi"          // string
  },
  "incidentTime": "2025-09-10T15:45:32.123Z" // Required, ISO date string
}
```
**Response Schema**:
```json
{
  "firNumber": "FIR-1694847600123-ABC123",
  "message": "FIR filed successfully with local authorities"
}
```

### **GET /emergency/fir/:touristId**
**Description**: Get FIRs for tourist
**Path Parameters**:
- `touristId`: string (Tourist ID)
**Response Schema**:
```json
[
  {
    "id": "alert_1694847600123",
    "type": "security_threat",
    "severity": "high",
    "message": "FIR Filed: theft - Mobile phone stolen",
    "location": {
      "latitude": 28.6139,
      "longitude": 77.2090
    },
    "touristId": "tourist_1694847600123",
    "createdAt": "2025-09-10T15:45:32.123Z"
  }
]
```

### **POST /emergency/sms-alert**
**Description**: Send SMS alert
**Request Schema**:
```json
{
  "touristId": "tourist_1694847600123",     // Required, string
  "message": "Emergency alert message",     // Required, string
  "numbers": ["+91-9999999999"]             // Optional, array of strings
}
```
**Response Schema**:
```json
{
  "success": true,
  "message": "SMS alert sent to 1 numbers"
}
```

### **POST /emergency/call-emergency**
**Description**: Initiate emergency call
**Request Schema**:
```json
{
  "touristId": "tourist_1694847600123",     // Required, string
  "emergencyType": "medical",               // Required, string
  "location": {                             // Optional, object
    "latitude": 28.6139,                    // number
    "longitude": 77.2090                    // number
  }
}
```
**Response Schema**:
```json
{
  "success": true,
  "callId": "CALL-1694847600123-XYZ789",
  "message": "Emergency call initiated with local authorities"
}
```

---

## 📊 6. DATA SCHEMAS SUMMARY

### **Tourist Schema**
```typescript
{
  id: string;                    // Unique identifier
  email: string;                 // Email address (required)
  firstName: string;             // First name (required)
  lastName: string;              // Last name (required)
  phoneNumber?: string;          // Phone number (optional)
  emergencyContact?: string;     // Emergency contact (optional)
  passportNumber?: string;       // Passport number (optional)
  nationality?: string;          // Nationality (optional)
  currentLocation?: {            // Current location (optional)
    latitude: number;
    longitude: number;
    address?: string;
  };
  isActive: boolean;             // Active status
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last update timestamp
}
```

### **Location Schema**
```typescript
{
  id: string;                    // Unique identifier
  touristId: string;             // Tourist ID reference
  latitude: number;              // Latitude coordinate
  longitude: number;             // Longitude coordinate
  address?: string;              // Human-readable address
  accuracy?: number;             // GPS accuracy in meters
  timestamp: Date;               // Location timestamp
}
```

### **Alert Schema**
```typescript
{
  id: string;                    // Unique identifier
  type: string;                  // Alert type (sos, safety_concern, etc.)
  severity: string;              // Severity level (low, medium, high, critical)
  message: string;               // Alert message
  location?: {                   // Location data
    latitude: number;
    longitude: number;
    address?: string;
  };
  touristId: string;             // Tourist ID reference
  createdAt: Date;              // Creation timestamp
  isResolved: boolean;          // Resolution status
}
```

### **Geofence Schema**
```typescript
{
  id: string;                    // Unique identifier
  name: string;                  // Geofence name
  type: string;                  // Type (SAFE_ZONE, RESTRICTED_ZONE)
  centerLatitude: number;        // Center latitude
  centerLongitude: number;       // Center longitude
  radius: number;                // Radius in meters
  alertMessage: string;          // Alert message
  isActive: boolean;            // Active status
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last update timestamp
}
```

---

## 🎯 7. RESPONSE STATUS CODES

### **Success Codes**
- `200`: OK - Request successful
- `201`: Created - Resource created successfully

### **Error Codes**
- `400`: Bad Request - Invalid request data
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

---

## 🚀 8. AUTHENTICATION & HEADERS

### **Required Headers**
```
Content-Type: application/json
```

### **Optional Headers**
```
Authorization: Bearer <token>  // For future implementation
```

---

This documentation covers all available endpoints and schemas in your Tourist Safety System. The API is production-ready with comprehensive CRUD operations, real-time tracking, emergency services, and Google Maps integration!
