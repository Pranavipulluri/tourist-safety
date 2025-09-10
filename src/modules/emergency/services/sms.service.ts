import { Injectable, Logger } from '@nestjs/common';
import { MockDatabaseService } from '../../../services/mock-database.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly mockDb: MockDatabaseService,
  ) {}

  async sendErrorZoneAlert(touristId: string, zoneName: string, message: string) {
    try {
      const tourist = await this.mockDb.findTouristById(touristId);

      if (!tourist || !tourist.phoneNumber) {
        throw new Error('Tourist or phone number not found');
      }

      const smsMessage = `🚨 ALERT: You have entered ${zoneName}. ${message}`;

      // Here you would integrate with SMS service (Twilio, etc.)
      // For now, we'll log the SMS that would be sent
      this.logger.log(`SMS Alert to ${tourist.phoneNumber}: ${smsMessage}`);

      // In production, you would call the actual SMS service:
      // await this.twilioService.sendSMS(tourist.phoneNumber, smsMessage);

      return {
        success: true,
        touristId,
        phoneNumber: tourist.phoneNumber,
        message: smsMessage,
        zoneName,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send error zone alert to ${touristId}:`, error);
      throw error;
    }
  }

  async sendBulkSMS(location: { lat: number; lng: number; radius: number }, message: string, priority: string) {
    try {
      // Find tourists within the specified radius using mock database
      const touristsInArea = await this.mockDb.getNearbyTourists(location.lat, location.lng, location.radius);

      const results = [];
      for (const touristData of touristsInArea) {
        const tourist = touristData.tourist;
        if (tourist.phoneNumber) {
          const smsMessage = `📢 ${priority.toUpperCase()} ALERT: ${message}`;

          // Log SMS that would be sent
          this.logger.log(`Bulk SMS to ${tourist.phoneNumber}: ${smsMessage}`);

          results.push({
            touristId: tourist.id,
            phoneNumber: tourist.phoneNumber,
            message: smsMessage,
            sent: true,
          });
        }
      }

      return {
        success: true,
        totalSent: results.length,
        location,
        radius: location.radius,
        priority,
        message,
        results,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to send bulk SMS:', error);
      throw error;
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async sendEmergencyAlert(touristId: string, alertType: string, location?: { lat: number; lng: number }) {
    try {
      const tourist = await this.mockDb.findTouristById(touristId);

      if (!tourist || !tourist.phoneNumber) {
        throw new Error('Tourist or phone number not found');
      }

      let message = `🚨 EMERGENCY ALERT: ${alertType}`;

      if (location) {
        message += ` at location (${location.lat}, ${location.lng})`;
      }

      message += '. Please stay safe and follow local authorities instructions.';

      this.logger.log(`Emergency SMS to ${tourist.phoneNumber}: ${message}`);

      return {
        success: true,
        touristId,
        phoneNumber: tourist.phoneNumber,
        message,
        alertType,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send emergency alert to ${touristId}:`, error);
      throw error;
    }
  }
}
