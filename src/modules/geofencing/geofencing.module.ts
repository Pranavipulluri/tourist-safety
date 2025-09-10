import { Module } from '@nestjs/common';
import { MockDatabaseService } from '../../services/mock-database.service';
import { EmergencyModule } from '../emergency/emergency.module';
import { GeofencingController } from './geofencing.controller';
import { GeofencingService } from './geofencing.service';

@Module({
  imports: [EmergencyModule],
  controllers: [GeofencingController],
  providers: [GeofencingService, MockDatabaseService],
  exports: [GeofencingService],
})
export class GeofencingModule {}
