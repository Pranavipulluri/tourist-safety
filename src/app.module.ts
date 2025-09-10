import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Import entities

// Import modules
import { EmergencyModule } from './modules/emergency/emergency.module';
import { HealthModule } from './modules/health/health.module';
import { LocationModule } from './modules/location/location.module';
import { SharedModule } from './modules/shared/shared.module';
import { TouristModule } from './modules/tourist/tourist.module';
// import { GeofencingModule } from './modules/geofencing/geofencing.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Shared services (global)
    SharedModule,

    // Database - Temporarily disabled for testing
    // TypeOrmModule.forRoot({
    //   type: 'sqlite',
    //   database: ':memory:',
    //   entities: [Tourist, Location, Alert, Geofence],
    //   synchronize: true,
    //   logging: process.env.NODE_ENV === 'development',
    //   dropSchema: true,
    // }),

    // Feature modules
    HealthModule,
    TouristModule,
    EmergencyModule,
    LocationModule,
    // GeofencingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}