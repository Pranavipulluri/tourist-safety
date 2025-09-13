import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {

  @Get('live-feed')
  @ApiOperation({ summary: 'Get live activity feed' })
  async getLiveFeed(@Query('limit') limit: string = '20') {
    try {
      const feedLimit = parseInt(limit) || 20;
      
      // Mock live feed data for now
      const feedItems = [
        {
          id: '1',
          type: 'alert',
          message: 'Emergency alert from Red Fort area',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          severity: 'high',
          location: 'Red Fort, Delhi',
          touristId: 'tourist_001'
        },
        {
          id: '2',
          type: 'location_update',
          message: 'Tourist checked in at India Gate',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          severity: 'low',
          location: 'India Gate, Delhi',
          touristId: 'tourist_002'
        },
        {
          id: '3',
          type: 'geofence',
          message: 'Tourist entered safe zone at Lotus Temple',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          severity: 'info',
          location: 'Lotus Temple, Delhi',
          touristId: 'tourist_003'
        },
        {
          id: '4',
          type: 'sos',
          message: 'SOS alert resolved at Chandni Chowk',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          severity: 'medium',
          location: 'Chandni Chowk, Delhi',
          touristId: 'tourist_004'
        },
        {
          id: '5',
          type: 'system',
          message: 'System health check completed',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          severity: 'info',
          location: 'System',
          touristId: null
        }
      ];

      return {
        feedItems: feedItems.slice(0, feedLimit),
        total: feedItems.length,
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching live feed:', error);
      return {
        feedItems: [],
        total: 0,
        success: false,
        error: error.message
      };
    }
  }
}