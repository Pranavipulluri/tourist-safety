import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  // Smart Contract ABI for Tourist Digital ID
  private readonly contractABI = [
    // Create Digital ID
    "function createDigitalId(address tourist, string memory passportNumber, string memory nationality, string memory encryptedData) public returns (bytes32)",
    
    // Verify Digital ID
    "function verifyDigitalId(bytes32 digitalIdHash) public view returns (bool isValid, uint256 timestamp, address owner)",
    
    // Update Digital ID Status
    "function updateDigitalIdStatus(bytes32 digitalIdHash, bool isActive) public",
    
    // Get Digital ID Details
    "function getDigitalIdDetails(bytes32 digitalIdHash) public view returns (address owner, string memory passportNumber, string memory nationality, bool isActive, uint256 createdAt)",
    
    // Events
    "event DigitalIdCreated(bytes32 indexed digitalIdHash, address indexed owner, string passportNumber, uint256 timestamp)",
    "event DigitalIdStatusUpdated(bytes32 indexed digitalIdHash, bool isActive, uint256 timestamp)"
  ];

  constructor(private configService: ConfigService) {
    this.initializeBlockchain();
  }

  private async initializeBlockchain() {
    try {
      const networkUrl = this.configService.get<string>('blockchain.networkUrl');
      const privateKey = this.configService.get<string>('blockchain.privateKey');
      const contractAddress = this.configService.get<string>('blockchain.contractAddress');

      if (!networkUrl || !privateKey || !contractAddress) {
        this.logger.warn('⚠️ Blockchain configuration incomplete. Using mock mode.');
        return;
      }

      this.provider = new ethers.JsonRpcProvider(networkUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, this.contractABI, this.wallet);

      // Test connection
      const network = await this.provider.getNetwork();
      this.logger.log(`🔗 Connected to blockchain network: ${network.name} (Chain ID: ${network.chainId})`);
      
      const balance = await this.provider.getBalance(this.wallet.address);
      this.logger.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);

    } catch (error) {
      this.logger.error('❌ Failed to initialize blockchain connection:', error.message);
      this.logger.warn('📱 Falling back to mock blockchain mode');
    }
  }

  /**
   * Create a digital ID on blockchain for a tourist
   */
  async createDigitalId(touristData: {
    walletAddress: string;
    passportNumber: string;
    nationality: string;
    encryptedKycData: string;
  }): Promise<{
    success: boolean;
    blockchainHash?: string;
    transactionHash?: string;
    gasUsed?: string;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        // Mock mode for development
        const mockHash = this.generateMockBlockchainHash(touristData);
        this.logger.log(`🔄 Mock blockchain: Created digital ID ${mockHash}`);
        return {
          success: true,
          blockchainHash: mockHash,
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          gasUsed: '21000'
        };
      }

      this.logger.log(`🚀 Creating digital ID for passport: ${touristData.passportNumber}`);

      // Estimate gas
      const gasEstimate = await this.contract.createDigitalId.estimateGas(
        touristData.walletAddress,
        touristData.passportNumber,
        touristData.nationality,
        touristData.encryptedKycData
      );

      // Execute transaction
      const tx = await this.contract.createDigitalId(
        touristData.walletAddress,
        touristData.passportNumber,
        touristData.nationality,
        touristData.encryptedKycData,
        {
          gasLimit: gasEstimate,
          gasPrice: this.configService.get<string>('blockchain.gasPrice')
        }
      );

      this.logger.log(`⏳ Transaction submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Extract digital ID hash from events
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'DigitalIdCreated';
        } catch {
          return false;
        }
      });

      let digitalIdHash: string;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        digitalIdHash = parsed.args.digitalIdHash;
      } else {
        // Fallback: generate hash from transaction data
        digitalIdHash = ethers.keccak256(
          ethers.toUtf8Bytes(`${touristData.passportNumber}-${touristData.nationality}-${Date.now()}`)
        );
      }

      this.logger.log(`✅ Digital ID created successfully: ${digitalIdHash}`);

      return {
        success: true,
        blockchainHash: digitalIdHash,
        transactionHash: tx.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      this.logger.error('❌ Failed to create digital ID:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify a digital ID exists on blockchain
   */
  async verifyDigitalId(blockchainHash: string): Promise<{
    isValid: boolean;
    owner?: string;
    createdAt?: Date;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        // Mock verification
        const isValid = blockchainHash.startsWith('0x') && blockchainHash.length === 66;
        this.logger.log(`🔄 Mock verification for ${blockchainHash}: ${isValid ? 'Valid' : 'Invalid'}`);
        return {
          isValid,
          owner: isValid ? '0x742d35Cc6431FA28A7EDFa7C7fD25bEbD7522843' : undefined,
          createdAt: isValid ? new Date() : undefined
        };
      }

      this.logger.log(`🔍 Verifying digital ID: ${blockchainHash}`);

      const [isValid, timestamp, owner] = await this.contract.verifyDigitalId(blockchainHash);

      this.logger.log(`✅ Verification result: ${isValid ? 'Valid' : 'Invalid'}`);

      return {
        isValid,
        owner: isValid ? owner : undefined,
        createdAt: isValid ? new Date(Number(timestamp) * 1000) : undefined
      };

    } catch (error) {
      this.logger.error('❌ Failed to verify digital ID:', error.message);
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Get detailed information about a digital ID
   */
  async getDigitalIdDetails(blockchainHash: string): Promise<{
    success: boolean;
    details?: {
      owner: string;
      passportNumber: string;
      nationality: string;
      isActive: boolean;
      createdAt: Date;
    };
    error?: string;
  }> {
    try {
      if (!this.contract) {
        // Mock details
        this.logger.log(`🔄 Mock details for ${blockchainHash}`);
        return {
          success: true,
          details: {
            owner: '0x742d35Cc6431FA28A7EDFa7C7fD25bEbD7522843',
            passportNumber: 'US987654321',
            nationality: 'American',
            isActive: true,
            createdAt: new Date()
          }
        };
      }

      const [owner, passportNumber, nationality, isActive, createdAt] = 
        await this.contract.getDigitalIdDetails(blockchainHash);

      return {
        success: true,
        details: {
          owner,
          passportNumber,
          nationality,
          isActive,
          createdAt: new Date(Number(createdAt) * 1000)
        }
      };

    } catch (error) {
      this.logger.error('❌ Failed to get digital ID details:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update digital ID status (activate/deactivate)
   */
  async updateDigitalIdStatus(blockchainHash: string, isActive: boolean): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        // Mock update
        this.logger.log(`🔄 Mock status update for ${blockchainHash}: ${isActive ? 'Active' : 'Inactive'}`);
        return {
          success: true,
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
        };
      }

      const tx = await this.contract.updateDigitalIdStatus(blockchainHash, isActive);
      await tx.wait();

      this.logger.log(`✅ Digital ID status updated: ${isActive ? 'Activated' : 'Deactivated'}`);

      return {
        success: true,
        transactionHash: tx.hash
      };

    } catch (error) {
      this.logger.error('❌ Failed to update digital ID status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate wallet address for a tourist
   */
  generateWalletAddress(): string {
    const randomWallet = ethers.Wallet.createRandom();
    return randomWallet.address;
  }

  /**
   * Encrypt sensitive data for blockchain storage
   */
  encryptKycData(data: any): {
    encryptedData: string;
    iv: string;
    authTag: string;
  } {
    // Simple encryption for demo - in production use proper encryption
    const dataString = JSON.stringify(data);
    const encrypted = Buffer.from(dataString).toString('base64');
    
    return {
      encryptedData: encrypted,
      iv: Math.random().toString(36).substr(2, 16),
      authTag: Math.random().toString(36).substr(2, 16)
    };
  }

  /**
   * Get blockchain network status
   */
  async getNetworkStatus(): Promise<{
    connected: boolean;
    networkName?: string;
    chainId?: number;
    blockNumber?: number;
    gasPrice?: string;
    walletBalance?: string;
  }> {
    try {
      if (!this.provider) {
        return { connected: false };
      }

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();
      const balance = await this.provider.getBalance(this.wallet.address);

      return {
        connected: true,
        networkName: network.name,
        chainId: Number(network.chainId),
        blockNumber,
        gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') + ' gwei' : 'N/A',
        walletBalance: ethers.formatEther(balance) + ' ETH'
      };

    } catch (error) {
      this.logger.error('❌ Failed to get network status:', error.message);
      return { connected: false };
    }
  }

  /**
   * Generate mock blockchain hash for development
   */
  private generateMockBlockchainHash(data: any): string {
    const hashInput = `${data.passportNumber}-${data.nationality}-${Date.now()}`;
    return ethers.keccak256(ethers.toUtf8Bytes(hashInput));
  }
}
