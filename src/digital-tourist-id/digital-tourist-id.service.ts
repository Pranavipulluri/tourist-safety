import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { ethers } from 'ethers';
import { LessThan, MoreThanOrEqual, Repository } from 'typeorm';

// Database entities
import { AccessLog } from './entities/access-log.entity';
import { BlockchainEvent } from './entities/blockchain-event.entity';
import { DigitalTouristId } from './entities/digital-tourist-id.entity';

// DTOs
import {
    AccessDigitalIdDto,
    BlockchainEventDto,
    ConsentSettingsDto,
    EmergencyAccessDto,
    IssueDigitalIdDto,
    ReportLostIdDto
} from './dto/digital-tourist-id.dto';

// Blockchain integration
// import DigitalTouristIDService from '../../services/digital-tourist-id';

@Injectable()
export class DigitalTouristIdService implements OnModuleInit {
  private readonly logger = new Logger(DigitalTouristIdService.name);
  private blockchainService: any;
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private contractAddress: string;
  private contract: ethers.Contract;

  constructor(
    @InjectRepository(DigitalTouristId)
    private digitalTouristIdRepository: Repository<DigitalTouristId>,
    @InjectRepository(AccessLog)
    private accessLogRepository: Repository<AccessLog>,
    @InjectRepository(BlockchainEvent)
    private blockchainEventRepository: Repository<BlockchainEvent>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeBlockchainService();
  }

