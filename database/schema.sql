-- Tourist Safety Database Schema
-- Run this to set up the real database

-- Create database (run this separately)
-- CREATE DATABASE tourist_safety_db;

-- Connect to the database and run the rest:

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enums
CREATE TYPE user_role AS ENUM ('TOURIST', 'ADMIN', 'AUTHORITY');
CREATE TYPE alert_status AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED');
CREATE TYPE alert_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE device_type AS ENUM ('SMARTWATCH', 'PANIC_BUTTON', 'GPS_TRACKER', 'MOBILE');

-- Users/Tourists table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    emergency_contact VARCHAR(20),
    nationality VARCHAR(50),
    passport_number VARCHAR(50),
    role user_role DEFAULT 'TOURIST',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    address TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PostGIS geometry column for spatial queries
SELECT AddGeometryColumn('locations', 'geom', 4326, 'POINT', 2);

-- Create spatial index
CREATE INDEX idx_locations_geom ON locations USING GIST (geom);

-- Update geometry column with lat/lng data
CREATE OR REPLACE FUNCTION update_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location_geom
    BEFORE INSERT OR UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_location_geom();

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    priority alert_priority DEFAULT 'MEDIUM',
    status alert_status DEFAULT 'ACTIVE',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IoT Devices table
CREATE TABLE iot_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_type device_type NOT NULL,
    battery_level INTEGER DEFAULT 100,
    last_heartbeat TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    paired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Geofences/Safety Zones table
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    radius DECIMAL(8, 2) NOT NULL, -- in meters
    safety_level INTEGER DEFAULT 5, -- 1-10 scale
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency Contacts table
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Travel Plans/Itinerary table
CREATE TABLE travel_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    destination VARCHAR(200) NOT NULL,
    planned_start_date DATE,
    planned_end_date DATE,
    accommodation TEXT,
    emergency_contact_local VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incidents/FIR table
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    incident_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    incident_time TIMESTAMP NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'REPORTED',
    police_station TEXT,
    fir_number VARCHAR(50),
    officer_assigned VARCHAR(100)
);

-- System Logs table
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_locations_tourist_id ON locations(tourist_id);
CREATE INDEX idx_locations_timestamp ON locations(timestamp);
CREATE INDEX idx_alerts_tourist_id ON alerts(tourist_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_devices_tourist_id ON iot_devices(tourist_id);
CREATE INDEX idx_devices_device_id ON iot_devices(device_id);

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_nearby_tourists(
    center_lat DECIMAL(10, 8),
    center_lng DECIMAL(11, 8),
    radius_km DECIMAL(8, 2) DEFAULT 1.0
)
RETURNS TABLE (
    tourist_id UUID,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    distance_km DECIMAL(8, 2),
    last_seen TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.phone_number,
        l.latitude,
        l.longitude,
        (ST_Distance(
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
            l.geom::geography
        ) / 1000)::DECIMAL(8,2) as distance_km,
        l.timestamp
    FROM users u
    JOIN locations l ON u.id = l.tourist_id
    WHERE l.timestamp = (
        SELECT MAX(timestamp) 
        FROM locations l2 
        WHERE l2.tourist_id = u.id
    )
    AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
        l.geom::geography,
        radius_km * 1000
    )
    AND u.role = 'TOURIST'
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to check if location is in safe zone
CREATE OR REPLACE FUNCTION is_location_safe(
    check_lat DECIMAL(10, 8),
    check_lng DECIMAL(11, 8)
)
RETURNS INTEGER AS $$
DECLARE
    safety_score INTEGER := 5; -- default moderate safety
    zone_safety INTEGER;
BEGIN
    -- Check if location is within any defined geofence
    SELECT MAX(safety_level) INTO zone_safety
    FROM geofences
    WHERE is_active = true
    AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(check_lng, check_lat), 4326)::geography,
        radius
    );
    
    IF zone_safety IS NOT NULL THEN
        safety_score := zone_safety;
    END IF;
    
    RETURN safety_score;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data
INSERT INTO users (email, first_name, last_name, phone_number, emergency_contact, nationality, role) VALUES
('sample.tourist1@email.com', 'Rahul', 'Sharma', '+91-9876543210', '+91-9876543211', 'Indian', 'TOURIST'),
('sample.tourist2@email.com', 'Priya', 'Patel', '+91-9876543212', '+91-9876543213', 'Indian', 'TOURIST'),
('sample.tourist3@email.com', 'John', 'Smith', '+1-555-0123', '+1-555-0124', 'American', 'TOURIST'),
('admin@touristsafety.com', 'Admin', 'User', '+91-9000000000', '+91-9000000001', 'Indian', 'ADMIN');

-- Insert sample geofences (safe zones)
INSERT INTO geofences (name, description, center_lat, center_lng, radius, safety_level) VALUES
('India Gate Area', 'Tourist-friendly area around India Gate', 28.6129, 77.2295, 1000, 8),
('Red Fort Complex', 'Historical monument with good security', 28.6562, 77.2410, 800, 9),
('Connaught Place', 'Commercial center with police presence', 28.6315, 77.2167, 1200, 7),
('Airport Terminal', 'High security zone', 28.5562, 77.1000, 2000, 10);

-- Create admin user for testing
-- Password will be hashed in the application
UPDATE users SET password_hash = '$2b$10$example_hash_for_testing' WHERE email = 'admin@touristsafety.com';

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tourist_safety_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tourist_safety_user;