import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1693000000001 implements MigrationInterface {
  name = 'InitialSchema1693000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'TOURIST',
        "phone" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "lastLogin" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    // Create tourists table
    await queryRunner.query(`
      CREATE TABLE "tourists" (
        "id" SERIAL NOT NULL,
        "touristId" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying,
        "nationality" character varying,
        "passportNumber" character varying,
        "aadhaarNumber" character varying,
        "dateOfBirth" date,
        "gender" character varying,
        "emergencyContact" character varying,
        "emergencyPhone" character varying,
        "itinerary" text,
        "visitStartDate" date,
        "visitEndDate" date,
        "isActive" boolean NOT NULL DEFAULT true,
        "assignedDevice" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tourist_id" UNIQUE ("touristId"),
        CONSTRAINT "PK_tourists" PRIMARY KEY ("id")
      )
    `);

    // Create iot_devices table
    await queryRunner.query(`
      CREATE TABLE "iot_devices" (
        "id" SERIAL NOT NULL,
        "deviceId" character varying NOT NULL,
        "touristId" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'offline',
        "latitude" decimal(10,8),
        "longitude" decimal(11,8),
        "batteryLevel" decimal(5,2),
        "signalStrength" integer,
        "lastSeen" TIMESTAMP,
        "lastLocationUpdate" TIMESTAMP,
        "lastEmergency" TIMESTAMP,
        "uptime" integer,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_device_id" UNIQUE ("deviceId"),
        CONSTRAINT "PK_iot_devices" PRIMARY KEY ("id")
      )
    `);

    // Create device_telemetry table
    await queryRunner.query(`
      CREATE TABLE "device_telemetry" (
        "id" SERIAL NOT NULL,
        "deviceId" character varying NOT NULL,
        "touristId" character varying NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        "latitude" decimal(10,8) NOT NULL,
        "longitude" decimal(11,8) NOT NULL,
        "accuracy" decimal(5,2),
        "heartRate" integer,
        "batteryLevel" decimal(5,2) NOT NULL,
        "signalStrength" integer,
        "speed" decimal(5,2),
        "altitude" decimal(8,2),
        "deviceStatus" character varying NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_telemetry" PRIMARY KEY ("id")
      )
    `);

    // Create device_alerts table
    await queryRunner.query(`
      CREATE TABLE "device_alerts" (
        "id" SERIAL NOT NULL,
        "deviceId" character varying NOT NULL,
        "touristId" character varying NOT NULL,
        "type" character varying NOT NULL,
        "priority" character varying NOT NULL DEFAULT 'MEDIUM',
        "message" text NOT NULL,
        "latitude" decimal(10,8),
        "longitude" decimal(11,8),
        "timestamp" TIMESTAMP NOT NULL,
        "resolved" boolean NOT NULL DEFAULT false,
        "resolvedAt" TIMESTAMP,
        "resolvedBy" character varying,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_alerts" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_telemetry_device_timestamp" ON "device_telemetry" ("deviceId", "timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_alerts_type_timestamp" ON "device_alerts" ("type", "timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_alerts_device_timestamp" ON "device_alerts" ("deviceId", "timestamp")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_alerts_device_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_alerts_type_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_telemetry_device_timestamp"`);
    await queryRunner.query(`DROP TABLE "device_alerts"`);
    await queryRunner.query(`DROP TABLE "device_telemetry"`);
    await queryRunner.query(`DROP TABLE "iot_devices"`);
    await queryRunner.query(`DROP TABLE "tourists"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}