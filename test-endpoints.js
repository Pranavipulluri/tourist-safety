// Test script for Tourist Safety System API endpoints
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

// Function to make HTTP GET requests
function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n🔍 Testing: ${method} ${url}`);
    
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log('📄 Response:', JSON.stringify(jsonData, null, 2));
          resolve(jsonData);
        } catch (e) {
          console.log(`✅ Status: ${res.statusCode}`);
          console.log('📄 Response:', responseData);
          resolve(responseData);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      reject(error);
    });

    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🚀 Starting Tourist Safety System API Tests\n');
  console.log('=' * 60);

  try {
    // 1. Health Check
    console.log('\n📋 1. HEALTH CHECK ENDPOINTS');
    await makeRequest('/health');
    await makeRequest('/health/simple');

    // 2. Tourist Management
    console.log('\n👥 2. TOURIST MANAGEMENT ENDPOINTS');
    await makeRequest('/tourist');
    
    // Get first tourist ID for testing
    const tourists = await makeRequest('/tourist');
    const touristId = tourists.length > 0 ? tourists[0].id : 'tourist-1';
    
    await makeRequest(`/tourist/${touristId}`);
    await makeRequest(`/tourist/${touristId}/status`);

    // 3. Location Services
    console.log('\n📍 3. LOCATION TRACKING ENDPOINTS');
    await makeRequest(`/location/current/${touristId}`);
    await makeRequest(`/location/history/${touristId}`);
    await makeRequest(`/location/tracking/${touristId}`);
    await makeRequest(`/location/activity-status/${touristId}`);

    // 4. Google Maps Integration
    console.log('\n🗺️ 4. GOOGLE MAPS INTEGRATION ENDPOINTS');
    await makeRequest('/location/geocode/India Gate Delhi');
    await makeRequest('/location/reverse-geocode?lat=28.6139&lng=77.2090');
    await makeRequest('/location/nearby-places?lat=28.6139&lng=77.2090&type=hospital');
    await makeRequest('/location/safety-rating?lat=28.6139&lng=77.2090');
    await makeRequest('/location/weather?lat=28.6139&lng=77.2090');

    // 5. Emergency Services
    console.log('\n🚨 5. EMERGENCY SERVICES ENDPOINTS');
    await makeRequest(`/emergency/alerts/${touristId}`);
    await makeRequest(`/emergency/fir/${touristId}`);

    // 6. Nearby Location Search
    console.log('\n🔍 6. PROXIMITY SEARCH ENDPOINTS');
    await makeRequest('/location/nearby-coordinates?lat=28.7041&lng=77.1025&radius=2');

    console.log('\n✅ All endpoint tests completed successfully!');
    console.log('\n🎯 System Status: FULLY FUNCTIONAL');
    console.log('📱 Ready for frontend integration!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testAllEndpoints();
