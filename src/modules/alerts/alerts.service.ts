import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertSeverity, AlertStatus, AlertType } from './alert.entity';

export interface CreateAlertDto {
  type: AlertType;
  severity?: AlertSeverity;
  message: string;
  latitude: number;
  longitude: number;
  address?: string;
  touristId: string;
  metadata?: Record<string, any>;
}

export interface UpdateAlertDto {
  status?: AlertStatus;
  acknowledgedBy?: string;
  resolvedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AlertsFilter {
  type?: AlertType;
  status?: AlertStatus;
  severity?: AlertSeverity;
  touristId?: string;
  startDate?: Date;
  endDate?: Date;
  latitude?: number;
  longitude?: number;
  radius?: number; // in meters
}

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) {}

  async createAlert(createAlertDto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepository.create({
      ...createAlertDto,
      severity: createAlertDto.severity || this.getDefaultSeverity(createAlertDto.type),
      status: AlertStatus.ACTIVE,
    });

    const savedAlert = await this.alertRepository.save(alert);
    
    // Load the alert with tourist relationship
    const alertWithRelations = await this.alertRepository.findOne({
      where: { id: savedAlert.id },
      relations: ['tourist'],
    });

    if (!alertWithRelations) {
      throw new NotFoundException('Failed to create alert');
    }

    return alertWithRelations;
  }

  async findAll(filter: AlertsFilter = {}): Promise<Alert[]> {
    const query = this.alertRepository.createQueryBuilder('alert')
      .leftJoinAndSelect('alert.tourist', 'tourist');

    // Apply filters
    if (filter.type) {
      query.andWhere('alert.type = :type', { type: filter.type });
    }

    if (filter.status) {
      query.andWhere('alert.status = :status', { status: filter.status });
    }

    if (filter.severity) {
      query.andWhere('alert.severity = :severity', { severity: filter.severity });
    }

    if (filter.touristId) {
      query.andWhere('alert.touristId = :touristId', { touristId: filter.touristId });
    }

    if (filter.startDate && filter.endDate) {
      query.andWhere('alert.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    // Geospatial filtering for nearby alerts
    if (filter.latitude && filter.longitude && filter.radius) {
      const radiusInKm = filter.radius / 1000;
      query.andWhere(`
        ST_DWithin(
          ST_Point(alert.longitude, alert.latitude)::geography,
          ST_Point(:longitude, :latitude)::geography,
          :radius
        )
      `, {
        latitude: filter.latitude,
        longitude: filter.longitude,
        radius: filter.radius,
      });
    }

    query.orderBy('alert.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id },
      relations: ['tourist'],
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return alert;
  }

  async updateAlert(id: string, updateAlertDto: UpdateAlertDto): Promise<Alert> {
    const alert = await this.findOne(id);

    // Auto-set timestamps based on status changes
    if (updateAlertDto.status === AlertStatus.ACKNOWLEDGED && !alert.acknowledgedAt) {
      updateAlertDto['acknowledgedAt'] = new Date();
    }

    if (updateAlertDto.status === AlertStatus.RESOLVED && !alert.resolvedAt) {
      updateAlertDto['resolvedAt'] = new Date();
    }

    Object.assign(alert, updateAlertDto);
    return this.alertRepository.save(alert);
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert> {
    return this.updateAlert(id, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedBy,
    });
  }

  async resolveAlert(id: string, resolvedBy: string): Promise<Alert> {
    return this.updateAlert(id, {
      status: AlertStatus.RESOLVED,
      resolvedBy,
    });
  }

  async getHeatmapData(filter: AlertsFilter = {}): Promise<any> {
    const alerts = await this.findAll(filter);

    // Group alerts by location (approximately)
    const locationGroups = new Map<string, Alert[]>();

    alerts.forEach(alert => {
      // Round coordinates to create location groups (precision of ~100m)
      const lat = Math.round(alert.latitude * 1000) / 1000;
      const lng = Math.round(alert.longitude * 1000) / 1000;
      const key = `${lat},${lng}`;

      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key)!.push(alert);
    });

    // Create heatmap points
    const heatmapData = Array.from(locationGroups.entries()).map(([key, groupAlerts]) => {
      const [lat, lng] = key.split(',').map(Number);
      const severityWeights = { low: 0, medium: 0, high: 0, critical: 0 };
      const types: Record<string, number> = {};

      groupAlerts.forEach(alert => {
        severityWeights[alert.severity.toLowerCase() as keyof typeof severityWeights]++;
        types[alert.type] = (types[alert.type] || 0) + 1;
      });

      const maxSeverityWeight = Math.max(...Object.values(severityWeights));
      const intensity = Math.min(1, groupAlerts.length / 10); // Normalize intensity

      return {
        latitude: lat,
        longitude: lng,
        count: groupAlerts.length,
        intensity,
        severityWeights,
        types,
        recentAlerts: groupAlerts
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
          .map(alert => ({
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            timestamp: alert.createdAt.toISOString(),
            touristName: `${alert.tourist?.firstName || ''} ${alert.tourist?.lastName || ''}`.trim() || 'Anonymous',
          })),
      };
    });

    // Get hotspots (locations with high alert counts)
    const hotspots = heatmapData
      .filter(point => point.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate statistics
    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};

    alerts.forEach(alert => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    });

    return {
      heatmapData,
      totalAlerts: alerts.length,
      timeRange: {
        start: filter.startDate || null,
        end: filter.endDate || null,
      },
      hotspots,
      alertsByType,
      alertsBySeverity,
      trends: await this.getAlertTrends(filter),
    };
  }

  async getAlertTrends(filter: AlertsFilter = {}): Promise<any[]> {
    // Get alerts for the last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const query = this.alertRepository.createQueryBuilder('alert')
      .select('DATE(alert.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('alert.severity', 'severity')
      .where('alert.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(alert.createdAt)')
      .addGroupBy('alert.severity')
      .orderBy('date', 'ASC');

    if (filter.type) {
      query.andWhere('alert.type = :type', { type: filter.type });
    }

    return query.getRawMany();
  }

  async getStatistics(): Promise<any> {
    const total = await this.alertRepository.count();
    const active = await this.alertRepository.count({ where: { status: AlertStatus.ACTIVE } });
    const resolved = await this.alertRepository.count({ where: { status: AlertStatus.RESOLVED } });

    const avgResponseTime = await this.alertRepository
      .createQueryBuilder('alert')
      .select('AVG(EXTRACT(EPOCH FROM (alert.acknowledgedAt - alert.createdAt)))', 'avgSeconds')
      .where('alert.acknowledgedAt IS NOT NULL')
      .getRawOne();

    return {
      total,
      active,
      resolved,
      averageResponseTime: avgResponseTime?.avgSeconds ? Math.round(avgResponseTime.avgSeconds / 60) : null, // in minutes
    };
  }

  private getDefaultSeverity(type: AlertType): AlertSeverity {
    switch (type) {
      case AlertType.SOS:
        return AlertSeverity.CRITICAL;
      case AlertType.PANIC:
        return AlertSeverity.HIGH;
      case AlertType.EMERGENCY:
        return AlertSeverity.CRITICAL;
      case AlertType.GEOFENCE:
        return AlertSeverity.MEDIUM;
      case AlertType.SAFETY_CHECK:
        return AlertSeverity.LOW;
      default:
        return AlertSeverity.MEDIUM;
    }
  }
}