  private async initializeBlockchainService() {
    try {
      this.logger.log('🔗 Initializing Digital Tourist ID Blockchain Service...');

      // Initialize blockchain provider
      const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL', 'https://polygon-testnet.public.blastapi.io');
      const privateKey = this.configService.get<string>('BLOCKCHAIN_PRIVATE_KEY');
      this.contractAddress = this.configService.get<string>('DIGITAL_ID_CONTRACT_ADDRESS', '');

      if (!privateKey) {
        this.logger.warn('⚠️ No blockchain private key configured, using mock mode');
        return;
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.signer = new ethers.Wallet(privateKey, this.provider);

      // Initialize the blockchain service instance (commented out for now)
      // this.blockchainService = DigitalTouristIDService.getInstance();
      // await this.blockchainService.initialize();

      this.logger.log('✅ Digital Tourist ID Blockchain Service initialized successfully');

    } catch (error) {
      this.logger.error('❌ Failed to initialize blockchain service:', error.message);
      // Continue with mock mode for development
    }
  }

  async issueDigitalId(data: IssueDigitalIdDto & { issuerId: string; issuerRole: string }) {
    try {
      this.logger.log(`🆔 Issuing Digital Tourist ID for tourist: ${data.touristId}`);

      // Validate input data
      if (!data.touristId || !data.touristWallet || !data.personalData?.name) {
        return {
          success: false,
          error: 'Missing required fields: touristId, touristWallet, or personalData.name'
        };
      }

      // Check if tourist already has an active Digital ID
      const existingId = await this.digitalTouristIdRepository.findOne({
        where: { 
          touristId: data.touristId,
          status: 'ACTIVE'
        }
      });

      if (existingId) {
        return {
          success: false,
          error: 'Tourist already has an active Digital ID'
        };
      }

      // Issue Digital ID through blockchain service
      let blockchainResult;
      
      if (this.blockchainService) {
        blockchainResult = await this.blockchainService.issueDigitalID({
          touristId: data.touristId,
          touristWallet: data.touristWallet,
          personalData: data.personalData,
          bookingData: data.bookingData,
          emergencyContacts: data.emergencyContacts,
          biometricData: data.biometricData || '',
          validityDays: data.validityDays,
          checkoutTimestamp: data.checkoutTimestamp || Date.now() + (data.validityDays * 24 * 60 * 60 * 1000)
        });
      } else {
        // Mock blockchain service for development
        this.logger.log('🚧 Using mock blockchain service for Digital ID issuance');
        blockchainResult = {
          success: true,
          blockchainId: `DID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          gasUsed: '21000',
          blockNumber: Math.floor(Math.random() * 1000000)
        };
      }

      if (!blockchainResult.success) {
        return blockchainResult;
      }

      // Generate encryption key for sensitive data
      const encryptionKey = crypto.randomBytes(32).toString('hex');
      const personalDataHash = this.hashPersonalData(data.personalData);

      // Store Digital ID in database
      const digitalId = this.digitalTouristIdRepository.create({
        blockchainId: blockchainResult.blockchainId,
        touristId: data.touristId,
        touristName: data.personalData.name,
        touristWallet: data.touristWallet,
        personalDataHash,
        encryptionKey,
        status: 'ACTIVE',
        issuerId: data.issuerId,
        issuerRole: data.issuerRole,
        validityDays: data.validityDays,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + (data.validityDays * 24 * 60 * 60 * 1000)),
        checkoutTime: data.checkoutTimestamp ? new Date(data.checkoutTimestamp) : null,
        emergencyOverride: false,
        accessCount: 0,
        transactionHash: blockchainResult.transactionHash
      });

      await this.digitalTouristIdRepository.save(digitalId);

      // Set initial consent if provided
      if (data.initialConsent) {
        await this.updateConsentInternal(
          blockchainResult.blockchainId, 
          data.initialConsent, 
          data.issuerId,
          data.issuerRole
        );
      }

      this.logger.log(`✅ Digital Tourist ID issued successfully: ${blockchainResult.blockchainId}`);

      return {
        success: true,
        blockchainId: blockchainResult.blockchainId,
        transactionHash: blockchainResult.transactionHash,
        digitalId: digitalId,
        accessLevels: blockchainResult.accessLevels,
        expiresAt: digitalId.expiresAt.getTime()
      };

    } catch (error) {
      this.logger.error('❌ Failed to issue Digital Tourist ID:', error);
      return {
        success: false,
        error: error.message || 'Internal server error'
      };
    }
  }

  async accessDigitalId(data: AccessDigitalIdDto & { 
    accessorId: string; 
    accessorRole: string; 
    accessorWallet: string 
  }) {
    try {
      this.logger.log(`🔍 Accessing Digital Tourist ID: ${data.blockchainId}`);

      // Find Digital ID in database
      const digitalId = await this.digitalTouristIdRepository.findOne({
        where: { blockchainId: data.blockchainId }
      });

      if (!digitalId) {
        return {
          success: false,
          error: 'Digital ID not found'
        };
      }

      // Check if ID is active or if this is emergency access
      if (digitalId.status !== 'ACTIVE' && !data.emergencyAccess) {
        return {
          success: false,
          error: `Digital ID is ${digitalId.status.toLowerCase()}`
        };
      }

      // Access Digital ID through blockchain service
      let blockchainResult;
      
      if (this.blockchainService) {
        blockchainResult = await this.blockchainService.accessDigitalID({
          blockchainId: data.blockchainId,
          accessorAddress: data.accessorWallet,
          accessReason: data.accessReason,
          emergencyAccess: data.emergencyAccess || false
        });
      } else {
        // Mock blockchain service for development
        this.logger.log('🚧 Using mock blockchain service for Digital ID access');
        blockchainResult = {
          success: true,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          gasUsed: '21000',
          blockNumber: Math.floor(Math.random() * 1000000)
        };
      }

      if (!blockchainResult.success) {
        return blockchainResult;
      }

      // Log the access
      const accessLog = this.accessLogRepository.create({
        digitalTouristId: digitalId,
        accessorId: data.accessorId,
        accessorRole: data.accessorRole,
        accessorWallet: data.accessorWallet,
        accessReason: data.accessReason,
        emergencyAccess: data.emergencyAccess || false,
        accessedAt: new Date(),
        transactionHash: blockchainResult.transactionHash,
        dataAccessed: Object.keys(blockchainResult.decryptedData || {})
      });

      await this.accessLogRepository.save(accessLog);

      // Update access count and last accessed time
      digitalId.accessCount += 1;
      digitalId.lastAccessed = new Date();
      if (data.emergencyAccess) {
        digitalId.emergencyOverride = true;
      }
      await this.digitalTouristIdRepository.save(digitalId);

      this.logger.log(`✅ Digital Tourist ID accessed successfully: ${data.blockchainId}`);

      return {
        success: true,
        digitalId: {
          blockchainId: digitalId.blockchainId,
          touristId: digitalId.touristId,
          touristName: digitalId.touristName,
          status: digitalId.status,
          issuedAt: digitalId.issuedAt.getTime(),
          expiresAt: digitalId.expiresAt.getTime(),
          accessCount: digitalId.accessCount
        },
        personalData: blockchainResult.decryptedData?.personalData,
        bookingData: blockchainResult.decryptedData?.bookingData,
        emergencyContacts: blockchainResult.decryptedData?.emergencyContacts,
        accessLevels: blockchainResult.accessLevels,
        lastAccessed: digitalId.lastAccessed.getTime(),
        emergencyAccess: data.emergencyAccess || false,
        transactionHash: blockchainResult.transactionHash
      };

    } catch (error) {
      this.logger.error('❌ Failed to access Digital Tourist ID:', error);
      return {
        success: false,
        error: error.message || 'Internal server error'
      };
    }
  }

  async updateConsent(data: {
    blockchainId: string;
    consentSettings: ConsentSettingsDto;
    updaterId: string;
    updaterRole: string;
    updaterWallet: string;
  }) {
    try {
      return await this.updateConsentInternal(
        data.blockchainId,
        data.consentSettings,
        data.updaterId,
        data.updaterRole,
        data.updaterWallet
      );
    } catch (error) {
      this.logger.error('❌ Failed to update consent:', error);
      return {
        success: false,
        error: error.message || 'Internal server error'
      };
    }
  }

  private async updateConsentInternal(
    blockchainId: string,
    consentSettings: ConsentSettingsDto,
    updaterId: string,
    updaterRole: string,
    updaterWallet?: string
  ) {
    this.logger.log(`🔒 Updating consent for Digital Tourist ID: ${blockchainId}`);

    // Find Digital ID
    const digitalId = await this.digitalTouristIdRepository.findOne({
      where: { blockchainId }
    });

    if (!digitalId) {
      return {
        success: false,
        error: 'Digital ID not found'
      };
    }

        // Update consent through blockchain service
    let blockchainResult;
    
    if (this.blockchainService) {
      blockchainResult = await this.blockchainService.updateConsent({
        blockchainId,
        consentSettings: consentSettings
      });
    } else {
      // Mock blockchain service for development
      this.logger.log('🚧 Using mock blockchain service for consent update');
      blockchainResult = {
        success: true,
        transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        gasUsed: '21000'
      };
    }

    if (!blockchainResult.success) {
      return blockchainResult;
    }

    this.logger.log(`✅ Consent updated successfully for Digital Tourist ID: ${blockchainId}`);

    return {
      success: true,
      transactionHash: blockchainResult.transactionHash,
      updatedConsent: consentSettings,
      previousConsent: blockchainResult.previousConsent
    };
  }

  async reportLostId(data: ReportLostIdDto & { reporterId: string; reporterRole: string }) {
    try {
      this.logger.log(`🚨 Reporting lost Digital Tourist ID: ${data.blockchainId}`);

      // Find original Digital ID
      const originalId = await this.digitalTouristIdRepository.findOne({
        where: { blockchainId: data.blockchainId }
      });

      if (!originalId) {
        return {
          success: false,
          error: 'Digital ID not found'
        };
      }

      // Report lost through blockchain service
      let blockchainResult;
      
      if (this.blockchainService) {
        blockchainResult = await this.blockchainService.reportLostID({
          blockchainId: data.blockchainId,
          reason: data.reason,
          newWalletAddress: data.newWalletAddress || originalId.touristWallet,
          kioskLocation: data.kioskLocation
        });
      } else {
        // Mock blockchain service for development
        this.logger.log('🚧 Using mock blockchain service for lost ID report');
        blockchainResult = {
          success: true,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          replacementId: `DID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          gasUsed: '21000'
        };
      }

      if (!blockchainResult.success) {
        return blockchainResult;
      }

      // Update original ID status
      originalId.status = 'LOST';
      originalId.lastAccessed = new Date();
      await this.digitalTouristIdRepository.save(originalId);

      // Create replacement ID entry
      if (blockchainResult.replacementId) {
        const replacementId = this.digitalTouristIdRepository.create({
          blockchainId: blockchainResult.replacementId,
          touristId: originalId.touristId,
          touristName: originalId.touristName,
          touristWallet: data.newWalletAddress || originalId.touristWallet,
          personalDataHash: originalId.personalDataHash,
          encryptionKey: originalId.encryptionKey,
          status: 'ACTIVE',
          issuerId: data.reporterId,
          issuerRole: data.reporterRole,
          validityDays: originalId.validityDays,
          issuedAt: new Date(),
          expiresAt: originalId.expiresAt, // Keep original expiry
          checkoutTime: originalId.checkoutTime,
          emergencyOverride: false,
          accessCount: 0,
          transactionHash: blockchainResult.transactionHash,
          replacesId: originalId.blockchainId
        });

        await this.digitalTouristIdRepository.save(replacementId);
      }

      this.logger.log(`✅ Lost Digital Tourist ID reported and replacement issued: ${blockchainResult.replacementId}`);

      return {
        success: true,
        originalId: data.blockchainId,
        replacementId: blockchainResult.replacementId,
        transactionHash: blockchainResult.transactionHash
      };

    } catch (error) {
      this.logger.error('❌ Failed to report lost Digital Tourist ID:', error);
      return {
        success: false,
        error: error.message || 'Internal server error'
      };
    }
  }

  async triggerEmergencyAccess(data: EmergencyAccessDto & { 
    emergencyResponderId: string; 
    emergencyResponderRole: string;
    emergencyResponderAddress: string;
  }) {
    try {
      this.logger.log(`🚨 Triggering emergency access for Digital Tourist ID: ${data.blockchainId}`);

      // Find Digital ID
      const digitalId = await this.digitalTouristIdRepository.findOne({
        where: { blockchainId: data.blockchainId }
      });

      if (!digitalId) {
        return {
          success: false,
          error: 'Digital ID not found'
        };
      }

      // Trigger emergency access through blockchain service
      let blockchainResult;
      
      if (this.blockchainService) {
        blockchainResult = await this.blockchainService.triggerEmergencyAccess({
          blockchainId: data.blockchainId,
          reason: data.reason,
          emergencyResponderAddress: data.emergencyResponderAddress
        });
      } else {
        // Mock blockchain service for development
        this.logger.log('🚧 Using mock blockchain service for emergency access');
        blockchainResult = {
          success: true,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          gasUsed: '21000'
        };
      }

      if (!blockchainResult.success) {
        return blockchainResult;
      }

      // Update Digital ID with emergency override
      digitalId.emergencyOverride = true;
      digitalId.lastAccessed = new Date();
      digitalId.accessCount += 1;
      await this.digitalTouristIdRepository.save(digitalId);

      // Log emergency access
      const accessLog = this.accessLogRepository.create({
        digitalTouristId: digitalId,
        accessorId: data.emergencyResponderId,
        accessorRole: data.emergencyResponderRole,
        accessorWallet: data.emergencyResponderAddress,
        accessReason: `EMERGENCY: ${data.reason}`,
        emergencyAccess: true,
        accessedAt: new Date(),
        transactionHash: blockchainResult.transactionHash,
        dataAccessed: ['emergency_data', 'personal_data', 'emergency_contacts']
      });

      await this.accessLogRepository.save(accessLog);

      this.logger.log(`✅ Emergency access triggered for Digital Tourist ID: ${data.blockchainId}`);

      return {
        success: true,
        digitalId: {
          blockchainId: digitalId.blockchainId,
          touristId: digitalId.touristId,
          touristName: digitalId.touristName,
          status: digitalId.status
        },
        emergencyData: blockchainResult.emergencyData,
        transactionHash: blockchainResult.transactionHash,
        overrideActive: true
      };

    } catch (error) {
      this.logger.error('❌ Failed to trigger emergency access:', error);
      return {
        success: false,
        error: error.message || 'Internal server error'
      };
    }
  }

  async getDigitalIdDetails(blockchainId: string, requesterId: string) {
    try {
      const digitalId = await this.digitalTouristIdRepository.findOne({
        where: { blockchainId },
        relations: ['accessLogs']
      });

      if (!digitalId) {
        return {
          success: false,
          error: 'Digital ID not found'
        };
      }

      const accessHistory = await this.accessLogRepository.find({
        where: { digitalTouristId: { id: digitalId.id } },
        order: { accessedAt: 'DESC' },
        take: 50
      });

      const blockchainEvents = await this.blockchainEventRepository.find({
        where: { blockchainId },
        order: { timestamp: 'DESC' },
        take: 20
      });

      return {
        success: true,
        digitalId: {
          ...digitalId,
          personalDataHash: undefined, // Don't expose hash
          encryptionKey: undefined // Don't expose key
        },
        accessHistory,
        consentHistory: [], // TODO: Implement consent history tracking
        securityEvents: blockchainEvents
      };

    } catch (error) {
      this.logger.error('❌ Failed to get Digital ID details:', error);
      return {
        success: false,
        error: error.message || 'Internal server error'
      };
    }
  }

  async getAccessLogs(blockchainId: string, requesterId: string, limit: number = 50, offset: number = 0) {
    try {
      const digitalId = await this.digitalTouristIdRepository.findOne({
        where: { blockchainId }
      });

      if (!digitalId) {
        return {
          success: false,
          error: 'Digital ID not found'
        };
      }

      const [logs, totalCount] = await this.accessLogRepository.findAndCount({
        where: { digitalTouristId: { id: digitalId.id } },
        order: { accessedAt: 'DESC' },
        take: limit,
        skip: offset
      });

      const formattedLogs = logs.map(log => ({
        timestamp: log.accessedAt.getTime(),
        accessorId: log.accessorId,
        accessorRole: log.accessorRole,
        accessReason: log.accessReason,
        emergencyAccess: log.emergencyAccess,
        transactionHash: log.transactionHash,
        dataAccessed: log.dataAccessed
      }));

      return {
        success: true,
        logs: formattedLogs,
        totalCount,
        hasMore: offset + limit < totalCount
      };

    } catch (error) {
      this.logger.error('❌ Failed to get access logs:', error);
      return {
        success: false,
        error: error.message || 'Internal server error'
      };
    }
  }

  async autoExpireIDs() {
    try {
      this.logger.log('⏰ Running auto-expiration process for Digital Tourist IDs');

      const now = new Date();
      const expiredIds = await this.digitalTouristIdRepository.find({
        where: [
          { expiresAt: LessThan(now), status: 'ACTIVE' },
          { checkoutTime: LessThan(now), status: 'ACTIVE' }
        ]
      });

      let expiredCount = 0;
      const errors = [];

      for (const digitalId of expiredIds) {
        try {
          // Auto-expire through blockchain service
          let result;
          
          if (this.blockchainService) {
            result = await this.blockchainService.autoExpireID(digitalId.blockchainId);
          } else {
            // Mock blockchain service for development
            this.logger.log(`🚧 Using mock blockchain service to expire ID: ${digitalId.blockchainId}`);
            result = {
              success: true,
              transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
              gasUsed: '21000'
            };
          }
          
          if (result.success) {
            digitalId.status = 'EXPIRED';
            digitalId.lastAccessed = now;
            await this.digitalTouristIdRepository.save(digitalId);
            expiredCount++;
          } else {
            errors.push({ id: digitalId.blockchainId, error: result.error });
          }
        } catch (error) {
          errors.push({ id: digitalId.blockchainId, error: error.message });
        }
      }

      this.logger.log(`✅ Auto-expiration completed: ${expiredCount} expired, ${errors.length} errors`);

      return {
        success: true,
        processedCount: expiredIds.length,
        expiredCount,
        errors
      };

    } catch (error) {
      this.logger.error('❌ Failed to run auto-expiration:', error);
      return {
        success: false,
        error: error.message || 'Internal server error'
      };
    }
  }

  async getAnalyticsSummary() {
    try {
      const totalIds = await this.digitalTouristIdRepository.count();
      const activeIds = await this.digitalTouristIdRepository.count({ where: { status: 'ACTIVE' } });
      const expiredIds = await this.digitalTouristIdRepository.count({ where: { status: 'EXPIRED' } });
      const revokedIds = await this.digitalTouristIdRepository.count({ where: { status: 'REVOKED' } });
      const emergencyOverrides = await this.digitalTouristIdRepository.count({ where: { emergencyOverride: true } });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIssuedIds = await this.digitalTouristIdRepository.count({
        where: { issuedAt: MoreThanOrEqual(today) }
      });

      const totalAccesses = await this.accessLogRepository.count();
      const emergencyAccesses = await this.accessLogRepository.count({ where: { emergencyAccess: true } });

      const topAccessedIds = await this.digitalTouristIdRepository.find({
        order: { accessCount: 'DESC' },
        take: 10,
        select: ['blockchainId', 'touristName', 'accessCount']
      });

      const recentEvents = await this.blockchainEventRepository.find({
        order: { timestamp: 'DESC' },
        take: 10
      });

      return {
        totalIds,
        activeIds,
        expiredIds,
        revokedIds,
        emergencyOverrides,
        todayIssuedIds,
        accessStats: {
          totalAccesses,
          averagePerDay: Math.round(totalAccesses / Math.max(1, totalIds)),
          emergencyAccesses
        },
        topAccessedIds,
        consentDistribution: {
          policeAccess: 0, // TODO: Calculate from blockchain
          hotelAccess: 0,
          familyAccess: 0,
          tourismAccess: 0
        },
        recentEvents
      };

    } catch (error) {
      this.logger.error('❌ Failed to get analytics summary:', error);
      throw error;
    }
  }

  async getBlockchainStatus() {
    try {
      if (!this.blockchainService) {
        return {
          connected: false,
          initialized: false,
          error: 'Blockchain service not initialized'
        };
      }

      return this.blockchainService.getStatus();

    } catch (error) {
      this.logger.error('❌ Failed to get blockchain status:', error);
      return {
        connected: false,
        initialized: false,
        error: error.message
      };
    }
  }

  async logBlockchainEvent(eventData: BlockchainEventDto) {
    try {
      const event = this.blockchainEventRepository.create({
        ...eventData,
        timestamp: new Date()
      });

      await this.blockchainEventRepository.save(event);

    } catch (error) {
      this.logger.error('❌ Failed to log blockchain event:', error);
    }
  }

  private hashPersonalData(personalData: any): string {
    const crypto = require('crypto');
    const dataString = JSON.stringify(personalData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
}