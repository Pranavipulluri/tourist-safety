import { Module } from '@nestjs/common';
import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './emergency.service';
import { SmsService } from './services/sms.service';

@Module({
  controllers: [EmergencyController],
  providers: [EmergencyService, SmsService],
  exports: [EmergencyService, SmsService],
})
export class EmergencyModule {}