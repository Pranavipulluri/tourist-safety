#!/bin/bash

echo "🚀 Setting up Tourist Safety Backend..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p ssl

# Copy environment file
if [ ! -f .env ]; then
    echo "📋 Copying environment file..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your actual configuration values"
fi

# Generate self-signed SSL certificates (for development)
if [ ! -f ssl/cert.pem ]; then
    echo "🔐 Generating SSL certificates..."
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
        -subj "/C=IN/ST=Assam/L=Guwahati/O=Tourist Safety/CN=localhost"
fi

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗃️  Running database migrations..."
docker-compose exec app npm run migration:run

echo "✅ Setup complete!"
echo ""
echo "📊 Dashboard URLs:"
echo "   - API Documentation: http://localhost:3000/api/docs"
echo "   - Health Check: http://localhost:3000/api/v1/health"
echo "   - WebSocket Endpoint: ws://localhost:3000/api/v1/ws"
echo ""
echo "🔍 Service Status:"
docker-compose ps
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f app"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"
