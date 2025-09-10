
# docs/iot-integration.md
# IoT Device Integration Guide

## Overview

The Tourist Safety System supports IoT wearable devices through MQTT communication protocol. This guide covers device integration, communication protocols, and troubleshooting.

## Supported Device Types

### 1. Safety Bands
- GPS tracking
- Emergency SOS button
- Health monitoring (heart rate, activity)
- Battery monitoring
- Two-way communication

### 2. Smart Watches
- Enhanced GPS accuracy
- Fall detection
- Geofencing alerts
- Mobile app integration

### 3. Panic Buttons
- Simple SOS devices
- Long battery life
- Waterproof design
- Emergency broadcast

## MQTT Communication

### Connection Parameters
- **Broker URL**: `mqtt://your-domain.com:1883`
- **WebSocket**: `ws://your-domain.com:9001` (for web apps)
- **QoS Level**: 1 (at least once delivery)
- **Keep Alive**: 60 seconds

### Topic Structure
```
iot/
├── tourist/
│   ├── {deviceId}/
│   │   ├── telemetry          # Device → Server (location, health data)
│   │   ├── event              # Device → Server (SOS, alerts)
│   │   └── status             # Device → Server (battery, connectivity)
│
└── device/
    └── {deviceId}/
        └── command            # Server → Device (control commands)
```

### Message Formats

#### Telemetry Data
```json
{
  "ts": "2024-03-15T10:30:00Z",
  "lat": 26.5775,
  "lng": 93.1742,
  "battery": 78,
  "hr": 72,
  "accel": {"x": 0.01, "y": 0.02, "z": 0.98},
  "speed": 1.2,
  "fix": "gps",
  "deviceStatus": "ok"
}
```

#### Emergency Event
```json
{
  "ts": "2024-03-15T10:32:10Z",
  "type": "SOS",
  "lat": 26.5775,
  "lng": 93.1742,
  "battery": 55,
  "msg": "Emergency button pressed"
}
```

#### Device Commands
```json
{
  "command": "locate",
  "timestamp": "2024-03-15T10:35:00Z",
  "parameters": {
    "interval": 30
  }
}
```

## ESP32 Integration Example

### Complete Arduino Code
```cpp
#include 
#include 
#include 
#include 

// Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "YOUR_SERVER_IP";
const int mqtt_port = 1883;
const char* device_id = "TSB001234567";

// Hardware setup
const int SOS_BUTTON_PIN = 2;
const int STATUS_LED_PIN = 4;
WiFiClient espClient;
PubSubClient client(espClient);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Device state
float battery_percentage = 100.0;
unsigned long last_telemetry = 0;
const unsigned long telemetry_interval = 30000; // 30 seconds

void setup() {
  Serial.begin(115200);
  
  // Initialize hardware
  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED_PIN, OUTPUT);
  
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Tourist Band");
  
  // Connect to WiFi and MQTT
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  Serial.println("Tourist Safety Band Ready!");
}

void setup_wifi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  String command = doc["command"];
  
  if (command == "locate") {
    sendTelemetry();
  } else if (command == "sos_test") {
    triggerSOS();
  }
}

void sendTelemetry() {
  DynamicJsonDocument doc(1024);
  
  doc["ts"] = "2024-03-15T" + String(millis()/1000) + "Z";
  doc["lat"] = 26.5775 + random(-50, 50) / 100000.0;
  doc["lng"] = 93.1742 + random(-50, 50) / 100000.0;
  doc["battery"] = battery_percentage;
  doc["hr"] = random(60, 90);
  doc["speed"] = random(0, 50) / 10.0;
  doc["fix"] = "gps";
  doc["deviceStatus"] = "ok";
  
  String telemetry;
  serializeJson(doc, telemetry);
  
  String topic = "iot/tourist/" + String(device_id) + "/telemetry";
  client.publish(topic.c_str(), telemetry.c_str());
  
  Serial.println("Telemetry sent: " + telemetry);
}

void triggerSOS() {
  DynamicJsonDocument doc(1024);
  
  doc["ts"] = "2024-03-15T" + String(millis()/1000) + "Z";
  doc["type"] = "SOS";
  doc["lat"] = 26.5775;
  doc["lng"] = 93.1742;
  doc["battery"] = battery_percentage;
  doc["msg"] = "EMERGENCY: SOS button pressed!";
  
  String event;
  serializeJson(doc, event);
  
  String topic = "iot/tourist/" + String(device_id) + "/event";
  client.publish(topic.c_str(), event.c_str());
  
  Serial.println("🚨 SOS TRIGGERED!");
  
  // Visual feedback
  for (int i = 0; i < 10; i++) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(100);
    digitalWrite(STATUS_LED_PIN, LOW);
    delay(100);
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Check SOS button
  if (digitalRead(SOS_BUTTON_PIN) == LOW) {
    triggerSOS();
    delay(1000);
  }
  
  // Send telemetry periodically
  if (millis() - last_telemetry > telemetry_interval) {
    sendTelemetry();
    last_telemetry = millis();
  }
  
  delay(1000);
}
```

## Device Pairing Process

### 1. Device Registration
```bash
curl -X POST http://your-domain.com/api/v1/iot/devices \
  -H "Authorization: Bearer " \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "TSB001234567",
    "type": "safety_band",
    "firmwareVersion": "1.0.0"
  }'
```

### 2. Pair with Tourist
```bash
curl -X POST http://your-domain.com/api/v1/iot/devices/TSB001234567/pair/tourist-uuid \
  -H "Authorization: Bearer "
```

### 3. Device Configuration
```bash
curl -X POST http://your-domain.com/api/v1/iot/devices/TSB001234567/command \
  -H "Authorization: Bearer " \
  -H "Content-Type: application/json" \
  -d '{
    "command": "configure",
    "parameters": {
      "telemetryInterval": 60,
      "gpsAccuracy": "high",
      "sosTimeout": 5
    }
  }'
```

## Troubleshooting

### Common Issues

#### Connection Problems
1. **Can't connect to MQTT**
   - Check firewall settings (port 1883)
   - Verify broker is running: `docker-compose ps`
   - Test with MQTT client: `mosquitto_sub -h localhost -t test`

2. **Frequent disconnections**
   - Increase keep-alive timeout
   - Check network stability
   - Implement reconnection logic

#### Message Issues
1. **Messages not received**
   - Verify topic subscription
   - Check QoS settings
   - Monitor broker logs

2. **Invalid JSON**
   - Validate message format
   - Check character encoding
   - Handle special characters

### Debugging Tools

#### MQTT Client Testing
```bash
# Subscribe to all device messages
mosquitto_sub -h localhost -t "iot/tourist/+/+"

# Send test command
mosquitto_pub -h localhost -t "iot/device/TSB001234567/command" \
  -m '{"command":"locate","timestamp":"2024-03-15T10:30:00Z"}'
```

#### Backend Logs
```bash
# View IoT service logs
docker-compose logs -f backend | grep "IoTService"

# Monitor MQTT broker
docker-compose logs -f mosquitto
```

### Performance Optimization

#### Message Frequency
- **Telemetry**: Every 30-60 seconds (normal), Every 5-10 seconds (emergency)
- **Heartbeat**: Every 5 minutes
- **SOS**: Immediate + repeat every 30 seconds until acknowledged

#### Battery Conservation
- Adjust GPS accuracy based on movement
- Use low-power mode when stationary
- Implement smart wake-up triggers
- Cache messages during connectivity loss