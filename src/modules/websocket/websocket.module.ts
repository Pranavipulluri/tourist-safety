import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tourist } from '../../entities/tourist.entity';
import { Alert } from '../alerts/alert.entity';
import { SharedModule } from '../shared/shared.module';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([Tourist, Alert]),
  ],
  providers: [WebsocketGateway, WebsocketService],
  exports: [WebsocketGateway, WebsocketService],
})
export class WebsocketModule {}