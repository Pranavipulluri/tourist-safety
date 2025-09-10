# docs/architecture.md
# System Architecture

## Overview

The Smart Tourist Safety System is built using a microservices-inspired modular architecture with NestJS, providing scalability, maintainability, and real-time capabilities.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile Apps   │    │   IoT Devices   │    │  Web Dashboard  │
│   (Tourists)    │    │  (Wearables)    │    │ (Police/Admin)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────────┐
         │                Load Balancer                        │
         └─────────────────────┬───────────────────────────────┘
                               │
    ┌──────────────────────────┼──────────────────────────────┐
    │                   API Gateway                           │
    │              (Rate Limiting, Auth)                      │
    └─────────────────────┬───────────────────────────────────┘
                          │
    ┌─────────────────────────────────────────────────────────┐
    │                 NestJS Backend                          │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
    │  │    Auth     │ │  Location   │ │     Alerts      │   │
    │  │   Module    │ │   Module    │ │    Module       │   │
    │  └─────────────┘ └─────────────┘ └─────────────────┘   │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
    │  │     IoT     │ │     AI      │ │   Dashboard     │   │
    │  │   Module    │ │   Module    │ │    Module       │   │
    │  └─────────────┘ └─────────────┘ └─────────────────┘   │
    └─────────────────────┬───────────────────────────────────┘
                          │
    ┌─────────────────────────────────────────────────────────┐
    │                Data Layer                               │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
    │  │ PostgreSQL  │ │    Redis    │ │  MQTT Broker    │   │
    │  │   (Main)    │ │  (Cache)    │ │    (IoT)        │   │
    │  └─────────────┘ └─────────────┘ └─────────────────┘   │
    └─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Refresh token mechanism
- Rate limiting per user role

### 2. Location Services
- Real-time GPS tracking
- Geofencing with PostGIS
- Location history with spatial indexing
- Batch location processing

### 3. Alert Management
- Multi-priority alert system
- Automated emergency dispatch
- Multi-channel notifications
- Alert acknowledgment workflow

### 4. IoT Integration
- MQTT broker for device communication
- Device pairing and management
- Real-time telemetry processing
- Command dispatch to devices

### 5. AI & Analytics
- Anomaly detection algorithms
- Predictive risk assessment
- Route deviation analysis
- Behavioral pattern recognition

### 6. Data Storage
- **PostgreSQL**: Main database with PostGIS
- **Redis**: Caching and session storage
- **File Storage**: Document and media uploads

## Security Architecture

### API Security
- HTTPS enforced in production
- CORS with whitelist origins
- Request rate limiting
- Input validation and sanitization
- SQL injection prevention

### Data Protection
- AES-256 encryption for sensitive data
- Password hashing with bcrypt
- PII data encryption at rest
- Audit logging for all operations

### IoT Security
- Device authentication
- Message encryption
- Command verification
- Device certificate management

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Redis-based session storage
- Load balancer ready
- Database connection pooling

### Performance Optimization
- Database indexing strategy
- Query optimization
- Response caching
- Background job processing

### Monitoring & Observability
- Application metrics
- Database performance monitoring
- Error tracking and alerting
- Real-time system health checks
