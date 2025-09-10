import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDatabaseService } from '../../services/mock-database.service';

@Injectable()
export class EmergencyService {
  constructor(
    private readonly mockDb: MockDatabaseService,
  ) {}

  async triggerSOS(touristId: string, message?: string, location?: { latitude: number; longitude: number }): Promise<any> {
    const tourist = await this.mockDb.findTouristById(touristId);
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const alert = await this.mockDb.createAlert({
      type: 'sos',
      severity: 'critical',
      message: message || 'SOS Emergency Alert',
      location: location || tourist.currentLocation,
      touristId,
    });

    console.log(`🚨 SOS ALERT triggered for tourist ${touristId}: ${message || 'Emergency!'}`);

    return alert;
  }

  async sendAlert(alertData: {
    touristId: string;
    type: string;
    message: string;
    severity: string;
    location?: { latitude: number; longitude: number; address?: string };
  }): Promise<any> {
    const tourist = await this.mockDb.findTouristById(alertData.touristId);
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const alert = await this.mockDb.createAlert({
      type: alertData.type,
      severity: alertData.severity,
      message: alertData.message,
      location: alertData.location || tourist.currentLocation,
      touristId: alertData.touristId,
    });

    return alert;
  }

  async getTouristAlerts(touristId: string): Promise<any[]> {
    return await this.mockDb.getTouristAlerts(touristId);
  }

  async fileFIR(firData: {
    touristId: string;
    incidentType: string;
    description: string;
    location: { latitude: number; longitude: number; address?: string };
    incidentTime: Date;
  }): Promise<{ firNumber: string; message: string }> {
    const firNumber = `FIR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    await this.sendAlert({
      touristId: firData.touristId,
      type: 'security_threat',
      severity: 'high',
      message: `FIR Filed: ${firData.incidentType} - ${firData.description}`,
      location: firData.location,
    });

    console.log(`📄 FIR Filed - Number: ${firNumber}, Tourist: ${firData.touristId}, Incident: ${firData.incidentType}`);

    return {
      firNumber,
      message: 'FIR filed successfully with local authorities',
    };
  }

  async getTouristFIRs(touristId: string): Promise<any[]> {
    const alerts = await this.mockDb.getTouristAlerts(touristId);
    return alerts.filter(alert => alert.message.includes('FIR Filed'));
  }

  async sendSMSAlert(touristId: string, message: string, numbers?: string[]): Promise<{ success: boolean; message: string }> {
    const tourist = await this.mockDb.findTouristById(touristId);
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const defaultNumbers = [
      '+911234567890',
      '+919876543210',
    ];

    const targetNumbers = numbers || defaultNumbers;

    console.log(`📱 SMS Alert sent to ${targetNumbers.join(', ')}: ${message}`);

    return {
      success: true,
      message: `SMS alert sent to ${targetNumbers.length} numbers`,
    };
  }

  async initiateEmergencyCall(touristId: string, emergencyType: string, location?: { latitude: number; longitude: number }): Promise<{ success: boolean; callId: string; message: string }> {
    const tourist = await this.mockDb.findTouristById(touristId);
    if (!tourist) {
      throw new NotFoundException('Tourist not found');
    }

    const callId = `CALL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    await this.sendAlert({
      touristId,
      type: 'sos',
      severity: 'critical',
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