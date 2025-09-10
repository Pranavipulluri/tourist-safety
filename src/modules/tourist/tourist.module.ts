import { Module } from '@nestjs/common';
import { MockDatabaseService } from '../../services/mock-database.service';
import { TouristController } from './tourist.controller';
import { TouristService } from './tourist.service';

@Module({
  providers: [TouristService, MockDatabaseService],
  controllers: [TouristController],
  exports: [TouristService],
})
export class TouristModule {}