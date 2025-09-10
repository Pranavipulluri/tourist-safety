const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');

let app;

async function createNestApp() {
  if (!app) {
    try {
      console.log('🚀 Loading AppModule from dist...');
      
      // Try to load the compiled AppModule from dist
      let AppModule;
      try {
        AppModule = require('../dist/app.module').AppModule;
      } catch (distError) {
        console.log('📦 Dist not found, trying src...');
        // Fallback to TypeScript compilation
        require('ts-node/register');
        AppModule = require('../src/app.module').AppModule;
      }
      
      console.log('🚀 Creating NestJS app...');
      
      app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
        cors: true,
      });
      
      // Enable CORS
      app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      });

      // Global validation pipe
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          disableErrorMessages: false,
        })
      );

      // Set global prefix
      app.setGlobalPrefix('api');
      
      await app.init();
      console.log('✅ NestJS app initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize NestJS app:', error);
      console.error('Stack:', error.stack);
      throw error;
    }
  }
  return app;
}

module.exports = async function handler(req, res) {
  try {
    console.log(`📡 ${req.method} ${req.url}`);
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(200).end();
      return;
    }
    
    const app = await createNestApp();
    const expressInstance = app.getHttpAdapter().getInstance();
    
    return new Promise((resolve, reject) => {
      expressInstance(req, res, (err) => {
        if (err) {
          console.error('❌ Express handler error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('🚨 Serverless function crashed:', error);
    console.error('Stack trace:', error.stack);
    
    // Ensure response is sent
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Tourist Safety API is temporarily unavailable',
        details: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        status: 500,
        service: 'Tourist Safety Backend'
      });
    }
  }
};
