import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Global test setup
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'tourist_safety_test';
  process.env.JWT_SECRET = 'test-secret';
});

afterAll(async () => {
  // Cleanup after all tests
});
