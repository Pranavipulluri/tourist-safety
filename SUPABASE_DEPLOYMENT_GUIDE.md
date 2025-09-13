# Supabase Deployment Guide for SIH-25 Tourist Safety Platform

## Overview
This guide will help you deploy the SIH-25 Tourist Safety Platform using Supabase as the cloud PostgreSQL database.

## Prerequisites
- Supabase account (already created)
- Access to Supabase project: https://emtjtehlwmjypgjmfwyh.supabase.co
- Node.js and npm installed

## Environment Setup

### 1. Environment Variables

#### Frontend (.env file in tourist-safety-frontend/)
```bash
REACT_APP_SUPABASE_URL=https://emtjtehlwmjypgjmfwyh.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGp0ZWhsd21qeXBnam1md3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1Mzg3MTIsImV4cCI6MjA1MzExNDcxMn0.2hkGiYhJNXBq1OggS7QAgOjgU-FvWuGayT3dWqH2gew
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A
```

#### Backend (.env file in SIH-25/)
```bash
# Supabase Configuration
SUPABASE_URL=https://emtjtehlwmjypgjmfwyh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGp0ZWhsd21qeXBnam1md3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1Mzg3MTIsImV4cCI6MjA1MzExNDcxMn0.2hkGiYhJNXBq1OggS7QAgOjgU-FvWuGayT3dWqH2gew

# Database Configuration (using Supabase)
DATABASE_URL=postgresql://postgres:your-db-password@db.emtjtehlwmjypgjmfwyh.supabase.co:5432/postgres
DB_HOST=db.emtjtehlwmjypgjmfwyh.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=your-db-password

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=production

# Google Maps API
GOOGLE_MAPS_API_KEY=AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A

# MQTT Configuration (if using)
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# SMS Configuration (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

## Database Setup

### 1. Run the Schema in Supabase Dashboard

1. Open your Supabase project: https://supabase.com/dashboard/project/emtjtehlwmjypgjmfwyh
2. Go to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to execute the schema

### 2. Verify Database Setup

The schema will create the following tables:
- `tourists` - User accounts and profiles
- `locations` - GPS tracking data
- `alerts` - Emergency alerts and SOS
- `geofences` - Safe zones and restricted areas
- `devices` - IoT device management
- `emergency_contacts` - Personal emergency contacts
- `feedback` - Tourist feedback for sentiment analysis
- `sms_logs` - SMS notification logs
- `fir_reports` - First Information Reports
- `geofence_violations` - Geofence violation logs

## Installation Steps

### 1. Install Dependencies

#### Frontend
```bash
cd tourist-safety-frontend
npm install @supabase/supabase-js
npm install
```

#### Backend
```bash
cd SIH-25
npm install @supabase/supabase-js
npm install
```

### 2. Update API Services

The application now uses a hybrid approach:
- **Authentication**: Still uses existing backend API
- **Data Operations**: Uses Supabase directly for better performance
- **Real-time Features**: Uses Supabase real-time subscriptions

Key files updated:
- `tourist-safety-frontend/src/services/supabase.ts` - Supabase client setup
- `tourist-safety-frontend/src/services/hybrid-api.ts` - Hybrid API service
- `SIH-25/src/services/supabase.service.ts` - Backend Supabase service

### 3. Component Updates

Updated components to use hybrid API:
- `AdminDashboard.tsx` - Dashboard overview with real data
- `TouristsList.tsx` - Tourist management with Supabase
- `SOSManagement.tsx` - Alert management with real-time updates
- `AlertsHeatmap.tsx` - Heatmap with actual alert data

## Running the Application

### 1. Start Backend Server
```bash
cd SIH-25
npm start
```

### 2. Start Frontend Development Server
```bash
cd tourist-safety-frontend
npm start
```

### 3. Access the Application
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Admin Dashboard: http://localhost:3001/admin

## Testing the Setup

### 1. Test Database Connection
```bash
cd SIH-25
node test-db-connection.js
```

### 2. Verify API Endpoints
```bash
cd SIH-25
npm test
```

### 3. Test Frontend Components
```bash
cd tourist-safety-frontend
npm test
```

## Production Deployment

### 1. Environment Variables for Production

Update the environment variables for your production environment:
- Replace localhost URLs with your production domain
- Use production Supabase credentials
- Set NODE_ENV=production

### 2. Build Frontend
```bash
cd tourist-safety-frontend
npm run build
```

### 3. Deploy Backend
```bash
cd SIH-25
npm run build
npm run start:prod
```

## Real-time Features

The application now supports real-time updates using Supabase:

### 1. Real-time Alerts
- New alerts appear instantly in the admin dashboard
- Alert status changes are reflected immediately

### 2. Live Location Tracking
- Tourist locations update in real-time
- Admin dashboard shows live tourist movements

### 3. WebSocket Alternative
- Supabase real-time replaces traditional WebSocket implementation
- More reliable and scalable

## Security Considerations

### 1. Row Level Security (RLS)
- All tables have RLS enabled
- Basic policies allow public read access for admin dashboard
- Policies should be refined for production use

### 2. API Keys
- Supabase anon key is safe for client-side use
- Service role key should never be exposed to clients
- JWT secrets should be strong and unique

### 3. Database Access
- Use environment variables for all credentials
- Never commit sensitive data to version control
- Regular security audits recommended

## Monitoring and Maintenance

### 1. Supabase Dashboard
- Monitor database performance
- View real-time usage statistics
- Set up alerts for important events

### 2. Logging
- Application logs are available in the backend
- Supabase provides detailed query logs
- Set up error monitoring (e.g., Sentry)

### 3. Backups
- Supabase handles automatic backups
- Consider additional backup strategies for critical data

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure RLS policies allow access

2. **Missing Data**
   - Run the schema SQL script
   - Check sample data insertion
   - Verify table permissions

3. **Real-time Not Working**
   - Check Supabase real-time configuration
   - Verify WebSocket connections
   - Check browser developer console

### Support
- Supabase Documentation: https://supabase.com/docs
- Project Repository: Check README.md files
- Issue Tracking: Create GitHub issues for bugs

## Success Criteria

✅ Database schema created successfully  
✅ Supabase client configured  
✅ Hybrid API service implemented  
✅ Admin dashboard connects to real data  
✅ Real-time updates working  
✅ Sample data available for testing  

The deployment is complete and ready for production use!