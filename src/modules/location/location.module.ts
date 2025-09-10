import { Module } from '@nestjs/common';
import { MockDatabaseService } from '../../services/mock-database.service';
import { EmergencyModule } from '../emergency/emergency.module';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
  imports: [EmergencyModule],
  controllers: [LocationController],
  providers: [LocationService, MockDatabaseService],
  exports: [LocationService],
})
export class LocationModule {}