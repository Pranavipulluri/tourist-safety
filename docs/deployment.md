
# docs/deployment.md
# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- SSL Certificate (production)
- Domain name (production)
- Email service credentials
- SMS service credentials (Twilio)
- Push notification credentials (Firebase)

## Development Deployment

### 1. Quick Start

```bash
# Clone repository
git clone 
cd tourist-safety-backend

# Make scripts executable
chmod +x scripts/*.sh

# Run development setup
./scripts/dev-setup.sh

# Start development server
npm run start:dev
```

### 2. Manual Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start services
docker-compose up -d postgres redis mosquitto

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

## Production Deployment

### 1. Server Requirements

**Minimum Specifications:**
- 2 CPU cores
- 4GB RAM
- 50GB SSD storage
- Ubuntu 20.04+ or CentOS 8+

**Recommended Specifications:**
- 4 CPU cores
- 8GB RAM
- 100GB SSD storage
- Load balancer ready

### 2. Production Setup

```bash
# Create production user
sudo adduser tourist-safety
sudo usermod -aG docker tourist-safety

# Clone repository
git clone 
cd tourist-safety-backend

# Set production environment
cp .env.example .env
# Edit .env with production values

# Generate SSL certificates (Let's Encrypt)
./scripts/generate-ssl.sh your-domain.com

# Run production setup
sudo ./scripts/setup.sh

# Start production services
docker-compose -f docker-compose.yml up -d
```

### 3. SSL Configuration

#### Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
```

#### Self-Signed (Development/Testing)
```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/CN=localhost"
```

### 4. Environment Variables

Update `.env` with production values:

```bash
# Production Database
DATABASE_URL=postgresql://username:password@localhost:5432/tourist_safety_prod

# JWT Secrets (generate strong keys)
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here

# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=AC1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 5. Database Migration

```bash
# Run migrations in production
npm run migration:run

# Seed initial data (optional)
npm run seed:run
```

### 6. Process Management

#### Using PM2 (Node.js Process Manager)
```bash
# Install PM2
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tourist-safety-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Monitoring & Health Checks

#### Setup Health Monitoring
```bash
# Create health check script
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
API_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -w "%{http_code}" "$API_URL" -o /dev/null)

if [ "$RESPONSE" -eq 200 ]; then
    echo "API is healthy"
    exit 0
else
    echo "API health check failed with status: $RESPONSE"
    exit 1
fi
EOF

chmod +x scripts/health-check.sh

# Add to crontab for monitoring
echo "*/5 * * * * /path/to/scripts/health-check.sh" | crontab -
```

### 8. Backup Strategy

#### Database Backup
```bash
# Create backup script
cat > scripts/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_tourist_safety_${DATE}.sql"

pg_dump -h localhost -U postgres -d tourist_safety_db > "/backup/${BACKUP_FILE}"
gzip "/backup/${BACKUP_FILE}"

# Keep only last 7 days of backups
find /backup -name "backup_tourist_safety_*.sql.gz" -mtime +7 -delete
EOF

chmod +x scripts/backup-db.sh

# Schedule daily backup
echo "0 2 * * * /path/to/scripts/backup-db.sh" | crontab -
```

### 9. Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/tourist-safety
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/v1/ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 10. Maintenance

#### Log Rotation
```bash
# Create logrotate config
sudo cat > /etc/logrotate.d/tourist-safety << 'EOF'
/home/tourist-safety/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
```

#### System Updates
```bash
# Create update script
cat > scripts/update-system.sh << 'EOF'
#!/bin/bash
echo "Updating Tourist Safety System..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Run migrations
npm run migration:run

# Restart services
pm2 restart tourist-safety-api

echo "Update completed successfully!"
EOF

chmod +x scripts/update-system.sh
```