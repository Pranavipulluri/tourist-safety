#!/bin/bash

# 🚀 Smart Tourist Safety AI Integration - Complete Setup Script
# This script sets up the entire backend infrastructure automatically

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🏷️  Smart Tourist Safety AI Integration Setup            ║
║                                                              ║
║    Setting up complete backend infrastructure...             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on supported OS
check_os() {
    print_info "Checking operating system..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        print_status "Detected Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        print_status "Detected macOS"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
        print_status "Detected Windows"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
}

# Check for required tools
check_dependencies() {
    print_info "Checking dependencies..."
    
    # Check for Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check for npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    # Check for Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_status "Docker found: $DOCKER_VERSION"
    else
        print_warning "Docker not found. Installing Docker..."
        install_docker
    fi
    
    # Check for Docker Compose
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_VERSION=$(docker-compose --version)
        print_status "Docker Compose found: $DOCKER_COMPOSE_VERSION"
    else
        print_warning "Docker Compose not found. It will be installed with Docker."
    fi
}

# Install Docker based on OS
install_docker() {
    if [[ "$OS" == "linux" ]]; then
        print_info "Installing Docker on Linux..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        print_status "Docker installed. Please log out and log back in for group changes to take effect."
    elif [[ "$OS" == "macos" ]]; then
        print_warning "Please install Docker Desktop for Mac from https://docs.docker.com/desktop/mac/install/"
        print_warning "After installation, run this script again."
        exit 1
    elif [[ "$OS" == "windows" ]]; then
        print_warning "Please install Docker Desktop for Windows from https://docs.docker.com/desktop/windows/install/"
        print_warning "After installation, run this script again."
        exit 1
    fi
}

# Get computer's IP address
get_ip_address() {
    print_info "Detecting IP address..."
    
    if [[ "$OS" == "linux" ]]; then
        IP_ADDRESS=$(hostname -I | awk '{print $1}')
    elif [[ "$OS" == "macos" ]]; then
        IP_ADDRESS=$(ifconfig | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}' | head -1)
    elif [[ "$OS" == "windows" ]]; then
        IP_ADDRESS=$(ipconfig | grep "IPv4" | head -1 | awk '{print $14}')
    fi
    
    if [[ -z "$IP_ADDRESS" ]]; then
        print_warning "Could not detect IP address automatically"
        read -p "Please enter your computer's IP address: " IP_ADDRESS
    fi
    
    print_status "Using IP address: $IP_ADDRESS"
}

# Create project structure
create_project_structure() {
    print_info "Creating project structure..."
    
    # Create main directories
    mkdir -p src/{config,common/{services,guards,decorators,types},modules/{auth,tourists,location,alerts,dashboard,iot,notifications},database/migrations}
    mkdir -p ssl scripts logs
    
    print_status "Project structure created"
}

