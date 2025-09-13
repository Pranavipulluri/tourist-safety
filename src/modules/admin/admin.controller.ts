import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TouristService } from '../tourist/tourist.service';

@ApiTags('Admin Management')
@Controller('admin')
export class AdminController {

  constructor(private readonly touristService: TouristService) {}

  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Get dashboard overview statistics' })
  async getDashboardOverview() {
    try {
      const touristsResponse = await this.touristService.findAll(1, 1000); // Get a large number for counting
      const tourists = touristsResponse.data;
      const activeTourists = tourists.filter(t => t.isActive);
      
      return {
        totalTourists: touristsResponse.total,
        activeTourists: activeTourists.length,
        totalAlerts: 5, // Mock data for now
        activeAlerts: 2,
        resolvedAlerts: 3,
        averageResponseTime: 12.5,
        success: true
      };
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      return {
        totalTourists: 0,
        activeTourists: 0,
        totalAlerts: 0,
        activeAlerts: 0,
        resolvedAlerts: 0,
        averageResponseTime: 0,
        success: false,
        error: error.message
      };
    }
  }

  @Get('tourists')
  @ApiOperation({ summary: 'Get all tourists for admin panel' })
  async getAllTourists() {
    try {
      const tourists = await this.touristService.findAllWithLocation();
      return {
        tourists: tourists,
        total: tourists.length,
        success: true
      };
    } catch (error) {
      console.error('Error fetching tourists:', error);
      return {
        tourists: [],
        total: 0,
        success: false,
        error: error.message
      };
    }
  }

  @Get('tourists/:id')
  @ApiOperation({ summary: 'Get specific tourist details' })
  async getTouristById(@Param('id') id: string) {
    try {
      const tourist = await this.touristService.findOne(id);
      return {
        tourist: tourist,
        success: true
      };
    } catch (error) {
      console.error('Error fetching tourist:', error);
      return {
        tourist: null,
        success: false,
        error: error.message
      };
    }
  }

