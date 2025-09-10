import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertType, AlertSeverity } from '../../entities/alert.entity';
import { Tourist } from '../../entities/tourist.entity';

@Injectable()
export class EmergencyService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Tourist)
    private readonly touristRepository: Repository<Tourist>,
  ) {}

  async triggerSOS(touristId: string, message?: string, location?: { latitude: number; longitude: number }): Promise<Alert> {
    const tourist = await this.touristRepository.findOne({ where: { id: touristId } });
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const alert = this.alertRepository.create({
      type: AlertType.SOS,
      severity: AlertSeverity.CRITICAL,
      message: message || 'SOS Emergency Alert',
      location: location || tourist.currentLocation,
      touristId,
    });

    const savedAlert = await this.alertRepository.save(alert);

    // Here you would typically:
    // 1. Send SMS alerts
    // 2. Notify emergency services
    // 3. Send push notifications
    // 4. Log the incident

    console.log(`🚨 SOS ALERT triggered for tourist ${touristId}: ${message || 'Emergency!'}`);

    return savedAlert;
  }

  async sendAlert(alertData: {
    touristId: string;
    type: string;
    message: string;
    severity: string;
    location?: { latitude: number; longitude: number; address?: string };
  }): Promise<Alert> {
    const tourist = await this.touristRepository.findOne({ where: { id: alertData.touristId } });
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const alert = this.alertRepository.create({
      type: alertData.type as AlertType,
      severity: alertData.severity as AlertSeverity,
      message: alertData.message,
      location: alertData.location || tourist.currentLocation,
      touristId: alertData.touristId,
    });

    return await this.alertRepository.save(alert);
  }

  async getTouristAlerts(touristId: string): Promise<Alert[]> {
    return await this.alertRepository.find({
      where: { touristId },
      order: { createdAt: 'DESC' },
    });
  }

  async fileFIR(firData: {
    touristId: string;
    incidentType: string;
    description: string;
    location: { latitude: number; longitude: number; address?: string };
    incidentTime: Date;
  }): Promise<{ firNumber: string; message: string }> {
    // Generate FIR number
    const firNumber = `FIR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create alert for the FIR
    await this.sendAlert({
      touristId: firData.touristId,
      type: AlertType.SECURITY_THREAT,
      severity: AlertSeverity.HIGH,
      message: `FIR Filed: ${firData.incidentType} - ${firData.description}`,
      location: firData.location,
    });

    console.log(`📄 FIR Filed - Number: ${firNumber}, Tourist: ${firData.touristId}, Incident: ${firData.incidentType}`);

    return {
      firNumber,
      message: 'FIR filed successfully with local authorities',
    };
  }

  async getTouristFIRs(touristId: string): Promise<Alert[]> {
    return await this.alertRepository.find({
      where: {
        touristId,
        message: { $like: '%FIR Filed:%' } as any
      },
      order: { createdAt: 'DESC' },
    });
  }

  async sendSMSAlert(touristId: string, message: string, numbers?: string[]): Promise<{ success: boolean; message: string }> {
    const tourist = await this.touristRepository.findOne({ where: { id: touristId } });
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const defaultNumbers = [
      '+911234567890', // Emergency services
      '+919876543210', // Tourism helpline
    ];

    const targetNumbers = numbers || defaultNumbers;

    // Simulate SMS sending
    console.log(`📱 SMS Alert sent to ${targetNumbers.join(', ')}: ${message}`);

    return {
      success: true,
      message: `SMS alert sent to ${targetNumbers.length} numbers`,
    };
  }

  async initiateEmergencyCall(touristId: string, emergencyType: string, location?: { latitude: number; longitude: number }): Promise<{ success: boolean; callId: string; message: string }> {
    const tourist = await this.touristRepository.findOne({ where: { id: touristId } });
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const callId = `CALL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create alert for the emergency call
    await this.sendAlert({
      touristId,
      type: AlertType.SOS,
      severity: AlertSeverity.CRITICAL,
      message: `Emergency call initiated: ${emergencyType}`,
      location: location || tourist.currentLocation,
    });

    console.log(`📞 Emergency call initiated - ID: ${callId}, Tourist: ${touristId}, Type: ${emergencyType}`);

    return {
      success: true,
      callId,
      message: 'Emergency call initiated with local authorities',
    };
  }
}