import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { blockchainConfig } from '../../config/blockchain.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(blockchainConfig),
  ],
  providers: [],
  exports: [],
})
export class SharedModule {}
