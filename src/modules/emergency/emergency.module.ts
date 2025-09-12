import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../../entities/alert.entity';
import { Tourist } from '../../entities/tourist.entity';
import { WebsocketModule } from '../websocket/websocket.module';
import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './emergency.service';
import { SmsService } from './services/sms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, Tourist]),
    WebsocketModule
  ],
  controllers: [EmergencyController],
  providers: [EmergencyService, SmsService],
  exports: [EmergencyService, SmsService],
})
export class EmergencyModule {}