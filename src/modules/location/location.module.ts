import { Module } from '@nestjs/common';
import { EmergencyModule } from '../emergency/emergency.module';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
  imports: [EmergencyModule],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}