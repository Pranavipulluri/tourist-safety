const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const BlockchainService = require('./services/blockchain.service');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://xyzcompany.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MzA3NDg5MCwiZXhwIjoxOTU4NjUwODkwfQ.abc123def456'
);

// Initialize Blockchain Service
const blockchainService = new BlockchainService();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    blockchain: !!blockchainService.contract,
    database: !!supabase
  });
});

// Contract info endpoint
app.get('/api/contract-info', (req, res) => {
  try {
    const deploymentInfoPath = path.join(__dirname, 'deployment-info.json');
    
    if (fs.existsSync(deploymentInfoPath)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
      res.json({
        address: deploymentInfo.contractAddress,
        abi: JSON.parse(deploymentInfo.abi),
        network: deploymentInfo.network
      });
    } else {
      res.status(404).json({ error: 'Contract deployment info not found' });
    }
  } catch (error) {
    console.error('Error reading contract info:', error);
    res.status(500).json({ error: 'Failed to read contract info' });
  }
});

// Tourist Registration - Hybrid Database + Blockchain
app.post('/api/tourists/register', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      passportNumber, 
      nationality, 
      emergencyContact,
      digitalId 
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !passportNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Register in database first
    const { data: tourist, error: dbError } = await supabase
      .from('tourists')
      .insert([{
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        passport_number: passportNumber,
        nationality,
        emergency_contact: emergencyContact,
        digital_id: digitalId || `tourist_${Date.now()}`,
        registration_date: new Date().toISOString(),
        is_active: true
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Database registration error:', dbError);
      return res.status(500).json({ error: 'Failed to register in database' });
    }

    // 2. Register on blockchain (optional, non-blocking)
    let blockchainResult = null;
    try {
      blockchainResult = await blockchainService.registerTourist({
        digitalId: tourist.digital_id,
        firstName,
        lastName,
        passportNumber,
        nationality,
        phoneNumber: phone,
        emergencyContact
      });

      // Update database with blockchain info if successful
      if (blockchainResult.success) {
        await supabase
          .from('tourists')
          .update({
            blockchain_tourist_id: blockchainResult.touristId,
            blockchain_tx_hash: blockchainResult.transactionHash,
            blockchain_verified: true
          })
          .eq('id', tourist.id);
      }
    } catch (blockchainError) {
      console.warn('Blockchain registration failed, continuing with database only:', blockchainError);
    }

    res.json({
      success: true,
      tourist: {
        id: tourist.id,
        firstName: tourist.first_name,
        lastName: tourist.last_name,
        email: tourist.email,
        digitalId: tourist.digital_id,
        blockchain: blockchainResult
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// SOS Alert - Hybrid Database + Blockchain
app.post('/api/alerts/sos', async (req, res) => {
  try {
    const {
      touristId,
      type = 'SOS',
      severity = 'HIGH',
      message,
      latitude,
      longitude,
      address
    } = req.body;

    // Validate required fields
    if (!touristId || !message || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Save to database first (critical for immediate response)
    const { data: alert, error: dbError } = await supabase
      .from('alerts')
      .insert([{
        tourist_id: touristId,
        alert_type: type.toLowerCase(),
        severity: severity.toLowerCase(),
        message,
        latitude,
        longitude,
        location_address: address,
        status: 'active',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Database alert error:', dbError);
      return res.status(500).json({ error: 'Failed to save alert to database' });
    }

    // 2. Try to save to blockchain (non-blocking)
    let blockchainResult = null;
    try {
      blockchainResult = await blockchainService.triggerSOSAlert({
        type: type.toUpperCase(),
        severity: severity.toUpperCase(),
        message,
        latitude,
        longitude,
        address: address || ''
      });

      // Update database with blockchain info if successful
      if (blockchainResult.success) {
        await supabase
          .from('alerts')
          .update({
            blockchain_alert_id: blockchainResult.alertId,
            blockchain_tx_hash: blockchainResult.transactionHash,
            blockchain_verified: true
          })
          .eq('id', alert.id);
      }
    } catch (blockchainError) {
      console.warn('Blockchain alert failed, continuing with database only:', blockchainError);
    }

    // 3. Send real-time notification
    await supabase
      .channel('alerts')
      .send({
        type: 'broadcast',
        event: 'sos_alert',
        payload: {
          alert: {
            id: alert.id,
            touristId: alert.tourist_id,
            type: alert.alert_type,
            severity: alert.severity,
            message: alert.message,
            latitude: alert.latitude,
            longitude: alert.longitude,
            address: alert.location_address,
            timestamp: alert.created_at,
            blockchain: blockchainResult
          }
        }
      });

    res.json({
      success: true,
      alert: {
        id: alert.id,
        type: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        latitude: alert.latitude,
        longitude: alert.longitude,
        timestamp: alert.created_at,
        blockchain: blockchainResult
      }
    });

  } catch (error) {
    console.error('SOS Alert error:', error);
    res.status(500).json({ error: 'Failed to create SOS alert' });
  }
});

// Acknowledge Alert - Hybrid
app.put('/api/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { responderName, notes = '' } = req.body;

    // 1. Update database
    const { data: alert, error: dbError } = await supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: responderName,
        acknowledged_at: new Date().toISOString(),
        response_notes: notes
      })
      .eq('id', alertId)
      .select()
      .single();

    if (dbError) {
      console.error('Database acknowledge error:', dbError);
      return res.status(500).json({ error: 'Failed to acknowledge alert in database' });
    }

    // 2. Update blockchain if available
    let blockchainResult = null;
    if (alert.blockchain_alert_id) {
      try {
        blockchainResult = await blockchainService.acknowledgeAlert(
          alert.blockchain_alert_id,
          notes
        );
      } catch (blockchainError) {
        console.warn('Blockchain acknowledge failed:', blockchainError);
      }
    }

    // 3. Send real-time notification
    await supabase
      .channel('alerts')
      .send({
        type: 'broadcast',
        event: 'alert_acknowledged',
        payload: {
          alertId: alert.id,
          acknowledgedBy: responderName,
          notes,
          blockchain: blockchainResult
        }
      });

    res.json({
      success: true,
      alert: {
        id: alert.id,
        status: alert.status,
        acknowledgedBy: alert.acknowledged_by,
        acknowledgedAt: alert.acknowledged_at,
        blockchain: blockchainResult
      }
    });

  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Resolve Alert - Hybrid
app.put('/api/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { responderName, resolutionNotes = '' } = req.body;

    // 1. Update database
    const { data: alert, error: dbError } = await supabase
      .from('alerts')
      .update({
        status: 'resolved',
        resolved_by: responderName,
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes
      })
      .eq('id', alertId)
      .select()
      .single();

    if (dbError) {
      console.error('Database resolve error:', dbError);
      return res.status(500).json({ error: 'Failed to resolve alert in database' });
    }

    // 2. Update blockchain if available
    let blockchainResult = null;
    if (alert.blockchain_alert_id) {
      try {
        blockchainResult = await blockchainService.resolveAlert(
          alert.blockchain_alert_id,
          resolutionNotes
        );
      } catch (blockchainError) {
        console.warn('Blockchain resolve failed:', blockchainError);
      }
    }

    // 3. Send real-time notification
    await supabase
      .channel('alerts')
      .send({
        type: 'broadcast',
        event: 'alert_resolved',
        payload: {
          alertId: alert.id,
          resolvedBy: responderName,
          resolutionNotes,
          blockchain: blockchainResult
        }
      });

    res.json({
      success: true,
      alert: {
        id: alert.id,
        status: alert.status,
        resolvedBy: alert.resolved_by,
        resolvedAt: alert.resolved_at,
        blockchain: blockchainResult
      }
    });

  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Get Active Alerts - Hybrid
app.get('/api/alerts/active', async (req, res) => {
  try {
    // Get from database (primary source)
    const { data: dbAlerts, error: dbError } = await supabase
      .from('alerts')
      .select(`
        *,
        tourists (
          first_name,
          last_name,
          phone,
          digital_id
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({ error: 'Failed to fetch alerts from database' });
    }

    // Enrich with blockchain data if available
    let blockchainAlerts = null;
    try {
      const blockchainResult = await blockchainService.getAllActiveAlerts();
      if (blockchainResult.success) {
        blockchainAlerts = blockchainResult.data;
      }
    } catch (blockchainError) {
      console.warn('Failed to fetch blockchain alerts:', blockchainError);
    }

    // Merge database and blockchain data
    const enrichedAlerts = dbAlerts.map(alert => {
      let blockchainData = null;
      
      if (blockchainAlerts && alert.blockchain_alert_id) {
        blockchainData = blockchainAlerts.find(
          ba => ba.id === alert.blockchain_alert_id
        );
      }

      return {
        id: alert.id,
        touristId: alert.tourist_id,
        tourist: alert.tourists,
        type: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        latitude: alert.latitude,
        longitude: alert.longitude,
        address: alert.location_address,
        status: alert.status,
        createdAt: alert.created_at,
        blockchainVerified: alert.blockchain_verified || false,
        blockchain: blockchainData
      };
    });

    res.json({
      success: true,
      alerts: enrichedAlerts,
      count: enrichedAlerts.length,
      blockchainCount: blockchainAlerts ? blockchainAlerts.length : 0
    });

  } catch (error) {
    console.error('Get active alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch active alerts' });
  }
});

// Location Update - Hybrid
app.post('/api/tourists/:touristId/location', async (req, res) => {
  try {
    const { touristId } = req.params;
    const { latitude, longitude, accuracy, address } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // 1. Update database
    const { data: location, error: dbError } = await supabase
      .from('locations')
      .insert([{
        tourist_id: touristId,
        latitude,
        longitude,
        accuracy: accuracy || 0,
        address: address || '',
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Database location error:', dbError);
      return res.status(500).json({ error: 'Failed to save location to database' });
    }

    // 2. Update tourist's last location
    await supabase
      .from('tourists')
      .update({
        last_latitude: latitude,
        last_longitude: longitude,
        last_location_update: new Date().toISOString()
      })
      .eq('id', touristId);

    // 3. Update blockchain if tourist is registered
    let blockchainResult = null;
    try {
      blockchainResult = await blockchainService.updateLocation({
        latitude,
        longitude,
        accuracy: accuracy || 0,
        address: address || ''
      });

      if (blockchainResult.success) {
        await supabase
          .from('locations')
          .update({
            blockchain_tx_hash: blockchainResult.transactionHash,
            blockchain_verified: true
          })
          .eq('id', location.id);
      }
    } catch (blockchainError) {
      console.warn('Blockchain location update failed:', blockchainError);
    }

    // 4. Check for geofence violations (simplified)
    // This would typically involve more complex geospatial queries
    
    res.json({
      success: true,
      location: {
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address,
        timestamp: location.timestamp,
        blockchain: blockchainResult
      }
    });

  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Platform Statistics - Hybrid
app.get('/api/stats', async (req, res) => {
  try {
    // Get database stats
    const [
      { count: totalTourists },
      { count: totalAlerts },
      { count: activeAlerts }
    ] = await Promise.all([
      supabase.from('tourists').select('*', { count: 'exact', head: true }),
      supabase.from('alerts').select('*', { count: 'exact', head: true }),
      supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ]);

    // Get blockchain stats if available
    let blockchainStats = null;
    try {
      const blockchainResult = await blockchainService.getPlatformStats();
      if (blockchainResult.success) {
        blockchainStats = blockchainResult.data;
      }
    } catch (blockchainError) {
      console.warn('Failed to fetch blockchain stats:', blockchainError);
    }

    res.json({
      success: true,
      database: {
        totalTourists,
        totalAlerts,
        activeAlerts
      },
      blockchain: blockchainStats,
      hybrid: {
        tourists: totalTourists,
        alerts: totalAlerts,
        activeAlerts: activeAlerts,
        blockchainVerified: blockchainStats ? {
          tourists: blockchainStats.totalTourists,
          alerts: blockchainStats.totalAlerts,
          activeAlerts: blockchainStats.activeAlerts
        } : null
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch platform statistics' });
  }
});

// Setup blockchain event listeners
blockchainService.setupEventListeners({
  onSOSAlert: async (alertData) => {
    console.log('🚨 Blockchain SOS Alert received:', alertData);
    
    // Send real-time notification to all connected clients
    await supabase
      .channel('blockchain_events')
      .send({
        type: 'broadcast',
        event: 'blockchain_sos_alert',
        payload: alertData
      });
  },
  
  onLocationUpdate: async (locationData) => {
    console.log('📍 Blockchain location update received:', locationData);
    
    // Send real-time notification
    await supabase
      .channel('blockchain_events')
      .send({
        type: 'broadcast',
        event: 'blockchain_location_update',
        payload: locationData
      });
  },
  
  onGeofenceViolation: async (violationData) => {
    console.log('⚠️ Blockchain geofence violation received:', violationData);
    
    // Send real-time notification
    await supabase
      .channel('blockchain_events')
      .send({
        type: 'broadcast',
        event: 'blockchain_geofence_violation',
        payload: violationData
      });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Tourist Safety API server running on port ${port}`);
  console.log(`🔗 Blockchain integration: ${blockchainService.contract ? 'Active' : 'Inactive'}`);
  console.log(`💾 Database integration: Active`);
  console.log(`⚡ Real-time events: Active`);
});

module.exports = app;