const { Pool } = require('pg');
require('dotenv').config();

console.log('🔗 Testing Tourist Safety Database Connection...');
console.log('===============================================');

console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '*** (configured)' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME);

// Create a connection pool using individual parameters
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false
});

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
    console.log('\n🎉 Database is ready for your Tourist Safety application!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n🔧 Debug info:');
    console.log('Full error:', error.code);
    
    if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Possible solutions:');
      console.log('1. Double-check your password in .env file');
      console.log('2. Your password contains special characters (#)');
      console.log('3. Try resetting PostgreSQL password');
      console.log('\nTo reset PostgreSQL password:');
      console.log('1. Run: & "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe" -U postgres');
      console.log('2. Then: ALTER USER postgres PASSWORD \'newpassword\';');
    }
  } finally {
    await pool.end();
  }
}

testConnection();