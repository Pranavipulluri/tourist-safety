import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1694567890123 implements MigrationInterface {
    name = 'CreateInitialTables1694567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable PostGIS extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);
        
        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "role" character varying NOT NULL DEFAULT 'tourist',
                "isActive" boolean NOT NULL DEFAULT true,
                "lastLoginAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // Create tourists table
        await queryRunner.query(`
            CREATE TABLE "tourists" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "phoneNumber" character varying,
                "digitalIdHash" character varying NOT NULL,
                "emergencyContacts" json,
                "itinerary" json,
                "safetyScore" double precision NOT NULL DEFAULT '0',
                "familyTrackingEnabled" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "checkInTime" TIMESTAMP,
                "checkOutTime" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "UQ_tourists_digitalIdHash" UNIQUE ("digitalIdHash"),
                CONSTRAINT "PK_tourists_id" PRIMARY KEY ("id")
            )
        `);

        // Create digital_ids table
        await queryRunner.query(`
            CREATE TABLE "digital_ids" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "blockchainHash" character varying NOT NULL,
                "digitalIdNumber" character varying NOT NULL,
                "encryptedKycData" text NOT NULL,
                "encryptionIv" character varying NOT NULL,
                "encryptionAuthTag" character varying NOT NULL,
                "passportNumber" character varying NOT NULL,
                "nationality" character varying NOT NULL,
                "dateOfBirth" date NOT NULL,
                "issueDate" date NOT NULL,
                "expiryDate" date NOT NULL,
                "isValid" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "touristId" uuid NOT NULL,
                CONSTRAINT "UQ_digital_ids_blockchainHash" UNIQUE ("blockchainHash"),
                CONSTRAINT "UQ_digital_ids_digitalIdNumber" UNIQUE ("digitalIdNumber"),
                CONSTRAINT "PK_digital_ids_id" PRIMARY KEY ("id")
            )
        `);

        // Create locations table
        await queryRunner.query(`
            CREATE TABLE "locations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "latitude" decimal(10,8) NOT NULL,
                "longitude" decimal(11,8) NOT NULL,
                "altitude" decimal(8,2),
                "accuracy" decimal(8,2),
                "speed" decimal(8,2),
                "address" character varying,
                "metadata" json,
                "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                "touristId" uuid NOT NULL,
                CONSTRAINT "PK_locations_id" PRIMARY KEY ("id")
            )
        `);

        // Create alerts table
        await queryRunner.query(`
            CREATE TABLE "alerts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" character varying NOT NULL,
                "severity" character varying NOT NULL,
                "message" text NOT NULL,
                "latitude" decimal(10,8) NOT NULL,
                "longitude" decimal(11,8) NOT NULL,
                "metadata" json,
                "acknowledged" boolean NOT NULL DEFAULT false,
                "acknowledgedAt" TIMESTAMP,
                "response" character varying,
                "resolvedAt" TIMESTAMP,
                "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "touristId" uuid NOT NULL,
                "responderId" uuid,
                CONSTRAINT "PK_alerts_id" PRIMARY KEY ("id")
            )
        `);

        // Create iot_devices table
        await queryRunner.query(`
            CREATE TABLE "iot_devices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "serialNumber" character varying NOT NULL,
                "deviceType" character varying NOT NULL,
                "firmwareVersion" character varying NOT NULL,
                "status" character varying NOT NULL DEFAULT 'offline',
                "batteryLevel" integer NOT NULL DEFAULT '100',
                "lastSeenAt" TIMESTAMP,
                "configuration" json,
                "capabilities" json,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "touristId" uuid,
                CONSTRAINT "UQ_iot_devices_serialNumber" UNIQUE ("serialNumber"),
                CONSTRAINT "PK_iot_devices_id" PRIMARY KEY ("id")
            )
        `);

        // Create geofences table
        await queryRunner.query(`
            CREATE TABLE "geofences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "type" character varying NOT NULL,
                "description" text,
                "coordinates" json NOT NULL,
                "radius" decimal(10,2),
                "isActive" boolean NOT NULL DEFAULT true,
                "metadata" json,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_geofences_id" PRIMARY KEY ("id")
            )
        `);

        // Create foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "tourists" ADD CONSTRAINT "FK_tourists_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "digital_ids" ADD CONSTRAINT "FK_digital_ids_touristId" 
            FOREIGN KEY ("touristId") REFERENCES "tourists"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "locations" ADD CONSTRAINT "FK_locations_touristId" 
            FOREIGN KEY ("touristId") REFERENCES "tourists"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "alerts" ADD CONSTRAINT "FK_alerts_touristId" 
            FOREIGN KEY ("touristId") REFERENCES "tourists"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "alerts" ADD CONSTRAINT "FK_alerts_responderId" 
            FOREIGN KEY ("responderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "iot_devices" ADD CONSTRAINT "FK_iot_devices_touristId" 
            FOREIGN KEY ("touristId") REFERENCES "tourists"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Create indexes for better performance
        await queryRunner.query(`CREATE INDEX "IDX_tourists_digitalIdHash" ON "tourists" ("digitalIdHash")`);
        await queryRunner.query(`CREATE INDEX "IDX_locations_touristId_timestamp" ON "locations" ("touristId", "timestamp")`);
        await queryRunner.query(`CREATE INDEX "IDX_locations_coordinates" ON "locations" USING GIST (ST_Point("longitude", "latitude"))`);
        await queryRunner.query(`CREATE INDEX "IDX_alerts_touristId_timestamp" ON "alerts" ("touristId", "timestamp")`);
        await queryRunner.query(`CREATE INDEX "IDX_alerts_type_severity" ON "alerts" ("type", "severity")`);
        await queryRunner.query(`CREATE INDEX "IDX_alerts_acknowledged" ON "alerts" ("acknowledged")`);
        await queryRunner.query(`CREATE INDEX "IDX_iot_devices_serialNumber" ON "iot_devices" ("serialNumber")`);
        await queryRunner.query(`CREATE INDEX "IDX_iot_devices_status" ON "iot_devices" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_geofences_isActive" ON "geofences" ("isActive")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "iot_devices" DROP CONSTRAINT "FK_iot_devices_touristId"`);
        await queryRunner.query(`ALTER TABLE "alerts" DROP CONSTRAINT "FK_alerts_responderId"`);
        await queryRunner.query(`ALTER TABLE "alerts" DROP CONSTRAINT "FK_alerts_touristId"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_locations_touristId"`);
        await queryRunner.query(`ALTER TABLE "digital_ids" DROP CONSTRAINT "FK_digital_ids_touristId"`);
        await queryRunner.query(`ALTER TABLE "tourists" DROP CONSTRAINT "FK_tourists_userId"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_geofences_isActive"`);
        await queryRunner.query(`DROP INDEX "IDX_iot_devices_status"`);
        await queryRunner.query(`DROP INDEX "IDX_iot_devices_serialNumber"`);
        await queryRunner.query(`DROP INDEX "IDX_alerts_acknowledged"`);
        await queryRunner.query(`DROP INDEX "IDX_alerts_type_severity"`);
        await queryRunner.query(`DROP INDEX "IDX_alerts_touristId_timestamp"`);
        await queryRunner.query(`DROP INDEX "IDX_locations_coordinates"`);
        await queryRunner.query(`DROP INDEX "IDX_locations_touristId_timestamp"`);
        await queryRunner.query(`DROP INDEX "IDX_tourists_digitalIdHash"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "geofences"`);
        await queryRunner.query(`DROP TABLE "iot_devices"`);
        await queryRunner.query(`DROP TABLE "alerts"`);
        await queryRunner.query(`DROP TABLE "locations"`);
        await queryRunner.query(`DROP TABLE "digital_ids"`);
        await queryRunner.query(`DROP TABLE "tourists"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}