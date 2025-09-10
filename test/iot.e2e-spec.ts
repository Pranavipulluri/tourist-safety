import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('IoT Devices (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create admin user and get token
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      });

    const adminResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!'
      });

    adminToken = adminResponse.body.data.accessToken;
  });

  describe('Device pairing', () => {
    it('should pair device with tourist (admin only)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/iot/devices/TSB001234567/pair/tourist-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Device pairing command sent');
        });
    });

    it('should not allow tourist to pair device', () => {
      return request(app.getHttpServer())
        .post('/api/v1/iot/devices/TSB001234567/pair/tourist-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Device commands', () => {
    it('should send location request to device', () => {
      return request(app.getHttpServer())
        .post('/api/v1/iot/devices/TSB001234567/locate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should test SOS functionality', () => {
      return request(app.getHttpServer())
        .post('/api/v1/iot/devices/TSB001234567/test-sos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
