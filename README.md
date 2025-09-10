# Smart Tourist Safety Monitoring System - Backend

## 🌟 Overview

A comprehensive IoT-enabled backend system for tourist safety monitoring with real-time alerts, AI-powered anomaly detection, and blockchain-based digital identity management. Built for tourism authorities in regions like Northeast India.

## 🚀 Features

### Core Functionality
- **Digital Tourist ID Generation** - Blockchain-based secure identity management
- **Real-time Location Tracking** - GPS and IoT device integration
- **Emergency Response System** - SOS alerts with automated dispatch
- **AI Anomaly Detection** - Route deviation, fall detection, inactivity monitoring
- **Geofencing & Safety Zones** - Automated alerts for restricted/high-risk areas
- **Multi-channel Notifications** - SMS, WhatsApp, Push, Email alerts

### Advanced Features
- **Predictive Risk Assessment** - Weather, historical data, and behavioral analysis
- **Police/Tourism Dashboard** - Real-time monitoring and response management
- **IoT Device Management** - MQTT-based wearable device integration
- **Family Portal** - Opt-in location sharing for families
- **Multilingual Support** - 10+ Indian languages support
- **E-FIR Generation** - Automated incident report drafting

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   IoT Devices   │    │  Web Dashboard  │
│   (Tourists)    │    │  (Wearables)    │    │ (Police/Admin)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────────┐
         │                 API Gateway                         │
         └─────────────────────┬───────────────────────────────┘
                               │
    ┌──────────────────────────┼──────────────────────────────┐
    │                    NestJS Backend                       │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │
    │  │    Auth     │ │  Location   │ │     Alerts      │  │
    │  │   Module    │ │   Module    │ │    Module       │  │
    │  └─────────────┘ └─────────────┘ └─────────────────┘  │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │
    │  │     AI      │ │ Geofencing  │ │  Notifications  │  │
    │  │   Module    │ │   Module    │ │     Module      │  │
    │  └─────────────┘ └─────────────┘ └─────────────────┘  │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │
    │  │    IoT      │ │ Blockchain  │ │   Dashboard     │  │
    │  │   Module    │ │   Module    │ │     Module      │  │
    │  └─────────────┘ └─────────────┘ └─────────────────┘  │
    └──────────────────────────┬──────────────────────────────┘
                               │
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ PostgreSQL  │ │    Redis    │ │    MQTT     │ │ Blockchain  │
    │ + PostGIS   │ │   Cache     │ │   Broker    │ │  Network    │
    └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

## 📋 Prerequisites

- **Node.js** 18+ 
- **Docker** & **Docker Compose**
- **PostgreSQL** 15+ with PostGIS extension
- **Redis** 7+
- **MQTT Broker** (Mosquitto)

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-org/tourist-safety-backend.git
cd tourist-safety-backend
```

### 2. Production Setup (Docker)
```bash
# Make setup script executable
chmod +x scripts/setup.sh

# Run setup (creates services, databases, SSL certs)
./scripts/setup.sh
```

### 3. Development Setup
```bash
# Development environment setup
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh

# Start development server
npm run start:dev
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Essential Configuration
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_NAME=tourist_safety_db

# External Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
FIREBASE_PROJECT_ID=your_firebase_project

# Security
JWT_SECRET=your_super_secure_jwt_secret
ENCRYPTION_KEY=your_32_character_encryption_key

# Emergency Contacts
EMERGENCY_SMS_NUMBERS=+911234567890,+919876543210
EMERGENCY_EMAIL_ADDRESSES=emergency@police.gov.in
```

### API Keys Required

1. **Twilio** - SMS/WhatsApp notifications
2. **Firebase** - Push notifications  
3. **Mapbox** - Maps and geocoding
4. **Blockchain Network** - Digital ID management

## 📚 API Documentation

### Core Endpoints

#### Authentication
```
POST /api/v1/auth/register    - Register new user
POST /api/v1/auth/login       - User login
POST /api/v1/auth/refresh     - Refresh token
```

#### Tourist Management
```
GET  /api/v1/tourists/profile       - Get tourist profile
PUT  /api/v1/tourists/profile       - Update profile
POST /api/v1/tourists/digital-id    - Create digital ID
GET  /api/v1/tourists/digital-id    - Get digital ID
```

#### Location Tracking
```
POST /api/v1/locations/update       - Update current location
GET  /api/v1/locations/current      - Get current location
GET  /api/v1/locations/history      - Location history
POST /api/v1/locations/batch-update - Bulk location update
```

#### Emergency Alerts
```
POST /api/v1/alerts/sos            - Trigger SOS alert
POST /api/v1/alerts/panic          - Panic button
GET  /api/v1/alerts/my-alerts      - Get my alerts
PUT  /api/v1/alerts/:id/acknowledge - Acknowledge alert
```

#### IoT Device Management
```
POST /api/v1/iot/pair              - Pair device
GET  /api/v1/iot/my-device         - Get paired device
POST /api/v1/iot/my-device/unpair  - Unpair device
PUT  /api/v1/iot/my-device/config  - Update device config
```

#### Dashboard (Admin)
```
GET /api/v1/dashboard/overview      - Dashboard overview
GET /api/v1/dashboard/statistics    - Statistics summary
GET /api/v1/dashboard/heatmap       - Alert heatmap
GET /api/v1/dashboard/live-feed     - Live activity feed
```

### WebSocket Events

Connect to: `ws://localhost:3000/api/v1/ws?token=<jwt_token>`

```javascript
// Client Events
socket.emit('join_tourist_tracking', { touristId: 'uuid' });
socket.emit('subscribe_to_alerts');

// Server Events
socket.on('location_updated', (data) => { /* Handle location update */ });
socket.on('new_alert', (alert) => { /* Handle new alert */ });
socket.on('critical_alert', (alert) => { /* Handle critical alert */ });
```

