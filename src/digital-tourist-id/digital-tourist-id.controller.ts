import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Put, Query, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';
import { DigitalTouristIdService } from './digital-tourist-id.service';
import {
    AccessDigitalIdDto,
    AccessLogDto,
    DigitalIdResponseDto,
    EmergencyAccessDto,
    IssueDigitalIdDto,
    ReportLostIdDto,
    UpdateConsentDto
} from './dto/digital-tourist-id.dto';

@ApiTags('Digital Tourist ID')
@Controller('digital-tourist-id')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
export class DigitalTouristIdController {
  constructor(private readonly digitalTouristIdService: DigitalTouristIdService) {}

  @Post('issue')
  // @Roles('admin', 'police', 'tourism_officer')
  @ApiOperation({ summary: 'Issue a new Digital Tourist ID' })
  @ApiResponse({ status: 201, description: 'Digital ID issued successfully', type: DigitalIdResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async issueDigitalId(
    @Body() issueDigitalIdDto: IssueDigitalIdDto,
    @Request() req: any
  ): Promise<DigitalIdResponseDto> {
    try {
      console.log('🆔 Issuing Digital Tourist ID:', {
        touristId: issueDigitalIdDto.touristId,
        issuer: req.user.id,
        timestamp: new Date().toISOString()
      });

      const result = await this.digitalTouristIdService.issueDigitalId({
        ...issueDigitalIdDto,
        issuerId: req.user.id,
        issuerRole: req.user.role
      });

      if (!result.success) {
        throw new HttpException(
          `Failed to issue Digital ID: ${result.error}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Log the issuance event
      await this.digitalTouristIdService.logBlockchainEvent({
        eventType: 'DIGITAL_ID_ISSUED',
        blockchainId: result.blockchainId,
        touristId: issueDigitalIdDto.touristId,
        transactionHash: result.transactionHash,
        metadata: {
          issuer: req.user.id,
          validityDays: issueDigitalIdDto.validityDays,
          accessLevels: result.accessLevels
        }
      });

      return {
        success: true,
        blockchainId: result.blockchainId,
        transactionHash: result.transactionHash,
        digitalId: result.digitalId,
        accessLevels: result.accessLevels,
        expiresAt: result.expiresAt,
        message: 'Digital Tourist ID issued successfully'
      };

    } catch (error) {
      console.error('❌ Failed to issue Digital Tourist ID:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while issuing Digital ID',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('access')
  // @Roles('admin', 'police', 'hotel_staff', 'tourism_officer', 'family_member')
  @ApiOperation({ summary: 'Access a Digital Tourist ID' })
  @ApiResponse({ status: 200, description: 'Digital ID accessed successfully' })
  @ApiResponse({ status: 403, description: 'Access denied or insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Digital ID not found' })
  async accessDigitalId(
    @Body() accessDigitalIdDto: AccessDigitalIdDto,
    @Request() req: any
  ) {
    try {
      console.log('🔍 Accessing Digital Tourist ID:', {
        blockchainId: accessDigitalIdDto.blockchainId,
        accessorRole: req.user.role,
        accessorId: req.user.id,
        timestamp: new Date().toISOString()
      });

      const result = await this.digitalTouristIdService.accessDigitalId({
        ...accessDigitalIdDto,
        accessorId: req.user.id,
        accessorRole: req.user.role,
        accessorWallet: req.user.walletAddress
      });

      if (!result.success) {
        if (result.error?.includes('not found')) {
          throw new HttpException('Digital ID not found', HttpStatus.NOT_FOUND);
        }
        if (result.error?.includes('access denied') || result.error?.includes('permission')) {
          throw new HttpException(`Access denied: ${result.error}`, HttpStatus.FORBIDDEN);
        }
        throw new HttpException(
          `Failed to access Digital ID: ${result.error}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Log the access event
      await this.digitalTouristIdService.logBlockchainEvent({
        eventType: 'DIGITAL_ID_ACCESSED',
        blockchainId: accessDigitalIdDto.blockchainId,
        transactionHash: result.transactionHash,
        metadata: {
          accessor: req.user.id,
          accessorRole: req.user.role,
          accessReason: accessDigitalIdDto.accessReason,
          emergencyAccess: result.emergencyAccess || false
        }
      });

      return {
        success: true,
        digitalId: result.digitalId,
        personalData: result.personalData,
        bookingData: result.bookingData,
        emergencyContacts: result.emergencyContacts,
        accessLevels: result.accessLevels,
        lastAccessed: result.lastAccessed,
        emergencyAccess: result.emergencyAccess,
        transactionHash: result.transactionHash,
        message: 'Digital ID accessed successfully'
      };

    } catch (error) {
      console.error('❌ Failed to access Digital Tourist ID:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while accessing Digital ID',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

    @Put('consent/:id')
  // @Roles('admin', 'tourist', 'family_member')
  @ApiOperation({ summary: 'Update consent settings for a Digital Tourist ID' })
  @ApiResponse({ status: 200, description: 'Consent settings updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Digital ID not found' })
  async updateConsent(
    @Param('blockchainId') blockchainId: string,
    @Body() updateConsentDto: UpdateConsentDto,
    @Request() req: any
  ) {
    try {
      console.log('🔒 Updating consent for Digital Tourist ID:', {
        blockchainId,
        userId: req.user.id,
        consentSettings: updateConsentDto.consentSettings,
        timestamp: new Date().toISOString()
      });

      const result = await this.digitalTouristIdService.updateConsent({
        blockchainId,
        consentSettings: updateConsentDto.consentSettings,
        updaterId: req.user.id,
        updaterRole: req.user.role,
        updaterWallet: req.user.walletAddress
      });

      if (!result.success) {
        if (result.error?.includes('not found')) {
          throw new HttpException('Digital ID not found', HttpStatus.NOT_FOUND);
        }
        if (result.error?.includes('permission')) {
          throw new HttpException(`Permission denied: ${result.error}`, HttpStatus.FORBIDDEN);
        }
        throw new HttpException(
          `Failed to update consent: ${result.error}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Log the consent update event
      await this.digitalTouristIdService.logBlockchainEvent({
        eventType: 'CONSENT_UPDATED',
        blockchainId,
        transactionHash: result.transactionHash,
        metadata: {
          updater: req.user.id,
          updaterRole: req.user.role,
          previousConsent: result.previousConsent,
          newConsent: updateConsentDto.consentSettings
        }
      });

      return {
        success: true,
        transactionHash: result.transactionHash,
        updatedConsent: result.updatedConsent,
        message: 'Consent settings updated successfully'
      };

    } catch (error) {
      console.error('❌ Failed to update consent:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while updating consent',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('report-lost')
  // @Roles('admin', 'police', 'tourism_officer', 'hotel_staff')
  @ApiOperation({ summary: 'Report a Digital Tourist ID as lost and issue replacement' })
  @ApiResponse({ status: 201, description: 'Lost ID reported and replacement issued' })
  @ApiResponse({ status: 404, description: 'Digital ID not found' })
  async reportLostId(
    @Body() reportLostIdDto: ReportLostIdDto,
    @Request() req: any
  ) {
    try {
      console.log('🚨 Reporting lost Digital Tourist ID:', {
        blockchainId: reportLostIdDto.blockchainId,
        reporterId: req.user.id,
        reason: reportLostIdDto.reason,
        timestamp: new Date().toISOString()
      });

      const result = await this.digitalTouristIdService.reportLostId({
        ...reportLostIdDto,
        reporterId: req.user.id,
        reporterRole: req.user.role
      });

      if (!result.success) {
        if (result.error?.includes('not found')) {
          throw new HttpException('Digital ID not found', HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          `Failed to report lost ID: ${result.error}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Log the lost ID report event
      await this.digitalTouristIdService.logBlockchainEvent({
        eventType: 'DIGITAL_ID_LOST_REPORTED',
        blockchainId: reportLostIdDto.blockchainId,
        transactionHash: result.transactionHash,
        metadata: {
          reporter: req.user.id,
          reporterRole: req.user.role,
          reason: reportLostIdDto.reason,
          replacementId: result.replacementId,
          kioskLocation: reportLostIdDto.kioskLocation
        }
      });

      return {
        success: true,
        originalId: reportLostIdDto.blockchainId,
        replacementId: result.replacementId,
        transactionHash: result.transactionHash,
        message: 'Lost ID reported and replacement issued successfully'
      };

    } catch (error) {
      console.error('❌ Failed to report lost ID:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while reporting lost ID',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('emergency-access')
  // @Roles('admin', 'police', 'emergency_responder')
  @ApiOperation({ summary: 'Trigger emergency access to a Digital Tourist ID' })
  @ApiResponse({ status: 200, description: 'Emergency access granted' })
  @ApiResponse({ status: 404, description: 'Digital ID not found' })
  async emergencyAccess(
    @Body() emergencyAccessDto: EmergencyAccessDto,
    @Request() req: any
  ) {
    try {
      console.log('🚨 Emergency access to Digital Tourist ID:', {
        blockchainId: emergencyAccessDto.blockchainId,
        emergencyResponderId: req.user.id,
        reason: emergencyAccessDto.reason,
        timestamp: new Date().toISOString()
      });

      const result = await this.digitalTouristIdService.triggerEmergencyAccess({
        ...emergencyAccessDto,
        emergencyResponderId: req.user.id,
        emergencyResponderRole: req.user.role,
        emergencyResponderAddress: req.user.walletAddress || emergencyAccessDto.emergencyResponderAddress
      });

      if (!result.success) {
        if (result.error?.includes('not found')) {
          throw new HttpException('Digital ID not found', HttpStatus.NOT_FOUND);
        }
        throw new HttpException(
          `Failed to trigger emergency access: ${result.error}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Log the emergency access event
      await this.digitalTouristIdService.logBlockchainEvent({
        eventType: 'EMERGENCY_ACCESS_TRIGGERED',
        blockchainId: emergencyAccessDto.blockchainId,
        transactionHash: result.transactionHash,
        metadata: {
          emergencyResponder: req.user.id,
          emergencyResponderRole: req.user.role,
          reason: emergencyAccessDto.reason,
          overrideActive: true
        }
      });

      return {
        success: true,
        digitalId: result.digitalId,
        emergencyData: result.emergencyData,
        transactionHash: result.transactionHash,
        overrideActive: result.overrideActive,
        message: 'Emergency access granted successfully'
      };

    } catch (error) {
      console.error('❌ Failed to trigger emergency access:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while triggering emergency access',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

    @Get('status/:id')
  // @Roles('admin', 'police', 'tourism_officer', 'hotel_staff')
  @ApiOperation({ summary: 'Get Digital Tourist ID status' })
  @ApiResponse({ status: 200, description: 'Digital ID details retrieved' })
  @ApiResponse({ status: 404, description: 'Digital ID not found' })
  async getDigitalId(
    @Param('blockchainId') blockchainId: string,
    @Request() req: any
  ) {
    try {
      const result = await this.digitalTouristIdService.getDigitalIdDetails(blockchainId, req.user.id);

      if (!result.success) {
        throw new HttpException('Digital ID not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        digitalId: result.digitalId,
        accessHistory: result.accessHistory,
        consentHistory: result.consentHistory,
        securityEvents: result.securityEvents
      };

    } catch (error) {
      console.error('❌ Failed to get Digital ID details:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while retrieving Digital ID',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':blockchainId/access-logs')
  // @Roles('admin', 'police', 'tourism_officer', 'tourist')
  @ApiOperation({ summary: 'Get access logs for a Digital Tourist ID' })
  @ApiResponse({ status: 200, description: 'Access logs retrieved', type: [AccessLogDto] })
  @ApiResponse({ status: 404, description: 'Digital ID not found' })
  async getAccessLogs(
    @Param('blockchainId') blockchainId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Request() req: any
  ) {
    try {
      const result = await this.digitalTouristIdService.getAccessLogs(blockchainId, req.user.id, limit, offset);

      if (!result.success) {
        throw new HttpException('Digital ID not found or access denied', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        logs: result.logs,
        totalCount: result.totalCount,
        hasMore: result.hasMore
      };

    } catch (error) {
      console.error('❌ Failed to get access logs:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while retrieving access logs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('auto-expire')
  // @Roles('admin', 'system')
  @ApiOperation({ summary: 'Run auto-expiration process for all Digital Tourist IDs' })
  @ApiResponse({ status: 200, description: 'Auto-expiration process completed' })
  async autoExpire(@Request() req: any) {
    try {
      console.log('⏰ Running auto-expiration process for Digital Tourist IDs');

      const result = await this.digitalTouristIdService.autoExpireIDs();

      // Log the auto-expiration event
      await this.digitalTouristIdService.logBlockchainEvent({
        eventType: 'AUTO_EXPIRATION_RUN',
        metadata: {
          executor: req.user.id,
          expiredCount: result.expiredCount,
          processedCount: result.processedCount,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        processedCount: result.processedCount,
        expiredCount: result.expiredCount,
        errors: result.errors,
        message: `Auto-expiration completed: ${result.expiredCount} IDs expired out of ${result.processedCount} processed`
      };

    } catch (error) {
      console.error('❌ Failed to run auto-expiration:', error);
      
      throw new HttpException(
        'Internal server error while running auto-expiration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analytics/summary')
  // @Roles('admin', 'tourism_officer')
  @ApiOperation({ summary: 'Get Digital Tourist ID analytics summary' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved' })
  async getAnalyticsSummary(@Request() req: any) {
    try {
      const result = await this.digitalTouristIdService.getAnalyticsSummary();

      return {
        success: true,
        totalIds: result.totalIds,
        activeIds: result.activeIds,
        expiredIds: result.expiredIds,
        revokedIds: result.revokedIds,
        emergencyOverrides: result.emergencyOverrides,
        todayIssuedIds: result.todayIssuedIds,
        accessStats: result.accessStats,
        topAccessedIds: result.topAccessedIds,
        consentDistribution: result.consentDistribution,
        recentEvents: result.recentEvents
      };

    } catch (error) {
      console.error('❌ Failed to get analytics summary:', error);
      
      throw new HttpException(
        'Internal server error while retrieving analytics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('blockchain/status')
  // @Roles('admin', 'system')
  @ApiOperation({ summary: 'Get blockchain service status' })
  @ApiResponse({ status: 200, description: 'Blockchain status retrieved' })
  async getBlockchainStatus() {
    try {
      const status = await this.digitalTouristIdService.getBlockchainStatus();

      return {
        success: true,
        blockchainStatus: status
      };

    } catch (error) {
      console.error('❌ Failed to get blockchain status:', error);
      
      throw new HttpException(
        'Internal server error while checking blockchain status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}