import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../services/mock-database.service';

@Injectable()
export class WebsocketService {
  constructor(
    private readonly mockDb: MockDatabaseService,
  ) {}

  async getDashboardStats() {
    // Mock dashboard stats for development
    const stats = {
      activeTourists: 25,
      onlineDevices: 12,
      alertsLast24h: 8,
      pendingAlerts: 3,
      criticalAlertsWeek: 2,
      timestamp: new Date().toISOString(),
    };

    return stats;
  }

  async getConnectedUsers(): Promise<number> {
    // Mock connected users count
    return 15;
  }

  async notifyUserDisconnection(userId: string) {
    // Mock disconnection handling
    console.log(`User ${userId} disconnected`);
  }
}