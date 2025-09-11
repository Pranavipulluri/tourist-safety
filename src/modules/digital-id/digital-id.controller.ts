import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateDigitalIdDto, DigitalIdService } from '../../services/digital-id.service';

@ApiTags('🆔 Digital Identity (Blockchain)')
@Controller('digital-id')
export class DigitalIdController {
  constructor(private readonly digitalIdService: DigitalIdService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create Digital ID on Blockchain',
    description: 'Creates a blockchain-based digital identity for a tourist with encrypted KYC data'
  })
  @ApiBody({
    description: 'Digital ID creation data',
    schema: {
      type: 'object',
      properties: {
        touristId: { type: 'string', example: 'tourist_1694847600123' },
        passportNumber: { type: 'string', example: 'US987654321' },
        nationality: { type: 'string', example: 'American' },
        dateOfBirth: { type: 'string', format: 'date', example: '1990-05-15' },
        issueDate: { type: 'string', format: 'date', example: '2020-01-01' },
        expiryDate: { type: 'string', format: 'date', example: '2030-01-01' },
        kycData: {
          type: 'object',
          properties: {
            fullName: { type: 'string', example: 'Sarah Johnson' },
            address: { type: 'string', example: '123 Main St, New York, NY' },
            phoneNumber: { type: 'string', example: '+1-555-0123' },
            email: { type: 'string', example: 'sarah@email.com' },
            emergencyContact: { type: 'string', example: '+1-555-0124' }
          }
        }
      },
      required: ['touristId', 'passportNumber', 'nationality', 'dateOfBirth', 'issueDate', 'expiryDate', 'kycData']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Digital ID created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        digitalId: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'digital_id_1694847600123' },
            digitalIdNumber: { type: 'string', example: 'DID-US-600123-A8X9' },
            blockchainHash: { type: 'string', example: '0x742d35Cc6431FA28A7EDFa7C7fD25bEbD7522843...' },
            passportNumber: { type: 'string', example: 'US987654321' },
            nationality: { type: 'string', example: 'American' },
            isValid: { type: 'boolean', example: true },
            walletAddress: { type: 'string', example: '0x742d35Cc6431FA28A7EDFa7C7fD25bEbD7522843' },
            transactionHash: { type: 'string', example: '0x8ba1f109551bd432803012645ac136ddd64dba72...' },
            gasUsed: { type: 'string', example: '21000' }
          }
        },
        blockchainHash: { type: 'string', example: '0x742d35Cc6431FA28A7EDFa7C7fD25bEbD7522843...' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Tourist not found' })
  async createDigitalId(@Body() createDto: CreateDigitalIdDto) {
    return await this.digitalIdService.createDigitalId(createDto);
  }

  @Get('verify/:digitalIdNumber')
  @ApiOperation({ 
    summary: 'Verify Digital ID',
    description: 'Verifies a digital ID against blockchain records and checks validity'
  })
  @ApiParam({ name: 'digitalIdNumber', description: 'Digital ID number to verify', example: 'DID-US-600123-A8X9' })
  @ApiResponse({ 
    status: 200, 
    description: 'Verification result',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean', example: true },
        digitalId: {
          type: 'object',
          properties: {
            digitalIdNumber: { type: 'string', example: 'DID-US-600123-A8X9' },
            passportNumber: { type: 'string', example: 'US987654321' },
            nationality: { type: 'string', example: 'American' },
            isValid: { type: 'boolean', example: true },
            expiryDate: { type: 'string', format: 'date-time', example: '2030-01-01T00:00:00.000Z' }
          }
        },
        blockchainVerification: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean', example: true },
            owner: { type: 'string', example: '0x742d35Cc6431FA28A7EDFa7C7fD25bEbD7522843' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-09-10T10:30:00.000Z' }
          }
        }
      }
    }
  })
  async verifyDigitalId(@Param('digitalIdNumber') digitalIdNumber: string) {
    return await this.digitalIdService.verifyDigitalId(digitalIdNumber);
  }

  @Get('details/:digitalIdNumber')
  @ApiOperation({ 
    summary: 'Get Digital ID Details',
    description: 'Retrieves complete details of a digital ID including blockchain information'
  })
  @ApiParam({ name: 'digitalIdNumber', description: 'Digital ID number', example: 'DID-US-600123-A8X9' })
  @ApiResponse({ 
    status: 200, 
    description: 'Digital ID details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'digital_id_1694847600123' },
        digitalIdNumber: { type: 'string', example: 'DID-US-600123-A8X9' },
        blockchainHash: { type: 'string', example: '0x742d35Cc6431FA28A7EDFa7C7fD25bEbD7522843...' },
        passportNumber: { type: 'string', example: 'US987654321' },
        nationality: { type: 'string', example: 'American' },
        dateOfBirth: { type: 'string', format: 'date', example: '1990-05-15' },
        issueDate: { type: 'string', format: 'date', example: '2020-01-01' },
        expiryDate: { type: 'string', format: 'date', example: '2030-01-01' },
        isValid: { type: 'boolean', example: true },
        walletAddress: { type: 'string', example: '0x742d35Cc6431FA28A7EDFa7C7fD25bEbD7522843' },
        blockchainDetails: {
          type: 'object',
          properties: {
            owner: { type: 'string', example: '0x742d35Cc6431FA28A7EDFa7C7fD25bEbD7522843' },
            passportNumber: { type: 'string', example: 'US987654321' },
            nationality: { type: 'string', example: 'American' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time', example: '2025-09-10T10:30:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Digital ID not found' })
  async getDigitalIdDetails(@Param('digitalIdNumber') digitalIdNumber: string) {
    return await this.digitalIdService.getDigitalIdDetails(digitalIdNumber);
  }

  @Put('status/:digitalIdNumber')
  @ApiOperation({ 
    summary: 'Update Digital ID Status',
    description: 'Activates or deactivates a digital ID on blockchain'
  })
  @ApiParam({ name: 'digitalIdNumber', description: 'Digital ID number', example: 'DID-US-600123-A8X9' })
  @ApiBody({
    description: 'Status update data',
    schema: {
      type: 'object',
      properties: {
        isActive: { type: 'boolean', example: true }
      },
      required: ['isActive']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Digital ID status updated successfully' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Digital ID not found' })
  async updateDigitalIdStatus(
    @Param('digitalIdNumber') digitalIdNumber: string,
    @Body() body: { isActive: boolean }
  ) {
    const result = await this.digitalIdService.updateDigitalIdStatus(digitalIdNumber, body.isActive);
    return {
      ...result,
      message: result.success ? 'Digital ID status updated successfully' : 'Failed to update status'
    };
  }

  @Get('list')
  @ApiOperation({ 
    summary: 'Get All Digital IDs',
    description: 'Retrieves list of all digital IDs in the system'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of digital IDs',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'digital_id_1694847600123' },
          digitalIdNumber: { type: 'string', example: 'DID-US-600123-A8X9' },
          passportNumber: { type: 'string', example: 'US987654321' },
          nationality: { type: 'string', example: 'American' },
          isValid: { type: 'boolean', example: true },
          touristId: { type: 'string', example: 'tourist_1694847600123' },
          createdAt: { type: 'string', format: 'date-time', example: '2025-09-10T10:30:00.000Z' }
        }
      }
    }
  })
  async getAllDigitalIds() {
    const digitalIds = await this.digitalIdService.getAllDigitalIds();
    return {
      digitalIds,
      total: digitalIds.length,
      message: `Found ${digitalIds.length} digital IDs`
    };
  }

  @Get('tourist/:touristId')
  @ApiOperation({ 
    summary: 'Get Digital ID by Tourist ID',
    description: 'Retrieves digital ID for a specific tourist'
  })
  @ApiParam({ name: 'touristId', description: 'Tourist ID', example: 'tourist_1694847600123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Digital ID found',
    schema: {
      type: 'object',
      properties: {
        digitalId: {
          type: 'object',
          properties: {
            digitalIdNumber: { type: 'string', example: 'DID-US-600123-A8X9' },
            blockchainHash: { type: 'string', example: '0x742d35Cc6431FA28A7EDFa7C7fD25bEbD7522843...' },
            passportNumber: { type: 'string', example: 'US987654321' },
            nationality: { type: 'string', example: 'American' },
            isValid: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Digital ID not found for this tourist' })
  async getDigitalIdByTourist(@Param('touristId') touristId: string) {
    const digitalId = await this.digitalIdService.findByTouristId(touristId);
    if (!digitalId) {
      return {
        message: 'No digital ID found for this tourist',
        touristId,
        hasDigitalId: false
      };
    }
    return {
      digitalId,
      hasDigitalId: true,
      message: 'Digital ID found successfully'
    };
  }

  @Get('blockchain/status')
  @ApiOperation({ 
    summary: 'Get Blockchain Status',
    description: 'Retrieves current blockchain network status and connection info'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Blockchain status',
    schema: {
      type: 'object',
      properties: {
        connected: { type: 'boolean', example: true },
        networkName: { type: 'string', example: 'sepolia' },
        chainId: { type: 'number', example: 11155111 },
        blockNumber: { type: 'number', example: 4567890 },
        gasPrice: { type: 'string', example: '20 gwei' },
        walletBalance: { type: 'string', example: '1.5 ETH' }
      }
    }
  })
  async getBlockchainStatus() {
    const status = await this.digitalIdService.getBlockchainStatus();
    return {
      ...status,
      message: status.connected ? 'Blockchain connected successfully' : 'Blockchain not connected - using mock mode',
      timestamp: new Date().toISOString()
    };
  }
}
