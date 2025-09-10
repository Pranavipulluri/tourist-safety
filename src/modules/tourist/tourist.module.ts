import { Module } from '@nestjs/common';
import { TouristController } from './tourist.controller';
import { TouristService } from './tourist.service';

@Module({
  providers: [TouristService],
  controllers: [TouristController],
  exports: [TouristService],
})
export class TouristModule {}