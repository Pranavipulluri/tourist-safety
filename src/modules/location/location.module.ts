import { Module } from '@nestjs/common';
import { RealLocationService } from '../../services/real-location.service';
import { EmergencyModule } from '../emergency/emergency.module';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
  imports: [EmergencyModule],
  controllers: [LocationController],
  providers: [LocationService, RealLocationService],
  exports: [LocationService],
})
export class LocationModule {}