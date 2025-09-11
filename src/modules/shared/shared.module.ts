import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { blockchainConfig } from '../../config/blockchain.config';
import { MockDatabaseService } from '../../services/mock-database.service';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(blockchainConfig),
  ],
  providers: [MockDatabaseService],
  exports: [MockDatabaseService],
})
export class SharedModule {}