# Create package.json
create_package_json() {
    print_info "Creating package.json..."
    
    cat > package.json << 'EOF'
{
  "name": "smart-tourist-safety-backend",
  "version": "1.0.0",
  "description": "Smart Tourist Safety Monitoring & Incident Response System Backend",
  "author": "Tourist Safety Team",
  "private": true,
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm -- -d src/database/data-source.ts migration:generate",
    "migration:run": "npm run typeorm -- -d src/database/data-source.ts migration:run",
    "migration:revert": "npm run typeorm -- -d src/database/data-source.ts migration:revert"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/event-emitter": "^2.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "bcryptjs": "^2.4.3",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "firebase-admin": "^12.0.0",
    "ioredis": "^5.3.0",
    "mqtt": "^5.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "pg": "^8.11.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.0",
    "twilio": "^4.19.0",
    "typeorm": "^0.3.17"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcryptjs": "^2.4.2",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/passport-jwt": "^3.0.9",
    "@types/pg": "^8.10.0",
    "@types/supertest": "^2.0.12",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.1",
    "typescript": "^5.1.3"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
EOF
    
    print_status "package.json created"
}

# Create environment configuration
create_env_config() {
    print_info "Creating environment configuration..."
    
    cat > .env.example << EOF
# 🏷️ Smart Tourist Safety Backend - Environment Configuration

# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://postgres:password123@localhost:5432/tourist_safety_db

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# MQTT Broker
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h

# Twilio SMS Service (Get from https://console.twilio.com/)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Firebase Push Notifications (Get from Firebase Console)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Mapbox (Optional - for map features)
MAPBOX_ACCESS_TOKEN=pk.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Blockchain (Optional - for digital ID)
BLOCKCHAIN_NETWORK=testnet
BLOCKCHAIN_API_KEY=your-blockchain-api-key

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log
EOF

    # Create actual .env file
    cp .env.example .env
    
    # Update IP address in .env
    sed -i.bak "s/localhost/$IP_ADDRESS/g" .env
    rm -f .env.bak
    
    print_status "Environment configuration created with IP: $IP_ADDRESS"
}

# Create basic NestJS files
create_basic_files() {
    print_info "Creating basic NestJS files..."
    
    # main.ts
    cat > src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  
  const config = new DocumentBuilder()
    .setTitle('Smart Tourist Safety API')
    .setDescription('REST API for Smart Tourist Safety Monitoring System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log('🚀 Smart Tourist Safety Backend started!');
  console.log(`📡 Server running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔍 Health Check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
EOF

    # app.module.ts
    cat > src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
EOF

    # Health check
    cat > src/health-check.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
EOF

    # TypeScript configuration
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
EOF

    # NestJS CLI config
    cat > nest-cli.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
EOF

    print_status "Basic NestJS files created"
}

# Create Dockerfile
create_dockerfile() {
    print_info "Creating Dockerfile..."
    
    cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node src/health-check.js

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
EOF
    
    print_status "Dockerfile created"
}

# Create test files
create_test_files() {
    print_info "Creating test configuration..."
    
    # MQTT test
    cat > test-mqtt.js << 'EOF'
const mqtt = require('mqtt');

console.log('🧪 Testing MQTT Connection...');

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  
  client.subscribe('test/topic', (err) => {
    if (!err) {
      console.log('📡 Subscribed to test/topic');
      client.publish('test/topic', 'Hello from Tourist Safety System!');
    }
  });
});

client.on('message', (topic, message) => {
  console.log('📨 Received:', topic, message.toString());
  console.log('🎉 MQTT connection test successful!');
  client.end();
});

client.on('error', (error) => {
  console.error('❌ MQTT Error:', error);
  process.exit(1);
});

setTimeout(() => {
  console.log('⏰ Test timeout');
  process.exit(1);
}, 10000);
EOF

    print_status "Test files created"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    if [ -f package-lock.json ]; then
        rm package-lock.json
    fi
    
    npm install
    
    print_status "Dependencies installed"
}

# Start Docker services
start_docker_services() {
    print_info "Starting Docker services..."
    
    # Start development services
    docker-compose -f docker-compose.dev.yml up -d
    
    print_info "Waiting for services to start..."
    sleep 30
    
    print_status "Docker services started"
}

# Create final setup summary
create_setup_summary() {
    print_info "Creating setup summary..."
    
    cat > SETUP_COMPLETE.md << EOF
# 🎉 Smart Tourist Safety Backend Setup Complete!

## 🚀 Quick Start Guide

### 1. Start the Backend
\`\`\`bash
npm run start:dev
\`\`\`

### 2. Test MQTT Connection
\`\`\`bash
node test-mqtt.js
\`\`\`

### 3. Setup ESP32 in Wokwi
1. Go to https://wokwi.com
2. Create new ESP32 project
3. Copy the ESP32 code provided
4. Update MQTT server IP to: **$IP_ADDRESS**
5. Run the simulation

### 4. Open Web Dashboard
Open \`dashboard.html\` in your browser

## 📚 Important URLs

- **API Server**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs  
- **Health Check**: http://localhost:3000/api/v1/health
- **MQTT Broker**: mqtt://localhost:1883

## 🔧 Your Configuration

- **Computer IP**: $IP_ADDRESS
- **Database**: PostgreSQL (localhost:5432)
- **Cache**: Redis (localhost:6379)
- **MQTT**: Mosquitto (localhost:1883)

## 📝 Next Steps

1. **Add API Keys**: Edit \`.env\` file with your Twilio/Firebase keys
2. **Test ESP32**: Update ESP32 code with IP: $IP_ADDRESS
3. **Monitor Dashboard**: Open dashboard.html to see real-time data
4. **Check Logs**: Monitor backend console for device connections

## 🆘 Troubleshooting

### ESP32 Can't Connect?
Try these IPs in your ESP32 code:
- $IP_ADDRESS (detected)
- 127.0.0.1 (localhost)
- host.docker.internal (Docker Desktop)

### Backend Won't Start?
\`\`\`bash
# Check services
docker-compose ps

# Restart services  
docker-compose restart

# Check logs
docker-compose logs
\`\`\`

## 🏷️ Happy Monitoring!

Your Smart Tourist Safety System is ready to protect tourists!
EOF

    print_status "Setup summary created: SETUP_COMPLETE.md"
}

# Main setup function
main() {
    echo -e "${BLUE}Starting Smart Tourist Safety Backend Setup...${NC}\n"
    
    check_os
    check_dependencies
    get_ip_address
    create_project_structure
    create_package_json
    create_env_config
    create_basic_files
    create_dockerfile
    create_test_files
    install_dependencies
    start_docker_services
    create_setup_summary
    
    echo -e "\n${GREEN}🎉 SETUP COMPLETE! 🎉${NC}"
    echo -e "${GREEN}===========================================${NC}"
    echo -e "${BLUE}📋 What's Next?${NC}"
    echo -e "   1. Start backend: ${YELLOW}npm run start:dev${NC}"
    echo -e "   2. Update ESP32 IP to: ${YELLOW}$IP_ADDRESS${NC}"
    echo -e "   3. Open dashboard.html in browser"
    echo -e "   4. Test MQTT: ${YELLOW}node test-mqtt.js${NC}"
    echo -e "\n${BLUE}📖 Read SETUP_COMPLETE.md for detailed instructions${NC}"
    echo -e "${GREEN}===========================================${NC}\n"
}

# Run main function
main "$@"