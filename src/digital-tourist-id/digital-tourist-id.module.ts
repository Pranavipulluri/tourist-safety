import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DigitalTouristIdController } from './digital-tourist-id.controller';
import { DigitalTouristIdService } from './digital-tourist-id.service';

// Entities
import { AccessLog } from './entities/access-log.entity';
import { BlockchainEvent } from './entities/blockchain-event.entity';
import { DigitalTouristId } from './entities/digital-tourist-id.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DigitalTouristId,
      AccessLog,
      BlockchainEvent
    ]),
    ConfigModule
  ],
  controllers: [DigitalTouristIdController],
  providers: [DigitalTouristIdService],
  exports: [DigitalTouristIdService]
})
export class DigitalTouristIdModule {}