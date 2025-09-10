
# scripts/dev-setup.sh
#!/bin/bash

echo "🔧 Setting up development environment..."

# Install Node.js dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file from example
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📋 Created .env file from example"
fi

# Start development services (database, redis, mqtt)
echo "🏗️  Starting development services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database..."
sleep 10

# Run database migrations
echo "🗃️  Running database migrations..."
npm run migration:run

echo "✅ Development setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run start:dev"
echo ""
echo "📊 Available endpoints:"
echo "   - API Documentation: http://localhost:3000/api/docs"
echo "   - Health Check: http://localhost:3000/api/v1/health"
