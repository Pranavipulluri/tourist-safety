import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tourist } from '../../entities/tourist.entity';
import { Alert } from '../../entities/alert.entity';
import { Geofence } from '../../entities/geofence.entity';
import { GeofencingController } from './geofencing.controller';
import { GeofencingService } from './geofencing.service';
import { EmergencyModule } from '../emergency/emergency.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tourist, Alert, Geofence]),
    EmergencyModule
  ],
  controllers: [GeofencingController],
  providers: [GeofencingService],
  exports: [GeofencingService],
})
export class GeofencingModule {}
