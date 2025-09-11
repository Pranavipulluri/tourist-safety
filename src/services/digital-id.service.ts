import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { MockDatabaseService } from './mock-database.service';

export interface CreateDigitalIdDto {
  touristId: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  issueDate: string;
  expiryDate: string;
  kycData: {
    fullName: string;
    address: string;
    phoneNumber: string;
    email: string;
    emergencyContact: string;
  };
}

@Injectable()
export class DigitalIdService {
  private readonly logger = new Logger(DigitalIdService.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly mockDb: MockDatabaseService,
  ) {}

  /**
   * Create a new digital ID for a tourist
   */
  async createDigitalId(createDto: CreateDigitalIdDto): Promise<{
    success: boolean;
    digitalId?: any;
    blockchainHash?: string;
    error?: string;
  }> {
    try {
      this.logger.log(`🆔 Creating digital ID for tourist: ${createDto.touristId}`);

      // Check if tourist exists
      const tourist = await this.mockDb.findTouristById(createDto.touristId);
      if (!tourist) {
        throw new NotFoundException(`Tourist with ID ${createDto.touristId} not found`);
      }

      // Check if digital ID already exists
      const existingDigitalId = await this.findByTouristId(createDto.touristId);
      if (existingDigitalId) {
        return {
          success: false,
          error: 'Digital ID already exists for this tourist'
        };
      }

      // Generate wallet address
      const walletAddress = this.blockchainService.generateWalletAddress();

      // Encrypt KYC data
      const encryptionResult = this.blockchainService.encryptKycData(createDto.kycData);

      // Create digital ID on blockchain
      const blockchainResult = await this.blockchainService.createDigitalId({
        walletAddress,
        passportNumber: createDto.passportNumber,
        nationality: createDto.nationality,
        encryptedKycData: encryptionResult.encryptedData
      });

      if (!blockchainResult.success) {
        return {
          success: false,
          error: `Blockchain creation failed: ${blockchainResult.error}`
        };
      }

      // Generate digital ID number
      const digitalIdNumber = this.generateDigitalIdNumber(createDto.passportNumber);

      // Create digital ID record
      const digitalId = {
        id: `digital_id_${Date.now()}`,
        blockchainHash: blockchainResult.blockchainHash,
        digitalIdNumber,
        encryptedKycData: encryptionResult.encryptedData,
        encryptionIv: encryptionResult.iv,
        encryptionAuthTag: encryptionResult.authTag,
        passportNumber: createDto.passportNumber,
        nationality: createDto.nationality,
        dateOfBirth: new Date(createDto.dateOfBirth),
        issueDate: new Date(createDto.issueDate),
        expiryDate: new Date(createDto.expiryDate),
        isValid: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        touristId: createDto.touristId,
        walletAddress,
        transactionHash: blockchainResult.transactionHash,
        gasUsed: blockchainResult.gasUsed
      };

      // Store in mock database
      await this.mockDb.createDigitalId(digitalId);

      this.logger.log(`✅ Digital ID created successfully: ${digitalId.digitalIdNumber}`);

      return {
        success: true,
        digitalId,
        blockchainHash: blockchainResult.blockchainHash
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
   * Verify a digital ID
   */
  async verifyDigitalId(digitalIdNumber: string): Promise<{
    isValid: boolean;
    digitalId?: any;
    blockchainVerification?: any;
    error?: string;
  }> {
    try {
      this.logger.log(`🔍 Verifying digital ID: ${digitalIdNumber}`);

      // Find digital ID in database
      const digitalId = await this.findByDigitalIdNumber(digitalIdNumber);
      if (!digitalId) {
        return {
          isValid: false,
          error: 'Digital ID not found'
        };
      }

      // Verify on blockchain
      const blockchainVerification = await this.blockchainService.verifyDigitalId(
        digitalId.blockchainHash
      );

      const isValid = digitalId.isValid && 
                      blockchainVerification.isValid && 
                      new Date() < digitalId.expiryDate;

      this.logger.log(`✅ Verification result: ${isValid ? 'Valid' : 'Invalid'}`);

      return {
        isValid,
        digitalId,
        blockchainVerification
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
   * Get digital ID details
   */
  async getDigitalIdDetails(digitalIdNumber: string): Promise<any> {
    const digitalId = await this.findByDigitalIdNumber(digitalIdNumber);
    if (!digitalId) {
      throw new NotFoundException(`Digital ID ${digitalIdNumber} not found`);
    }

    // Get blockchain details
    const blockchainDetails = await this.blockchainService.getDigitalIdDetails(
      digitalId.blockchainHash
    );

    return {
      ...digitalId,
      blockchainDetails: blockchainDetails.success ? blockchainDetails.details : null
    };
  }

  /**
   * Update digital ID status
   */
  async updateDigitalIdStatus(digitalIdNumber: string, isActive: boolean): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const digitalId = await this.findByDigitalIdNumber(digitalIdNumber);
      if (!digitalId) {
        throw new NotFoundException(`Digital ID ${digitalIdNumber} not found`);
      }

      // Update on blockchain
      const blockchainResult = await this.blockchainService.updateDigitalIdStatus(
        digitalId.blockchainHash,
        isActive
      );

      if (!blockchainResult.success) {
        return {
          success: false,
          error: `Blockchain update failed: ${blockchainResult.error}`
        };
      }

      // Update in database
      await this.mockDb.updateDigitalId(digitalId.id, { isValid: isActive });

      this.logger.log(`✅ Digital ID status updated: ${isActive ? 'Activated' : 'Deactivated'}`);

      return { success: true };

    } catch (error) {
      this.logger.error('❌ Failed to update digital ID status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all digital IDs
   */
  async getAllDigitalIds(): Promise<any[]> {
    return await this.mockDb.findAllDigitalIds();
  }

  /**
   * Find digital ID by tourist ID
   */
  async findByTouristId(touristId: string): Promise<any | null> {
    const digitalIds = await this.mockDb.findAllDigitalIds();
    return digitalIds.find(id => id.touristId === touristId) || null;
  }

  /**
   * Find digital ID by digital ID number
   */
  async findByDigitalIdNumber(digitalIdNumber: string): Promise<any | null> {
    const digitalIds = await this.mockDb.findAllDigitalIds();
    return digitalIds.find(id => id.digitalIdNumber === digitalIdNumber) || null;
  }

  /**
   * Get blockchain network status
   */
  async getBlockchainStatus(): Promise<any> {
    return await this.blockchainService.getNetworkStatus();
  }

  /**
   * Generate unique digital ID number
   */
  private generateDigitalIdNumber(passportNumber: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const prefix = passportNumber.substr(0, 2).toUpperCase();
    return `DID-${prefix}-${timestamp.substr(-6)}-${random}`;
  }
}
