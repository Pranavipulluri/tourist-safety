# 🌐 Online Database Setup Guide for Tourist Safety System

## Option 1: Supabase (Recommended - Free PostgreSQL with PostGIS)

### 1. Create Supabase Account
- Go to: https://supabase.com/
- Sign up with GitHub/Google
- Create a new project
- Choose a secure password
- Select closest region

### 2. Get Connection Details
- Go to Project Settings > Database
- Copy the connection string that looks like:
```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 3. Update Your .env File
Replace your database configuration with:
```env
# Database - Supabase
DB_HOST=db.[your-project-ref].supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=[your-supabase-password]
DB_NAME=postgres
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 4. Run Schema
- Go to Supabase Dashboard > SQL Editor
- Copy and paste your `database/schema.sql` content
- Click "Run"

## Option 2: Render.com (Free PostgreSQL)

### 1. Create Render Account
- Go to: https://render.com/
- Sign up with GitHub
- Go to Dashboard

### 2. Create PostgreSQL Database
- Click "New +" > "PostgreSQL"
- Choose free plan
- Set database name: `tourist-safety-db`
- Choose region closest to you

### 3. Get Connection Details
After creation, you'll get:
- Host: [something].oregon-postgres.render.com
- Port: 5432
- Database: [your-db-name]
- Username: [generated]
- Password: [generated]

### 4. Update .env File
```env
# Database - Render
DB_HOST=[your-host].oregon-postgres.render.com
DB_PORT=5432
DB_USERNAME=[generated-username]
DB_PASSWORD=[generated-password]
DB_NAME=[your-db-name]
DATABASE_URL=postgresql://[username]:[password]@[host]:5432/[dbname]
```

## Option 3: Railway (Simple Setup)

### 1. Create Railway Account
- Go to: https://railway.app/
- Sign up with GitHub
- Create new project

### 2. Add PostgreSQL
- Click "New Service"
- Choose "PostgreSQL"
- Wait for deployment

### 3. Get Connection String
- Click on PostgreSQL service
- Go to "Connect" tab
- Copy the connection string

### 4. Update .env File
```env
DATABASE_URL=[your-railway-postgres-url]
```

## Testing Your Connection

After setting up any of the above, test your connection:

### Method 1: Using psql (if installed)
```bash
psql "your-connection-string-here"
```

### Method 2: Using Node.js Test Script
Create a file `test-db.js`:
```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Database connected successfully!');
    console.log('Version:', result.rows[0].version);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
```

Run with: `node test-db.js`

## Setting Up Schema

Once connected, you need to run your database schema:

### Method 1: Direct SQL (Recommended for Online DBs)
1. Copy content from `database/schema.sql`
2. Paste into your online database's SQL console
3. Execute

### Method 2: Using psql
```bash
psql "your-connection-string" -f database/schema.sql
```

### Method 3: Using Node.js Migration
Create `run-migration.js`:
```javascript
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    const schema = fs.readFileSync('database/schema.sql', 'utf8');
    await pool.query(schema);
    console.log('✅ Schema applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
```

Run with: `node run-migration.js`

## Advantages of Each Service

### Supabase
- ✅ PostGIS extension available
- ✅ Real-time features
- ✅ Built-in auth
- ✅ Good free tier
- ❌ Slightly complex setup

### Render
- ✅ Very simple setup
- ✅ Reliable
- ✅ Good performance
- ❌ Limited free tier

### Railway
- ✅ Extremely simple
- ✅ Good developer experience
- ✅ Automatic deployments
- ❌ Newer service

## Quick Start (Recommended: Supabase)

1. Go to https://supabase.com/
2. Create account and new project
3. Get your connection string
4. Update .env file
5. Run schema in Supabase SQL Editor
6. Test your app

Your database will be ready in 5 minutes! 🎉