const mqtt = require('mqtt');
const fs = require('fs');

class TouristBandSimulator {
  constructor(deviceId, touristId) {
    this.deviceId = deviceId;
    this.touristId = touristId;
    this.battery = 100;
    this.isConnected = false;
    
    // Simulated route (Kaziranga National Park area)
    this.route = [
      { lat: 26.5775, lng: 93.1742 }, // Kaziranga main gate
      { lat: 26.5820, lng: 93.1801 }, // Kohora
      { lat: 26.5891, lng: 93.1923 }, // Mihimukh
      { lat: 26.5934, lng: 93.2012 }, // Bagori range
      { lat: 26.5756, lng: 93.2156 }, // Agoratoli range
    ];
    this.currentRouteIndex = 0;
    this.position = this.route[0];
    
    this.connect();
  }

  connect() {
    console.log(`🔌 Connecting device ${this.deviceId}...`);
    this.client = mqtt.connect('mqtt://localhost:1883', {
      clientId: `tourist_band_${this.deviceId}`,
      clean: true,
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      console.log(`✅ Device ${this.deviceId} connected to MQTT broker`);
      this.isConnected = true;
      
      // Subscribe to commands
      this.client.subscribe(`iot/device/${this.deviceId}/command`);
      
      // Start sending telemetry
      this.startTelemetry();
    });

    this.client.on('message', (topic, message) => {
      this.handleCommand(JSON.parse(message.toString()));
    });

    this.client.on('error', (error) => {
      console.error(`❌ MQTT Error for ${this.deviceId}:`, error);
    });
  }

  startTelemetry() {
    // Send telemetry every 30 seconds
    this.telemetryInterval = setInterval(() => {
      this.sendTelemetry();
      this.updatePosition();
      this.updateBattery();
    }, 30000);

    // Send initial telemetry
    this.sendTelemetry();
  }

  sendTelemetry() {
    const telemetry = {
      ts: new Date().toISOString(),
      lat: this.position.lat + (Math.random() - 0.5) * 0.001, // Add small random variation
      lng: this.position.lng + (Math.random() - 0.5) * 0.001,
      battery: this.battery,
      hr: 65 + Math.floor(Math.random() * 30), // Heart rate 65-95
      accel: {
        x: (Math.random() - 0.5) * 0.1,
        y: (Math.random() - 0.5) * 0.1,
        z: 0.98 + (Math.random() - 0.5) * 0.04,
      },
      speed: Math.random() * 5, // 0-5 km/h walking speed
      fix: 'gps',
      deviceStatus: 'ok'
    };

    const topic = `iot/tourist/${this.deviceId}/telemetry`;
    this.client.publish(topic, JSON.stringify(telemetry));
    
    console.log(`📡 ${this.deviceId}: Sent telemetry - Lat: ${telemetry.lat.toFixed(4)}, Lng: ${telemetry.lng.toFixed(4)}, Battery: ${this.battery}%`);
  }

  updatePosition() {
    // Move along route every few minutes
    if (Math.random() < 0.3) { // 30% chance to move to next point
      this.currentRouteIndex = (this.currentRouteIndex + 1) % this.route.length;
      this.position = this.route[this.currentRouteIndex];
      console.log(`🚶 ${this.deviceId}: Moved to ${this.position.lat}, ${this.position.lng}`);
    }
  }

  updateBattery() {
    // Decrease battery gradually
    this.battery = Math.max(0, this.battery - Math.random() * 2);
    
    if (this.battery < 20 && Math.random() < 0.1) {
      this.sendLowBatteryAlert();
    }
  }

  // Simulate SOS button press
  triggerSOS() {
    const sosEvent = {
      ts: new Date().toISOString(),
      type: 'SOS',
      lat: this.position.lat,
      lng: this.position.lng,
      battery: this.battery,
      msg: 'Panic button pressed - Tourist needs immediate help!'
    };

    const topic = `iot/tourist/${this.deviceId}/event`;
    this.client.publish(topic, JSON.stringify(sosEvent));
    
    console.log(`🚨 ${this.deviceId}: SOS TRIGGERED!`);
  }

  // Simulate fall detection
  triggerFallDetection() {
    const fallEvent = {
      ts: new Date().toISOString(),
      type: 'FALL_DETECTED',
      lat: this.position.lat,
      lng: this.position.lng,
      battery: this.battery,
      msg: 'Fall detected by accelerometer',
      fallData: {
        impact: 15.2,
        orientation: 'flat',
        duration: 3000
      }
    };

    const topic = `iot/tourist/${this.deviceId}/event`;
    this.client.publish(topic, JSON.stringify(fallEvent));
    
    console.log(`🤕 ${this.deviceId}: FALL DETECTED!`);
  }

