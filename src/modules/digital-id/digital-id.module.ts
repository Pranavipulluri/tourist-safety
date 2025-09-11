import { Module } from '@nestjs/common';
import { BlockchainService } from '../../services/blockchain.service';
import { DigitalIdService } from '../../services/digital-id.service';
import { MockDatabaseService } from '../../services/mock-database.service';
import { DigitalIdController } from './digital-id.controller';

@Module({
  controllers: [DigitalIdController],
  providers: [DigitalIdService, BlockchainService, MockDatabaseService],
  exports: [DigitalIdService, BlockchainService],
})
export class DigitalIdModule {}
