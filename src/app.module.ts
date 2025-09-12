import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import entities
import { Alert } from './entities/alert.entity';
import { DigitalId } from './entities/digital-id.entity';
import { Geofence } from './entities/geofence.entity';
import { Location } from './entities/location.entity';
import { Tourist } from './entities/tourist.entity';

// Import modules
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { DigitalIdModule } from './modules/digital-id/digital-id.module';
import { EmergencyModule } from './modules/emergency/emergency.module';
import { HealthModule } from './modules/health/health.module';
import { LocationModule } from './modules/location/location.module';
import { SharedModule } from './modules/shared/shared.module';
import { TouristModule } from './modules/tourist/tourist.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
// import { DatabaseModule } from './database/database.module';
// import { GeofencingModule } from './modules/geofencing/geofencing.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database - Real PostgreSQL connection
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_NAME || 'tourist_safety_db',
      entities: [Tourist, Location, Alert, Geofence, DigitalId],
      synchronize: true,
      dropSchema: true, // This will clean up the schema issues
      logging: true,
    }),

    // Shared services (global)
    SharedModule,

    // Feature modules
    HealthModule,
    AuthModule,
    TouristModule,
    EmergencyModule,
    LocationModule,
    DigitalIdModule,
    AdminModule,
    WebsocketModule,
    // GeofencingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}