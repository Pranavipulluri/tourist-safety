import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import entities
import { Tourist } from './entities/tourist.entity';
import { Location } from './entities/location.entity';
import { Alert } from './entities/alert.entity';
import { Geofence } from './entities/geofence.entity';

// Import modules
import { HealthModule } from './modules/health/health.module';
import { TouristModule } from './modules/tourist/tourist.module';
import { EmergencyModule } from './modules/emergency/emergency.module';
import { LocationModule } from './modules/location/location.module';
import { GeofencingModule } from './modules/geofencing/geofencing.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'tourist_safety',
      entities: [Tourist, Location, Alert, Geofence],
      synchronize: process.env.NODE_ENV !== 'production', // Don't use in production
      logging: process.env.NODE_ENV === 'development',
    }),

    // Feature modules
    HealthModule,
    TouristModule,
    EmergencyModule,
    LocationModule,
    GeofencingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}