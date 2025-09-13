-- Tourist Safety Platform - Supabase Database Schema
-- Created for SIH-25 Project

-- Enable Row Level Security (RLS) for all tables
-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tourists table
CREATE TABLE IF NOT EXISTS tourists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    emergency_contact VARCHAR(20),
    nationality VARCHAR(50),
    passport_number VARCHAR(50),
    digital_id VARCHAR(100) UNIQUE,
    role VARCHAR(20) DEFAULT 'TOURIST' CHECK (role IN ('TOURIST', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table for tracking tourist locations
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2) DEFAULT 0,
    altitude DECIMAL(10, 2),
    speed DECIMAL(10, 2),
    heading DECIMAL(10, 2),
    address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table for emergency alerts and SOS
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('SOS', 'PANIC', 'EMERGENCY', 'GEOFENCE', 'SAFETY_CHECK')),
    severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
    message TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    acknowledged_by VARCHAR(255),
    resolved_by VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Geofences table for safe zones and restricted areas
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('SAFE_ZONE', 'DANGER_ZONE', 'RESTRICTED_AREA')),
    coordinates JSONB NOT NULL, -- Store polygon/circle coordinates
    radius DECIMAL(10, 2), -- For circular geofences
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES tourists(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- IoT Devices table for smartwatches, panic buttons, etc.
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL UNIQUE,
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('SMARTWATCH', 'PANIC_BUTTON', 'GPS_TRACKER')),
    device_name VARCHAR(255) NOT NULL,
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    last_seen TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    relationship VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tourist Feedback table for sentiment analysis
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category VARCHAR(100),
    sentiment_score DECIMAL(3, 2), -- -1 to 1 range
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Logs table for tracking notifications
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES tourists(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED')),
    provider VARCHAR(50),
    message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- FIR (First Information Report) table
CREATE TABLE IF NOT EXISTS fir_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
    fir_number VARCHAR(100) UNIQUE,
    incident_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    incident_location TEXT NOT NULL,
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    police_station VARCHAR(255),
    officer_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'FILED' CHECK (status IN ('FILED', 'UNDER_INVESTIGATION', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geofence Violations table
CREATE TABLE IF NOT EXISTS geofence_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
    geofence_id UUID NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    violation_type VARCHAR(20) NOT NULL CHECK (violation_type IN ('ENTRY', 'EXIT')),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tourists_email ON tourists(email);
CREATE INDEX IF NOT EXISTS idx_tourists_role ON tourists(role);
CREATE INDEX IF NOT EXISTS idx_locations_tourist_id ON locations(tourist_id);
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_tourist_id ON alerts(tourist_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_devices_tourist_id ON devices(tourist_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_tourist_id ON emergency_contacts(tourist_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tourist_id ON feedback(tourist_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_tourist_id ON sms_logs(tourist_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_fir_reports_tourist_id ON fir_reports(tourist_id);
CREATE INDEX IF NOT EXISTS idx_geofence_violations_tourist_id ON geofence_violations(tourist_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to tables that have updated_at column
CREATE TRIGGER update_tourists_updated_at BEFORE UPDATE ON tourists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON geofences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fir_reports_updated_at BEFORE UPDATE ON fir_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO tourists (id, email, first_name, last_name, phone_number, emergency_contact, nationality, passport_number, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@tourist-safety.com', 'Admin', 'User', '+91-9876543210', '+91-9876543211', 'Indian', 'A1234567', 'ADMIN'),
('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'John', 'Doe', '+1-555-0123', '+1-555-0124', 'American', 'B7654321', 'TOURIST'),
('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'Jane', 'Smith', '+44-20-7946-0958', '+44-20-7946-0959', 'British', 'C9876543', 'TOURIST')
ON CONFLICT (id) DO NOTHING;

-- Insert sample alerts for testing heatmap
INSERT INTO alerts (tourist_id, type, severity, status, message, latitude, longitude, address) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'SOS', 'CRITICAL', 'ACTIVE', 'Emergency SOS Alert - Immediate assistance required!', 28.6139, 77.2090, 'New Delhi, India'),
('550e8400-e29b-41d4-a716-446655440001', 'PANIC', 'HIGH', 'ACKNOWLEDGED', 'Panic Button Pressed - Help needed!', 28.6129, 77.2100, 'Connaught Place, New Delhi'),
('550e8400-e29b-41d4-a716-446655440002', 'SAFETY_CHECK', 'MEDIUM', 'RESOLVED', 'Safety check notification', 28.6149, 77.2080, 'India Gate, New Delhi'),
('550e8400-e29b-41d4-a716-446655440002', 'GEOFENCE', 'LOW', 'ACTIVE', 'Entered restricted area', 28.6159, 77.2070, 'Red Fort, New Delhi')
ON CONFLICT DO NOTHING;

-- Insert sample locations for testing
INSERT INTO locations (tourist_id, latitude, longitude, accuracy, address) VALUES
('550e8400-e29b-41d4-a716-446655440001', 28.6139, 77.2090, 10.5, 'New Delhi, India'),
('550e8400-e29b-41d4-a716-446655440001', 28.6129, 77.2100, 8.3, 'Connaught Place, New Delhi'),
('550e8400-e29b-41d4-a716-446655440002', 28.6149, 77.2080, 12.1, 'India Gate, New Delhi'),
('550e8400-e29b-41d4-a716-446655440002', 28.6159, 77.2070, 9.7, 'Red Fort, New Delhi')
ON CONFLICT DO NOTHING;

-- Insert sample geofences
INSERT INTO geofences (name, type, coordinates, radius, created_by) VALUES
('India Gate Safe Zone', 'SAFE_ZONE', '{"type": "circle", "center": {"lat": 28.6129, "lng": 77.2295}, "radius": 500}', 500, '550e8400-e29b-41d4-a716-446655440000'),
('Red Fort Restricted Area', 'RESTRICTED_AREA', '{"type": "polygon", "coordinates": [{"lat": 28.6562, "lng": 77.2410}, {"lat": 28.6572, "lng": 77.2420}, {"lat": 28.6552, "lng": 77.2430}, {"lat": 28.6542, "lng": 77.2420}]}', NULL, '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE tourists ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fir_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_violations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies for now - can be refined based on requirements)
-- Allow public read access to tourists (for admin dashboard)
CREATE POLICY "Allow public read access to tourists" ON tourists FOR SELECT USING (true);

-- Allow public read access to alerts (for admin dashboard)
CREATE POLICY "Allow public read access to alerts" ON alerts FOR SELECT USING (true);

-- Allow public read access to locations (for admin dashboard)
CREATE POLICY "Allow public read access to locations" ON locations FOR SELECT USING (true);

-- Allow public read access to geofences
CREATE POLICY "Allow public read access to geofences" ON geofences FOR SELECT USING (true);

-- Allow public read access to devices
CREATE POLICY "Allow public read access to devices" ON devices FOR SELECT USING (true);

-- Allow public read access to emergency contacts
CREATE POLICY "Allow public read access to emergency_contacts" ON emergency_contacts FOR SELECT USING (true);

-- Allow public read access to feedback
CREATE POLICY "Allow public read access to feedback" ON feedback FOR SELECT USING (true);

-- Allow public read access to SMS logs
CREATE POLICY "Allow public read access to sms_logs" ON sms_logs FOR SELECT USING (true);

-- Allow public read access to FIR reports
CREATE POLICY "Allow public read access to fir_reports" ON fir_reports FOR SELECT USING (true);

-- Allow public read access to geofence violations
CREATE POLICY "Allow public read access to geofence_violations" ON geofence_violations FOR SELECT USING (true);

-- Allow public insert/update access for testing (should be restricted in production)
CREATE POLICY "Allow public insert access to tourists" ON tourists FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to tourists" ON tourists FOR UPDATE USING (true);

CREATE POLICY "Allow public insert access to alerts" ON alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to alerts" ON alerts FOR UPDATE USING (true);

CREATE POLICY "Allow public insert access to locations" ON locations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access to devices" ON devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to devices" ON devices FOR UPDATE USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create views for easier querying
CREATE OR REPLACE VIEW active_tourists AS
SELECT t.*, l.latitude, l.longitude, l.timestamp as last_location_update
FROM tourists t
LEFT JOIN LATERAL (
    SELECT latitude, longitude, timestamp
    FROM locations
    WHERE tourist_id = t.id
    ORDER BY timestamp DESC
    LIMIT 1
) l ON true
WHERE t.role = 'TOURIST';

CREATE OR REPLACE VIEW alert_summary AS
SELECT 
    type,
    severity,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - created_at))) as avg_response_time_seconds
FROM alerts
GROUP BY type, severity, status;

-- Success message
SELECT 'Tourist Safety Platform database schema created successfully!' as message;