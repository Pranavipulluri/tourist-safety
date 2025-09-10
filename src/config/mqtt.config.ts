import { registerAs } from '@nestjs/config';

export const mqttConfig = registerAs('mqtt', () => ({
  brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  username: process.env.MQTT_USERNAME || '',
  password: process.env.MQTT_PASSWORD || '',
  clientId: process.env.MQTT_CLIENT_ID || 'tourist-safety-backend',
  topics: {
    telemetry: 'iot/tourist/+/telemetry',
    events: 'iot/tourist/+/event',
    management: 'iot/management/+',
  },
}));