# 🛠️ Vercel PostgreSQL Connection Fix

## 🚨 Problem Identified

The deployment is failing with error:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

This happens because:
1. The application is trying to connect to a local PostgreSQL database (localhost:5432)
2. Vercel serverless functions cannot connect to a local database
3. You need to use an external PostgreSQL database service

## ✅ Solutions Applied

1. Updated `app.module.ts` to prioritize `DATABASE_URL` environment variable
2. Added proper SSL configuration for production environments
3. Disabled schema synchronization and dropping in production for safety
4. Added a placeholder for the `DATABASE_URL` in `vercel.json`

## 🚀 How to Complete the Fix

### Option 1: Use Supabase (Recommended)

1. **Create a Supabase Account**:
   - Go to [Supabase](https://supabase.com/)
   - Sign up with GitHub/Google
   - Create a new project

2. **Set Up PostgreSQL Database**:
   - Create a new database
   - Get the connection string from Settings > Database

3. **Update Vercel Environment Variables**:
   - Go to your Vercel project
   - Navigate to "Settings" > "Environment Variables"
   - Add a new variable:
     - Name: `DATABASE_URL`
     - Value: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

4. **Run Database Schema**:
   - Go to Supabase SQL Editor
   - Copy and paste content from `database/schema.sql`
   - Click "Run"

### Option 2: Use Neon (PostgreSQL as a Service)

1. **Create a Neon Account**:
   - Go to [Neon](https://neon.tech/)
   - Sign up and create a project

2. **Get Connection String**:
   - Neon will provide you with a connection string
   - It will look like: `postgresql://user:password@endpoint/database`

3. **Update Vercel Environment Variables**:
   - Add `DATABASE_URL` with your Neon connection string

### Option 3: Use Render (Simple PostgreSQL)

1. **Create a Render Account**:
   - Go to [Render](https://render.com/)
   - Sign up with GitHub
   - Create a new PostgreSQL database

2. **Get Connection Details**:
   - Render will provide connection details
   - Create a connection string: `postgresql://[username]:[password]@[host]:[port]/[dbname]`

3. **Update Vercel Environment Variables**:
   - Add `DATABASE_URL` with your Render connection string

## 🔄 After Setting Up External Database

1. **Deploy Again**:
   ```
   vercel --prod
   ```

2. **Verify Connection**:
   - Check `/api/health` endpoint
   - It should return a 200 OK response

3. **Test Other Endpoints**:
   - `/api/docs` should now load properly
   - Test other API endpoints

## 📋 Additional Notes

- **Security**: Make sure your database has proper security settings
- **Performance**: Choose a database region close to your Vercel deployment region
- **Costs**: Free tiers should be sufficient for testing, but check pricing for production
- **Scale**: Consider connection pooling for production deployments

## 🔍 How to Debug Database Issues

If you still encounter database issues:

1. **Check Logs in Vercel**:
   - Go to Vercel project
   - Navigate to "Deployments" > Latest deployment > "Functions"
   - Click on a function to see logs

2. **Test Connection Locally**:
   - Create a simple script to test the connection
   - Use the same `DATABASE_URL`

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Connected to database!');
    console.log('Version:', result.rows[0].version);
    client.release();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
```

The PostgreSQL connection error should now be resolved! 🎉