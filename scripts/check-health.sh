echo "🏥 Tourist Safety Backend Health Check"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

echo "1. Checking Docker containers..."
echo "================================"
docker-compose ps

echo -e "\n2. Checking Backend API..."
echo "=========================="

# Check main health endpoint
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health)

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Backend API: Running (HTTP $HTTP_STATUS)${NC}"
    
    # Get detailed health info
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/v1/health)
    echo "   Health Details: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Backend API: Not responding (HTTP $HTTP_STATUS)${NC}"
fi

echo -e "\n3. Checking Database Connection..."
echo "=================================="

# Check PostgreSQL
DB_STATUS=$(docker-compose exec -T postgres pg_isready -U postgres 2>/dev/null)
if [[ $DB_STATUS == *"accepting connections"* ]]; then
    echo -e "${GREEN}✅ PostgreSQL: Connected${NC}"
else
    echo -e "${RED}❌ PostgreSQL: Connection failed${NC}"
fi

echo -e "\n4. Checking Redis Connection..."
echo "==============================="

# Check Redis
REDIS_STATUS=$(docker-compose exec -T redis redis-cli ping 2>/dev/null)
if [ "$REDIS_STATUS" = "PONG" ]; then
    echo -e "${GREEN}✅ Redis: Connected${NC}"
else
    echo -e "${RED}❌ Redis: Connection failed${NC}"
fi

echo -e "\n5. Checking MQTT Broker..."
echo "=========================="

# Check MQTT (if mosquitto_pub is available)
if command -v mosquitto_pub &> /dev/null; then
    if timeout 5 mosquitto_pub -h localhost -p 1883 -t "test/health" -m "ping" 2>/dev/null; then
        echo -e "${GREEN}✅ MQTT Broker: Connected${NC}"
    else
        echo -e "${RED}❌ MQTT Broker: Connection failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  MQTT Broker: Cannot test (mosquitto_pub not installed)${NC}"
fi

echo -e "\n6. Checking API Endpoints..."
echo "============================"

# Test key endpoints
ENDPOINTS=(
    "http://localhost:3000/api/docs"
    "http://localhost:3000/api/v1/auth/login"
    "http://localhost:3000/api/v1/dashboard/overview"
)

for endpoint in "${ENDPOINTS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
        echo -e "${GREEN}✅ $endpoint: Accessible (HTTP $STATUS)${NC}"
    else
        echo -e "${RED}❌ $endpoint: Not accessible (HTTP $STATUS)${NC}"
    fi
done

echo -e "\n7. Checking WebSocket Connection..."
echo "==================================="

# Test WebSocket (basic connection test)
if command -v wscat &> /dev/null; then
    if timeout 5 wscat -c ws://localhost:3000/api/v1/ws 2>/dev/null; then
        echo -e "${GREEN}✅ WebSocket: Connection successful${NC}"
    else
        echo -e "${RED}❌ WebSocket: Connection failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  WebSocket: Cannot test (wscat not installed)${NC}"
fi

echo -e "\n8. System Resources..."
echo "======================"

# Check disk space
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "${GREEN}✅ Disk Usage: ${DISK_USAGE}%${NC}"
else
    echo -e "${YELLOW}⚠️  Disk Usage: ${DISK_USAGE}% (High)${NC}"
fi

# Check memory usage
if command -v free &> /dev/null; then
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    echo -e "${GREEN}✅ Memory Usage: ${MEMORY_USAGE}%${NC}"
fi

echo -e "\n📊 Quick Access URLs:"
echo "====================="
echo "🌐 API Documentation: http://localhost:3000/api/docs"
echo "❤️  Health Check: http://localhost:3000/api/v1/health"
echo "🔌 WebSocket Test: ws://localhost:3000/api/v1/ws"

echo -e "\n🔧 Troubleshooting Commands:"
echo "============================"
echo "📄 View logs: docker-compose logs -f app"
echo "🔄 Restart services: docker-compose restart"
echo "🛑 Stop services: docker-compose down"
echo "🚀 Start services: docker-compose up -d"

echo -e "\n✅ Health check completed!"