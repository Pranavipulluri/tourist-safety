#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Production database URL
const DATABASE_URL = "postgresql://postgres.yjhmdewvibwwapmsxdyq:tourist2024safety!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  console.log('🔄 Setting up production database...');
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('tourists', 'alerts', 'locations', 'geofences', 'digital_ids')
    `);
    
    console.log(`📊 Found ${tablesResult.rows.length} existing tables`);
    
    if (tablesResult.rows.length === 0) {
      console.log('🚀 Setting up database schema...');
      
      // Read and execute schema
      const schemaPath = path.join(__dirname, 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schema);
        console.log('✅ Database schema created successfully!');
      } else {
        // Create basic schema for alerts system
        console.log('📝 Creating basic schema...');
        const basicSchema = `
          -- Create enum types
          DO $$ BEGIN
            CREATE TYPE alert_type AS ENUM ('SOS', 'PANIC', 'MEDICAL', 'THEFT', 'HARASSMENT', 'LOST', 'ACCIDENT', 'FRAUD', 'OTHER');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;

          DO $$ BEGIN
            CREATE TYPE alert_status AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;

          DO $$ BEGIN
            CREATE TYPE alert_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;

          -- Tourists table
          CREATE TABLE IF NOT EXISTS tourists (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20),
            passport_number VARCHAR(50),
            nationality VARCHAR(100),
            current_location POINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Alerts table
          CREATE TABLE IF NOT EXISTS alerts (
            id SERIAL PRIMARY KEY,
            type alert_type NOT NULL,
            status alert_status DEFAULT 'ACTIVE',
            severity alert_severity DEFAULT 'MEDIUM',
            title VARCHAR(255) NOT NULL,
            description TEXT,
            location POINT,
            address TEXT,
            tourist_id INTEGER REFERENCES tourists(id),
            acknowledged_by VARCHAR(255),
            acknowledged_at TIMESTAMP,
            resolved_by VARCHAR(255),
            resolved_at TIMESTAMP,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Locations table
          CREATE TABLE IF NOT EXISTS locations (
            id SERIAL PRIMARY KEY,
            tourist_id INTEGER REFERENCES tourists(id),
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            address TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            accuracy DECIMAL(5, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Geofences table
          CREATE TABLE IF NOT EXISTS geofences (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            coordinates JSONB NOT NULL,
            radius INTEGER DEFAULT 100,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Digital IDs table
          CREATE TABLE IF NOT EXISTS digital_ids (
            id SERIAL PRIMARY KEY,
            tourist_id INTEGER REFERENCES tourists(id),
            blockchain_address VARCHAR(255),
            qr_code_url TEXT,
            verification_status BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Create indexes for performance
          CREATE INDEX IF NOT EXISTS idx_alerts_tourist_id ON alerts(tourist_id);
          CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
          CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
          CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
          CREATE INDEX IF NOT EXISTS idx_locations_tourist_id ON locations(tourist_id);
          CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp);

          -- Insert sample data for testing
          INSERT INTO tourists (first_name, last_name, email, phone, nationality) VALUES
          ('John', 'Doe', 'john.doe@email.com', '+1234567890', 'USA'),
          ('Jane', 'Smith', 'jane.smith@email.com', '+1234567891', 'UK'),
          ('Raj', 'Kumar', 'raj.kumar@email.com', '+916304381870', 'India')
          ON CONFLICT (email) DO NOTHING;
        `;
        
        await client.query(basicSchema);
        console.log('✅ Basic schema created successfully!');
      }
    } else {
      console.log('✅ Database schema already exists');
    }

    // Test some basic queries
    console.log('🧪 Testing database queries...');
    
    const touristsCount = await client.query('SELECT COUNT(*) FROM tourists');
    console.log(`👥 Tourists in database: ${touristsCount.rows[0].count}`);
    
    const alertsCount = await client.query('SELECT COUNT(*) FROM alerts');
    console.log(`🚨 Alerts in database: ${alertsCount.rows[0].count}`);
    
    client.release();
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase().catch(console.error);