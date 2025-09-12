import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../../entities/location.entity';
import { Tourist } from '../../entities/tourist.entity';
import { RealLocationService } from '../../services/real-location.service';
import { EmergencyModule } from '../emergency/emergency.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, Tourist]),
    EmergencyModule,
    WebsocketModule
  ],
  controllers: [LocationController],
  providers: [LocationService, RealLocationService],
  exports: [LocationService],
})
export class LocationModule {}