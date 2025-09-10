import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tourist } from '../../entities/tourist.entity';
import { TouristController } from './tourist.controller';
import { TouristService } from './tourist.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tourist])],
  controllers: [TouristController],
  providers: [TouristService],
  exports: [TouristService],
})
export class TouristModule {}