import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Tourist } from '../../entities/tourist.entity';
import { Alert } from '../../entities/alert.entity';
import { IoTDevice } from '../../entities/iot-device.entity';
import { DeviceStatus, AlertSeverity } from '../../common/types/enums';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class WebsocketService {
  constructor(
    @InjectRepository(Tourist)
    private touristRepository: Repository<Tourist>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(IoTDevice)
    private deviceRepository: Repository<IoTDevice>,
    private cacheService: CacheService,
  ) {}

  async getDashboardStats() {
    // Get cached stats or calculate fresh ones
    const cachedStats = await this.cacheService.get('dashboard:stats');
    if (cachedStats) {
      return cachedStats;
    }

    const stats = await this.calculateDashboardStats();
    await this.cacheService.set('dashboard:stats', stats, 60); // Cache for 1 minute
    return stats;
  }

  private async calculateDashboardStats() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Active tourists
    const activeTourists = await this.touristRepository.count({
      where: { isActive: true },
    });

    // Online devices
    const onlineDevices = await this.deviceRepository.count({
      where: { status: DeviceStatus.ONLINE },
    });

    // Alerts in last 24 hours
    const alertsLast24h = await this.alertRepository.count({
      where: {
        timestamp: MoreThan(oneDayAgo),
      },
    });

    // Pending alerts
    const pendingAlerts = await this.alertRepository.count({
      where: { acknowledged: false },
    });

    // Critical alerts in last week
    const criticalAlertsWeek = await this.alertRepository.count({
      where: {
        severity: AlertSeverity.CRITICAL,
        timestamp: MoreThan(oneWeekAgo),
      },
    });

    return {
      activeTourists,
      onlineDevices,
      alertsLast24h,
      pendingAlerts,
      criticalAlertsWeek,
      timestamp: new Date().toISOString(),
    };
  }

  async getConnectedUsers(): Promise<number> {
    // Count connected WebSocket users from cache
    const keys = await this.cacheService.get('ws:*');
    return Array.isArray(keys) ? keys.length : 0;
  }

  async notifyUserDisconnection(userId: string) {
    await this.cacheService.del(`ws:${userId}`);
  }
}