## 🔗 MQTT Integration

### Topics Structure
```
iot/tourist/{touristId}/telemetry    - Regular telemetry data
iot/tourist/{touristId}/event        - SOS, button press, etc.
iot/tourist/{touristId}/status       - Device status updates
iot/device/{deviceId}/command        - Commands to device
```

### Sample Payloads

**Telemetry:**
```json
{
  "ts": "2025-09-08T16:00:00Z",
  "lat": 26.12345,
  "lng": 91.12345,
  "battery": 78,
  "hr": 72,
  "accel": {"x": 0.01, "y": 0.02, "z": 0.98},
  "speed": 1.2,
  "fix": "gps",
  "deviceStatus": "ok"
}
```

**SOS Event:**
```json
{
  "ts": "2025-09-08T16:02:10Z",
  "type": "SOS",
  "lat": 26.12350,
  "lng": 91.12350,
  "battery": 55,
  "msg": "Panic button pressed"
}
```

## 🤖 AI Features

### Anomaly Detection
- **Route Deviation** - Compares with planned itinerary
- **Speed Anomalies** - Sudden acceleration/deceleration
- **Fall Detection** - Accelerometer-based detection  
- **Prolonged Inactivity** - No movement for extended periods
- **Location Jumps** - Impossible travel distances/speeds

### Risk Assessment
- **Tourist Risk Scoring** - Based on behavior patterns
- **Area Risk Analysis** - Historical incident data
- **Predictive Analytics** - Weather and time-based risks
- **Pattern Recognition** - Unusual behavior identification

## 🔐 Security Features

### Data Protection
- **End-to-end Encryption** - AES-256 for sensitive data
- **Blockchain Identity** - Tamper-proof digital IDs
- **JWT Authentication** - Secure API access
- **Rate Limiting** - API abuse protection

### Privacy Compliance
- **Opt-in Tracking** - User consent required
- **Data Retention** - Configurable retention policies
- **Audit Logging** - All access logged
- **GDPR Compliance** - Data deletion capabilities

## 📊 Monitoring & Observability

### Health Checks
```bash
# Application health
curl http://localhost:3000/api/v1/health

# Service status
docker-compose ps

# View logs
docker-compose logs -f app
```

### Metrics Dashboard
- System performance metrics
- Alert response times  
- Device connectivity status
- Tourist activity patterns

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
```bash
# Clone to production server
git clone https://github.com/your-org/tourist-safety-backend.git
cd tourist-safety-backend

# Configure production environment
cp .env.example .env
# Edit .env with production values

# Deploy with SSL
./scripts/setup.sh
```

2. **SSL Configuration**
```bash
# Replace self-signed certs with real ones
cp /path/to/your/cert.pem ssl/
cp /path/to/your/key.pem ssl/

# Restart nginx
docker-compose restart nginx
```

3. **Backup Strategy**
```bash
# Database backup
docker-compose exec postgres pg_dump -U postgres tourist_safety_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres tourist_safety_db < backup.sql
```

### Scaling Options

**Horizontal Scaling:**
- Load balancer with multiple app instances
- Redis Cluster for cache scaling
- Read replicas for database

**Monitoring:**
- Prometheus + Grafana for metrics
- ELK Stack for log aggregation
- Uptime monitoring with alerts

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# Integration tests  
npm run test:e2e

# Coverage report
npm run test:cov
```

### API Testing
```bash
# Install test dependencies
npm install -g newman

# Run API tests
newman run postman_collection.json
```

## 🛠️ Development

### Project Structure
```
src/
├── common/           # Shared utilities, guards, filters
├── config/           # Configuration files
├── entities/         # Database entities
├── modules/          # Feature modules
│   ├── auth/         # Authentication
│   ├── tourist/      # Tourist management
│   ├── location/     # Location tracking
│   ├── alerts/       # Emergency alerts
│   ├── iot/          # IoT device management
│   ├── ai/           # AI and analytics
│   ├── dashboard/    # Admin dashboard
│   └── ...
├── migrations/       # Database migrations
└── main.ts          # Application entry point
```

### Adding New Features

1. **Create Module**
```bash
nest generate module feature-name
nest generate controller feature-name
nest generate service feature-name
```

2. **Add Database Entity**
```typescript
// src/entities/feature.entity.ts
@Entity('features')
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  // ... other fields
}
```

3. **Create Migration**
```bash
npm run migration:generate -- src/migrations/AddFeature
npm run migration:run
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

**MQTT Connection Issues:**
```bash
# Test MQTT connection
mosquitto_pub -h localhost -p 1883 -t test -m "hello"
mosquitto_sub -h localhost -p 1883 -t test

# Check broker logs
docker-compose logs mosquitto
```

**High Memory Usage:**
```bash
# Check container stats
docker stats

# Optimize Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
```

## 📞 Support

### Emergency Contacts
- **System Admin:** admin@touristsafety.gov.in
- **Technical Support:** support@touristsafety.gov.in
- **Emergency Hotline:** +91-1234-567-890

### Documentation
- **API Docs:** http://localhost:3000/api/docs
- **System Architecture:** [Architecture Guide](docs/architecture.md)
- **Deployment Guide:** [Deployment Guide](docs/deployment.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)  
5. Open Pull Request

## 🙏 Acknowledgments

- **Government of Assam** - Tourism Department
- **Northeast Tourism Board** - Policy guidance
- **Local Police Departments** - Security expertise
- **Technology Partners** - IoT and AI capabilities

---

**Built with ❤️ for tourist safety in Northeast India and beyond.**