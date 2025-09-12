const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Connection settings for local PostgreSQL
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testDatabaseConnection() {
  console.log('🔗 Testing Tourist Safety Database Connection...');
  console.log('===============================================');
  
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test database version
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', versionResult.rows[0].version.split(',')[0]);
    
    // Test database name
    const dbResult = await client.query('SELECT current_database()');
    console.log('🗄️  Current Database:', dbResult.rows[0].current_database);
    
    // Test tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('📋 Tables found:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log('   -', row.table_name);
    });
    
    // Test sample data
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Users in database:', usersResult.rows[0].count);
    
    const locationsResult = await client.query('SELECT COUNT(*) as count FROM locations');
    console.log('📍 Locations in database:', locationsResult.rows[0].count);
    
    // Test insert/select (optional)
    console.log('\n🧪 Testing basic operations...');
    
    // Insert a test user
    const testUserResult = await client.query(`
      INSERT INTO users (email, first_name, last_name, phone_number) 
      VALUES ('test@example.com', 'Test', 'User', '+1234567890') 
      ON CONFLICT (email) DO UPDATE SET 
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id, email, first_name, last_name
    `);
    console.log('✅ Test user created/updated:', testUserResult.rows[0]);
    
    // Clean up test user
    await client.query("DELETE FROM users WHERE email = 'test@example.com'");
    console.log('🧹 Test user cleaned up');
    
    client.release();
    
    console.log('\n🎉 Database test completed successfully!');
    console.log('===============================================');
    console.log('✅ Your Tourist Safety database is ready to use!');
    console.log('');
    console.log('🔗 Connection Details:');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   Username: ${process.env.DB_USERNAME}`);
    console.log('   Password: *** (configured)');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Start your application: npm run dev');
    console.log('   2. Test API endpoints');
    console.log('   3. Check application logs');
    console.log('');
    
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check if PostgreSQL service is running:');
    console.log('   Get-Service postgresql-x64-16');
    console.log('');
    console.log('2. Verify connection details in .env file');
    console.log('');
    console.log('3. Test manual connection:');
    console.log('   $env:PGPASSWORD="P#250406"; & "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe" -U postgres -d tourist_safety_db');
    console.log('');
  } finally {
    await pool.end();
  }
}

// Add connection error handling
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Run the test
testDatabaseConnection().catch(console.error);