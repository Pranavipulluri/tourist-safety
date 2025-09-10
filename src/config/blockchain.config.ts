import { registerAs } from '@nestjs/config';

export const blockchainConfig = registerAs('blockchain', () => ({
  networkUrl: process.env.BLOCKCHAIN_NETWORK_URL || 'http://localhost:8545',
  privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
  contractAddress: process.env.TOURIST_ID_CONTRACT_ADDRESS,
  gasLimit: parseInt(process.env.GAS_LIMIT, 10) || 100000,
  gasPrice: process.env.GAS_PRICE || '20000000000',
}));