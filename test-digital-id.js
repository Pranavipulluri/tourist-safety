const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Mock tourist data
const mockTourist = {
  touristId: 'TOURIST_001',
  touristWallet: '0x742d35Cc6634C0532925a3b8D4020Cc654D1A6eb',
  personalData: {
    name: 'John Smith',
    nationality: 'United States',
    passport: 'US123456789',
    nationalId: 'US-001-234-567',
    phoneNumber: '+1-555-0123'
  },
  bookingData: {
    hotelName: 'Grand Palace Hotel',
    checkInDate: '2025-09-12',
    checkOutDate: '2025-09-20'
  },
  emergencyContacts: {
    primary: '+1-555-0124',
    secondary: '+1-555-0125'
  },
  validityDays: 30,
  initialConsent: {
    POLICE_ACCESS: true,
    HOTEL_ACCESS: true,
    FAMILY_ACCESS: true,
    TOURISM_DEPT_ACCESS: true
  }
};

async function testDigitalTouristID() {
  console.log('🧪 Testing Digital Tourist ID System...\n');

  try {
    // Test 1: Check server health
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server Status:', healthResponse.data.status);
    console.log('📊 Memory Usage:', healthResponse.data.memory.heapUsed / 1024 / 1024, 'MB\n');

    // Test 2: Check blockchain status
    console.log('2️⃣ Testing blockchain status...');
    const blockchainResponse = await axios.get(`${API_BASE}/digital-tourist-id/blockchain/status`);
    console.log('✅ Blockchain Response:', JSON.stringify(blockchainResponse.data, null, 2));
    console.log('');

    // Test 3: Issue a Digital Tourist ID
    console.log('3️⃣ Issuing Digital Tourist ID for mock user...');
    const issuePayload = {
      touristId: mockTourist.touristId,
      touristWallet: mockTourist.touristWallet,
      personalData: mockTourist.personalData,
      bookingData: mockTourist.bookingData,
      emergencyContacts: mockTourist.emergencyContacts,
      validityDays: mockTourist.validityDays,
      initialConsent: mockTourist.initialConsent
    };

    console.log('📤 Sending issue request with payload:');
    console.log(JSON.stringify(issuePayload, null, 2));

    const issueResponse = await axios.post(`${API_BASE}/digital-tourist-id/issue`, issuePayload);
    console.log('✅ Digital ID Issued Successfully!');
    console.log('🆔 Response:', JSON.stringify(issueResponse.data, null, 2));
    
    const blockchainId = issueResponse.data.blockchainId;
    console.log('');

    // Test 4: Access the Digital Tourist ID
    console.log('4️⃣ Accessing Digital Tourist ID...');
    const accessPayload = {
      blockchainId: blockchainId,
      accessReason: 'Routine verification check',
      requestedDataTypes: ['personalData', 'bookingData']
    };

    const accessResponse = await axios.post(`${API_BASE}/digital-tourist-id/access`, accessPayload);
    console.log('✅ Digital ID Accessed Successfully!');
    console.log('🔍 Access Response:', JSON.stringify(accessResponse.data, null, 2));
    console.log('');

    // Test 5: Get analytics summary
    console.log('5️⃣ Checking analytics summary...');
    const analyticsResponse = await axios.get(`${API_BASE}/digital-tourist-id/analytics/summary`);
    console.log('✅ Analytics Summary:');
    console.log('📈 Total IDs:', analyticsResponse.data.totalIds);
    console.log('📈 Active IDs:', analyticsResponse.data.activeIds);
    console.log('📈 Total Accesses:', analyticsResponse.data.accessStats.totalAccesses);
    console.log('');

    // Test 6: Get access logs
    console.log('6️⃣ Retrieving access logs...');
    const logsResponse = await axios.get(`${API_BASE}/digital-tourist-id/${blockchainId}/access-logs`);
    console.log('✅ Access Logs:', JSON.stringify(logsResponse.data, null, 2));
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('💼 Digital Tourist ID System is fully operational!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Headers:', error.response.headers);
    }
  }
}

// Run the test
testDigitalTouristID();