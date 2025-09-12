import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../entities/alert.entity';
import { DigitalId } from '../entities/digital-id.entity';
import { Geofence } from '../entities/geofence.entity';
import { Location } from '../entities/location.entity';
import { Tourist } from '../entities/tourist.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password123'),
        database: configService.get('DB_NAME', 'tourist_safety_db'),
        entities: [Tourist, Alert, Location, Geofence, DigitalId],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),
  ],
})
export class DatabaseModule {}