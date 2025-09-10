import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { IoTDevice } from '../modules/iot/iot-device.entity';
import { DeviceTelemetry } from '../modules/iot/device-telemetry.entity';
import { DeviceAlert } from '../modules/iot/device-alert.entity';
import { User } from '../modules/auth/auth.entity';
import { Tourist } from '../modules/tourists/tourist.entity';

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: configService.get('DATABASE_URL') || 'postgresql://postgres:password123@localhost:5432/tourist_safety_db',
  entities: [
    IoTDevice,
    DeviceTelemetry,
    DeviceAlert,
    User,
    Tourist,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
});