  @Get('tourists/:id/locations')
  @ApiOperation({ summary: 'Get tourist location history' })
  async getTouristLocationHistory(@Param('id') id: string) {
    try {
      // For now, return empty array - you can implement this later with location service
      return {
        locations: [],
        total: 0,
        success: true
      };
    } catch (error) {
      console.error('Error fetching tourist locations:', error);
      return {
        locations: [],
        total: 0,
        success: false,
        error: error.message
      };
    }
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get all alerts for admin panel' })
  async getAllAlertsAdmin() {
    try {
      // For now, return mock data - you can implement this later with alert service
      return {
        alerts: [
          {
            id: '1',
            touristId: 'tourist_001',
            type: 'SOS',
            status: 'ACTIVE',
            priority: 'HIGH',
            message: 'Emergency assistance required',
            location: {
              latitude: 28.6129,
              longitude: 77.2295,
              address: 'India Gate, New Delhi'
            },
            createdAt: new Date(Date.now() - 1800000).toISOString()
          }
        ],
        total: 1,
        success: true
      };
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return {
        alerts: [],
        total: 0,
        success: false,
        error: error.message
      };
    }
  }

  @Get('alerts/sos')
  @ApiOperation({ summary: 'Get SOS alerts (Admin)' })
  async getSOSAlerts() {
    return {
      alerts: [
        {
          id: '1',
          touristId: 'tourist_001',
          type: 'SOS',
          status: 'ACTIVE',
          priority: 'CRITICAL',
          message: 'Emergency help needed at Red Fort',
          location: { latitude: 28.6562, longitude: 77.2410, address: 'Red Fort, Delhi' },
          createdAt: new Date(Date.now() - 1800000).toISOString()
        }
      ]
    };
  }

  @Get('zones')
  @ApiOperation({ summary: 'Get all safety zones' })
  async getZones() {
    return [
      {
        id: '1',
        name: 'Red Fort Complex',
        type: 'TOURIST_HIGH',
        coordinates: [[28.6562, 77.2410], [28.6570, 77.2420], [28.6560, 77.2425], [28.6555, 77.2415]],
        status: 'ACTIVE',
        riskLevel: 'MEDIUM',
        touristCount: 245,
        securityLevel: 'HIGH'
      },
      {
        id: '2',
        name: 'India Gate Area',
        type: 'TOURIST_MEDIUM',
        coordinates: [[28.6129, 77.2295], [28.6135, 77.2305], [28.6125, 77.2310], [28.6120, 77.2300]],
        status: 'ACTIVE',
        riskLevel: 'LOW',
        touristCount: 189,
        securityLevel: 'MEDIUM'
      }
    ];
  }

  @Post('zones')
  @ApiOperation({ summary: 'Create new safety zone' })
  async createZone(@Body() zoneData: any) {
    return {
      id: '3',
      ...zoneData,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
  }

  @Put('zones/:id')
  @ApiOperation({ summary: 'Update safety zone' })
  async updateZone(@Param('id') id: string, @Body() zoneData: any) {
    return {
      id,
      ...zoneData,
      updatedAt: new Date().toISOString()
    };
  }

  @Delete('zones/:id')
  @ApiOperation({ summary: 'Delete safety zone' })
  async deleteZone(@Param('id') id: string) {
    return { success: true, message: 'Zone deleted successfully' };
  }

  @Get('fir')
  @ApiOperation({ summary: 'Get all FIR records' })
  async getFIRs(@Query('touristId') touristId?: string) {
    return [
      {
        id: 'FIR001',
        firNumber: 'DL/2024/001245',
        touristId: 'tourist_001',
        touristName: 'John Smith',
        incidentType: 'THEFT',
        status: 'UNDER_INVESTIGATION',
        priority: 'HIGH',
        location: 'Chandni Chowk Market',
        description: 'Tourist reported theft of wallet and passport',
        filedAt: new Date(Date.now() - 86400000).toISOString(),
        officerAssigned: 'SI Patel',
        evidence: ['CCTV_FOOTAGE', 'WITNESS_STATEMENT']
      }
    ];
  }

  @Post('fir')
  @ApiOperation({ summary: 'Create new FIR' })
  async createFIR(@Body() firData: any) {
    return {
      id: 'FIR002',
      firNumber: `DL/2024/${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
      ...firData,
      status: 'PENDING',
      filedAt: new Date().toISOString()
    };
  }

  @Get('sms-logs')
  @ApiOperation({ summary: 'Get SMS communication logs' })
  async getSMSLogs() {
    return [
      {
        id: '1',
        recipient: '+1234567890',
        message: 'Emergency alert: Please move to safe zone immediately',
        status: 'DELIVERED',
        sentAt: new Date(Date.now() - 1800000).toISOString(),
        type: 'EMERGENCY_ALERT',
        cost: 0.05
      }
    ];
  }

  @Post('sms-alert')
  @ApiOperation({ summary: 'Send SMS alert' })
  async sendSMSAlert(@Body() alertData: any) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...alertData,
      status: 'SENT',
      sentAt: new Date().toISOString(),
      messageId: `msg_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  @Get('analytics/risk-predictions')
  @ApiOperation({ summary: 'Get AI risk predictions' })
  async getRiskPredictions() {
    return {
      hotspots: [
        {
          location: 'Red Fort Area',
          currentRisk: 45,
          predictedRisk: 78,
          confidence: 87,
          timeframe: '2 hours'
        }
      ],
      weatherRisks: [
        {
          location: 'Central Delhi',
          condition: 'HEAVY_RAIN',
          severity: 'HIGH',
          startTime: new Date(Date.now() + 1800000).toISOString()
        }
      ]
    };
  }

  @Get('analytics/patrol-recommendations')
  @ApiOperation({ summary: 'Get patrol recommendations' })
  async getPatrolRecommendations() {
    return [
      {
        area: 'Chandni Chowk',
        priority: 'HIGH',
        recommendedUnits: 3,
        timeSlot: '14:00-18:00',
        reason: 'High crime prediction based on historical data'
      }
    ];
  }

  @Get('feedback/sentiment')
  @ApiOperation({ summary: 'Get tourist sentiment analysis' })
  async getSentimentAnalysis() {
    return {
      overall: {
        positive: 65,
        negative: 20,
        neutral: 15,
        averageRating: 4.1
      },
      byLocation: [
        {
          location: 'Red Fort',
          sentiment: 'POSITIVE',
          score: 0.7,
          feedbackCount: 245
        }
      ],
      trends: [
        {
          date: new Date().toISOString().split('T')[0],
          positive: 45,
          negative: 12,
          neutral: 8
        }
      ]
    };
  }

  @Get('compliance/logs')
  @ApiOperation({ summary: 'Get compliance audit logs' })
  async getComplianceLogs() {
    return [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userId: 'admin_001',
        action: 'VIEW_TOURIST_DATA',
        resource: 'tourist_123',
        success: true,
        ipAddress: '192.168.1.100',
        riskLevel: 'LOW'
      }
    ];
  }

  @Get('resources/units')
  @ApiOperation({ summary: 'Get authority resource units' })
  async getResourceUnits() {
    return [
      {
        id: 'UNIT001',
        type: 'POLICE_PATROL',
        status: 'ACTIVE',
        location: 'Red Fort Area',
        personnel: 4,
        equipment: ['RADIO', 'FIRST_AID', 'VEHICLE'],
        lastUpdate: new Date().toISOString()
      }
    ];
  }

  @Post('resources/deploy')
  @ApiOperation({ summary: 'Deploy emergency resources' })
  async deployResources(@Body() deploymentData: any) {
    return {
      deploymentId: `DEP_${Math.random().toString(36).substr(2, 9)}`,
      ...deploymentData,
      status: 'DEPLOYED',
      deployedAt: new Date().toISOString(),
      estimatedArrival: new Date(Date.now() + 900000).toISOString()
    };
  }
}
