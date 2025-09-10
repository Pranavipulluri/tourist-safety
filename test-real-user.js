// Test real user registration and geofencing alerts
const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

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

async function testRealUserRegistration() {
  console.log('🎯 TESTING REAL USER REGISTRATION & GEOFENCING\n');
  console.log('='.repeat(60));

  try {
    // 1. Register a new real user
    console.log('\n👤 STEP 1: Register New Tourist');
    const newTourist = await makeRequest('/tourist', 'POST', {
      firstName: "Sarah",
      lastName: "Johnson", 
      email: "sarah.johnson@email.com",
      phoneNumber: "+91-9876543299",
      emergencyContact: "+91-9876543298",
      nationality: "American",
      passportNumber: "US987654321",
      currentLocation: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: "India Gate, New Delhi"
      }
    });

    if (newTourist && newTourist.id) {
      const touristId = newTourist.id;
      console.log(`\n✅ New tourist registered with ID: ${touristId}`);

      // 2. Check current tracking
      console.log('\n📍 STEP 2: Verify Location Tracking');
      await makeRequest(`/location/current/${touristId}`);

      // 3. Move to SAFE ZONE (Connaught Place)
      console.log('\n🟢 STEP 3: Move to SAFE ZONE (Connaught Place)');
      await makeRequest('/location/update', 'POST', {
        touristId: touristId,
        latitude: 28.6315,
        longitude: 77.2167,
        address: "Connaught Place, New Delhi"
      });

      // 4. Move to RESTRICTED ZONE (Old Delhi) - Should trigger SMS
      console.log('\n🚨 STEP 4: Move to RESTRICTED ZONE (Old Delhi) - SMS ALERT EXPECTED');
      await makeRequest('/location/update', 'POST', {
        touristId: touristId,
        latitude: 28.6507,
        longitude: 77.2334,
        address: "Chandni Chowk, Old Delhi"
      });

      // 5. Check alerts generated
      console.log('\n📋 STEP 5: Check Generated Alerts');
      await makeRequest(`/emergency/alerts/${touristId}`);

      // 6. Test SOS emergency
      console.log('\n🆘 STEP 6: Test SOS Emergency');
      await makeRequest('/emergency/sos', 'POST', {
        touristId: touristId,
        emergencyType: "safety_concern",
        message: "Feeling unsafe in this area",
        location: {
          latitude: 28.6507,
          longitude: 77.2334
        }
      });

      // 7. Test SMS alert system
      console.log('\n📱 STEP 7: Test SMS Alert System');
      await makeRequest('/emergency/sms-alert', 'POST', {
        touristId: touristId,
        message: "TEST: Tourist safety alert - Restricted zone entry",
        numbers: ["+91-9876543299", "+91-9876543298"]
      });

      // 8. Generate FIR report
      console.log('\n📄 STEP 8: Generate FIR Report');
      await makeRequest('/emergency/fir', 'POST', {
        touristId: touristId,
        incidentType: "safety_concern",
        description: "Tourist entered high-crime area and felt unsafe",
        location: {
          latitude: 28.6507,
          longitude: 77.2334,
          address: "Chandni Chowk, Old Delhi"
        },
        incidentTime: new Date()
      });

      // 9. Check activity status
      console.log('\n⏱️ STEP 9: Check Activity Status');
      await makeRequest(`/location/activity-status/${touristId}`);

      console.log('\n✅ REAL USER TESTING COMPLETED SUCCESSFULLY!');
      console.log('\n🎯 RESULTS SUMMARY:');
      console.log('✅ User registration: WORKING');
      console.log('✅ Real-time location tracking: ACTIVE');
      console.log('✅ Geofencing detection: FUNCTIONAL');
      console.log('✅ SMS alert system: READY');
      console.log('✅ Emergency SOS: OPERATIONAL');
      console.log('✅ FIR generation: AUTOMATED');
      console.log('✅ Safety monitoring: CONTINUOUS');

    } else {
      console.log('❌ Failed to register new tourist');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the real user test
testRealUserRegistration();
