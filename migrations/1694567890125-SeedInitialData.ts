import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialData1694567890125 implements MigrationInterface {
    name = 'SeedInitialData1694567890125'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create default admin user
        await queryRunner.query(`
            INSERT INTO "users" ("id", "email", "password", "role", "isActive")
            VALUES (
                uuid_generate_v4(),
                'admin@touristsafety.gov.in',
                '$2b$12$LQv3c1yqBwVHrEZj5Ct8dO3p7lE0vRAk1CrZyN5XkZoGVxqfGUO1u', -- password: admin123
                'system_admin',
                true
            )
        `);

        // Create default police user
        await queryRunner.query(`
            INSERT INTO "users" ("id", "email", "password", "role", "isActive")
            VALUES (
                uuid_generate_v4(),
                'police@assam.gov.in',
                '$2b$12$LQv3c1yqBwVHrEZj5Ct8dO3p7lE0vRAk1CrZyN5XkZoGVxqfGUO1u', -- password: police123
                'police',
                true
            )
        `);

        // Create default tourism admin user
        await queryRunner.query(`
            INSERT INTO "users" ("id", "email", "password", "role", "isActive")
            VALUES (
                uuid_generate_v4(),
                'tourism@assam.gov.in',
                '$2b$12$LQv3c1yqBwVHrEZj5Ct8dO3p7lE0vRAk1CrZyN5XkZoGVxqfGUO1u', -- password: tourism123
                'tourism_admin',
                true
            )
        `);

        // Create sample geofences for Assam tourist locations
        await queryRunner.query(`
            INSERT INTO "geofences" ("id", "name", "type", "description", "coordinates", "isActive")
            VALUES (
                uuid_generate_v4(),
                'Kaziranga National Park - Safe Zone',
                'safe_zone',
                'Main tourist area of Kaziranga National Park',
                '[{"lat": 26.5775, "lng": 93.1742}, {"lat": 26.5820, "lng": 93.1801}, {"lat": 26.5891, "lng": 93.1923}, {"lat": 26.5934, "lng": 93.2012}, {"lat": 26.5756, "lng": 93.2156}]',
                true
            )
        `);

        await queryRunner.query(`
            INSERT INTO "geofences" ("id", "name", "type", "description", "coordinates", "radius", "isActive")
            VALUES (
                uuid_generate_v4(),
                'Restricted Wildlife Area',
                'restricted_area',
                'Core wildlife sanctuary - tourist access prohibited',
                '[{"lat": 26.5850, "lng": 93.1950}]',
                2000,
                true
            )
        `);

        await queryRunner.query(`
            INSERT INTO "geofences" ("id", "name", "type", "description", "coordinates", "isActive")
            VALUES (
                uuid_generate_v4(),
                'Majuli Island Ferry Route',
                'safe_zone',
                'Safe ferry route to Majuli Island',
                '[{"lat": 27.0500, "lng": 94.2100}, {"lat": 27.0520, "lng": 94.2150}, {"lat": 27.0580, "lng": 94.2200}, {"lat": 27.0600, "lng": 94.2180}]',
                true
            )
        `);

        await queryRunner.query(`
            INSERT INTO "geofences" ("id", "name", "type", "description", "coordinates", "radius", "isActive")
            VALUES (
                uuid_generate_v4(),
                'Guwahati Airport Zone',
                'safe_zone',
                'Safe zone around Guwahati Airport',
                '[{"lat": 26.1061, "lng": 91.5856}]',
                5000,
                true
            )
        `);

        await queryRunner.query(`
            INSERT INTO "geofences" ("id", "name", "type", "description", "coordinates", "radius", "isActive")
            VALUES (
                uuid_generate_v4(),
                'Border Area - High Risk',
                'high_risk_area',
                'International border area requiring special permits',
                '[{"lat": 25.8000, "lng": 89.7000}]',
                10000,
                true
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "geofences"`);
        await queryRunner.query(`DELETE FROM "users" WHERE "email" IN ('admin@touristsafety.gov.in', 'police@assam.gov.in', 'tourism@assam.gov.in')`);
    }
}