  sendLowBatteryAlert() {
    const batteryEvent = {
      ts: new Date().toISOString(),
      type: 'BATTERY_LOW',
      lat: this.position.lat,
      lng: this.position.lng,
      battery: this.battery,
      msg: `Device battery critically low: ${this.battery}%`
    };

    const topic = `iot/tourist/${this.deviceId}/event`;
    this.client.publish(topic, JSON.stringify(batteryEvent));
    
    console.log(`🔋 ${this.deviceId}: LOW BATTERY ALERT!`);
  }

  handleCommand(command) {
    console.log(`📨 ${this.deviceId}: Received command:`, command.command);
    
    switch (command.command) {
      case 'locate':
        this.sendTelemetry();
        break;
      case 'sos_test':
        this.triggerSOS();
        break;
      case 'update_config':
        console.log(`⚙️ ${this.deviceId}: Configuration updated`);
        break;
      case 'pair':
        console.log(`🔗 ${this.deviceId}: Paired with tourist ${command.touristId}`);
        break;
      case 'unpair':
        console.log(`🔓 ${this.deviceId}: Unpaired from tourist`);
        break;
    }
  }

  disconnect() {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }
    if (this.client) {
      this.client.end();
    }
    console.log(`🔌 ${this.deviceId}: Disconnected`);
  }
}

// Create multiple simulated devices
const devices = [];

// Simulate 5 tourists with different devices
const tourists = [
  { deviceId: 'TSB001234567', touristId: 'tourist-001', name: 'John Doe' },
  { deviceId: 'TSB001234568', touristId: 'tourist-002', name: 'Jane Smith' },
  { deviceId: 'TSB001234569', touristId: 'tourist-003', name: 'Mike Johnson' },
  { deviceId: 'TSB001234570', touristId: 'tourist-004', name: 'Sarah Wilson' },
  { deviceId: 'TSB001234571', touristId: 'tourist-005', name: 'David Brown' },
];

console.log('🚀 Starting IoT Device Simulator...');
console.log('📍 Simulating tourist movement in Kaziranga National Park area');

tourists.forEach((tourist, index) => {
  setTimeout(() => {
    const device = new TouristBandSimulator(tourist.deviceId, tourist.touristId);
    devices.push(device);
    console.log(`👤 Started device for ${tourist.name} (${tourist.deviceId})`);
  }, index * 2000); // Stagger device connections
});

// Simulate random events
setInterval(() => {
  if (devices.length > 0 && Math.random() < 0.1) { // 10% chance every minute
    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    
    const eventType = Math.random();
    if (eventType < 0.05) { // 5% chance for SOS
      randomDevice.triggerSOS();
    } else if (eventType < 0.08) { // 3% chance for fall
      randomDevice.triggerFallDetection();
    }
  }
}, 60000); // Check every minute

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down simulators...');
  devices.forEach(device => device.disconnect());
  process.exit(0);
});

console.log('\n📋 Simulator Commands:');
console.log('  - Devices will send telemetry every 30 seconds');
console.log('  - Random SOS/Fall events will occur occasionally');
console.log('  - Press Ctrl+C to stop simulation');

// Interactive commands
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n💡 Type commands:');
console.log('  "sos <device_number>" - Trigger SOS (1-5)');
console.log('  "fall <device_number>" - Trigger fall detection (1-5)');
console.log('  "status" - Show all devices');

rl.on('line', (input) => {
  const [command, deviceNum] = input.trim().split(' ');
  
  switch (command) {
    case 'sos':
      const sosDevice = devices[parseInt(deviceNum) - 1];
      if (sosDevice) {
        sosDevice.triggerSOS();
      } else {
        console.log('❌ Invalid device number');
      }
      break;
      
    case 'fall':
      const fallDevice = devices[parseInt(deviceNum) - 1];
      if (fallDevice) {
        fallDevice.triggerFallDetection();
      } else {
        console.log('❌ Invalid device number');
      }
      break;
      
    case 'status':
      console.log('\n📊 Device Status:');
      devices.forEach((device, index) => {
        console.log(`  ${index + 1}. ${device.deviceId} - Battery: ${device.battery}% - Position: ${device.position.lat}, ${device.position.lng}`);
      });
      break;
      
    default:
      console.log('❌ Unknown command');
  }
  
  console.log('> ');
});