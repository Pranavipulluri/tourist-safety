import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/api/v1/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'tourist@test.com',
          password: 'Test123!',
          firstName: 'John',
          lastName: 'Doe',
          role: 'tourist'
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.user.email).toBe('tourist@test.com');
          expect(res.body.data.accessToken).toBeDefined();
        });
    });

    it('should not register user with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!',
          firstName: 'John',
          lastName: 'Doe'
        })
        .expect(400);
    });
  });

  describe('/api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'tourist@test.com',
          password: 'Test123!'
        })
        .expect(200);

      authToken = response.body.data.accessToken;
      expect(authToken).toBeDefined();
    });

    it('should not login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'tourist@test.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    it('should access protected route with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should not access protected route without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});