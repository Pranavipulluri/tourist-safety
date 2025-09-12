import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../../entities/alert.entity';
import { Tourist } from '../../entities/tourist.entity';

@Injectable()
export class WebsocketService {
  constructor(
    @InjectRepository(Tourist)
    private readonly touristRepository: Repository<Tourist>,
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) {}

  async getDashboardStats() {
    // Get real dashboard stats from database
    const activeTourists = await this.touristRepository.count();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const alertsLast24h = await this.alertRepository.count({
      where: {
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) as any
      }
    });
    const pendingAlerts = await this.alertRepository.count({
      where: {
        isResolved: false
      }
    });

    const stats = {
      activeTourists,
      onlineDevices: Math.floor(activeTourists * 0.7), // Simulate ~70% online
      alertsLast24h,
      pendingAlerts,
      criticalAlertsWeek: Math.floor(alertsLast24h * 0.3), // Simulate critical alerts
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