import { Module } from '@nestjs/common';
import { MockDatabaseService } from '../../services/mock-database.service';
import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './emergency.service';

@Module({
  providers: [EmergencyService, MockDatabaseService],
  controllers: [EmergencyController],
  exports: [EmergencyService],
})
export class EmergencyModule {}