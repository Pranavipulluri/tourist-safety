const { Pool } = require('pg');
require('dotenv').config();

console.log('🔗 Testing Tourist Safety Database Connection for Vercel...');
console.log('======================================================');

// Use DATABASE_URL if available, otherwise use individual parameters
const connectionString = process.env.DATABASE_URL;
const useConnectionString = !!connectionString;

console.log('Connection method:', useConnectionString ? 'Using DATABASE_URL' : 'Using individual parameters');

if (useConnectionString) {
  console.log('DATABASE_URL:', connectionString.replace(/(:.*@)/g, ':****@')); // Hide password in logs
} else {
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USERNAME:', process.env.DB_USERNAME);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '*** (configured)' : 'NOT SET');
  console.log('DB_NAME:', process.env.DB_NAME);
}

// Create a connection pool
const pool = new Pool(
  useConnectionString
    ? {
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: false
      }
);

async function testConnection() {
  try {
    console.log('\n🔍 Attempting connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', result.rows[0].version.split(',')[0]);
    
    const tablesResult = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Tables found:', tablesResult.rows[0].table_count);
    
    client.release();
    console.log('\n🎉 Database is ready for your Tourist Safety application on Vercel!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n🔧 Debug info:');
    console.log('Error code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused. Possible solutions:');
      console.log('1. For local testing: Make sure PostgreSQL is running');
      console.log('2. For Vercel: You MUST use an external PostgreSQL service');
      console.log('   - Supabase: https://supabase.com');
      console.log('   - Neon: https://neon.tech');
      console.log('   - Render: https://render.com');
      console.log('\nSee VERCEL_POSTGRES_FIX.md for detailed instructions');
    }
    
    if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Check your username/password in:');
      console.log('1. DATABASE_URL environment variable');
      console.log('2. DB_USERNAME and DB_PASSWORD environment variables');
    }

    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Host not found. Check your database hostname in:');
      console.log('1. DATABASE_URL environment variable');
      console.log('2. DB_HOST environment variable');
    }
  } finally {
    await pool.end();
  }
}

testConnection();