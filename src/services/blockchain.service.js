const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
    this.privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    this.networkUrl = process.env.BLOCKCHAIN_NETWORK_URL || 'https://polygon-mainnet.g.alchemy.com/v2/XmbIM4kcSjZ9DNkl-R1hj';
    
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize provider
      this.provider = new ethers.providers.JsonRpcProvider(this.networkUrl);
      
      // Initialize signer
      if (this.privateKey) {
        this.signer = new ethers.Wallet(this.privateKey, this.provider);
      }
      
      // Load contract ABI and initialize contract
      if (this.contractAddress) {
        await this.loadContract();
      }
      
      console.log('✅ Blockchain service initialized');
      console.log(`🔗 Network: ${(await this.provider.getNetwork()).name}`);
      console.log(`📄 Contract: ${this.contractAddress}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
    }
  }

  async loadContract() {
    try {
      // Load ABI from deployment info or artifacts
      let abi;
      
      // Try to load from deployment info first
      const deploymentInfoPath = path.join(__dirname, '../deployment-info.json');
      if (fs.existsSync(deploymentInfoPath)) {
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
        abi = JSON.parse(deploymentInfo.abi);
      } else {
        // Fallback to artifacts
        const artifactPath = path.join(__dirname, '../artifacts/contracts/TouristSafetyPlatform.sol/TouristSafetyPlatform.json');
        if (fs.existsSync(artifactPath)) {
          const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
          abi = artifact.abi;
        } else {
          throw new Error('Contract ABI not found');
        }
      }
      
      this.contract = new ethers.Contract(this.contractAddress, abi, this.signer || this.provider);
      console.log('✅ Smart contract loaded');
      
    } catch (error) {
      console.error('❌ Failed to load contract:', error);
      throw error;
    }
  }

  // Tourist Registration
  async registerTourist(touristData) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }
      
      const tx = await this.contract.registerTourist(
        touristData.digitalId,
        touristData.firstName,
        touristData.lastName,
        touristData.passportNumber,
        touristData.nationality,
        touristData.phoneNumber,
        touristData.emergencyContact
      );
      
      const receipt = await tx.wait();
      
      // Extract tourist ID from events
      const event = receipt.events?.find(e => e.event === 'TouristRegistered');
      const touristId = event?.args?.touristId?.toString();
      
      console.log(`✅ Tourist registered on blockchain with ID: ${touristId}`);
      
      return {
        success: true,
        touristId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('❌ Failed to register tourist on blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // SOS Alert Functions
  async triggerSOSAlert(alertData) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }
      
      // Convert alert type and severity to contract enums
      const alertType = this.getAlertTypeEnum(alertData.type);
      const severity = getSeverityEnum(alertData.severity);
      
      // Convert coordinates to contract format (multiply by 1000000 for precision)
      const latitude = Math.round(alertData.latitude * 1000000);
      const longitude = Math.round(alertData.longitude * 1000000);
      
      const tx = await this.contract.triggerSOSAlert(
        alertType,
        severity,
        alertData.message,
        latitude,
        longitude,
        alertData.address || ''
      );
      
      const receipt = await tx.wait();
      
      // Extract alert ID from events
      const event = receipt.events?.find(e => e.event === 'SOSAlertTriggered');
      const alertId = event?.args?.alertId?.toString();
      
      console.log(`🚨 SOS Alert triggered on blockchain with ID: ${alertId}`);
      
      return {
        success: true,
        alertId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('❌ Failed to trigger SOS alert on blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async acknowledgeAlert(alertId, responderAddress, notes = '') {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }
      
      const tx = await this.contract.acknowledgeAlert(alertId, notes);
      const receipt = await tx.wait();
      
      console.log(`✅ Alert ${alertId} acknowledged on blockchain`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('❌ Failed to acknowledge alert on blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async resolveAlert(alertId, resolutionNotes = '') {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }
      
      const tx = await this.contract.resolveAlert(alertId, resolutionNotes);
      const receipt = await tx.wait();
      
      console.log(`✅ Alert ${alertId} resolved on blockchain`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('❌ Failed to resolve alert on blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Location Updates
  async updateLocation(touristData) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }
      
      // Convert coordinates to contract format
      const latitude = Math.round(touristData.latitude * 1000000);
      const longitude = Math.round(touristData.longitude * 1000000);
      
      const tx = await this.contract.updateLocation(
        latitude,
        longitude,
        touristData.accuracy || 0,
        touristData.address || ''
      );
      
      const receipt = await tx.wait();
      
      console.log(`📍 Location updated on blockchain for tourist`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('❌ Failed to update location on blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Geofencing
  async createGeofence(geofenceData) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }
      
      const geofenceType = this.getGeofenceTypeEnum(geofenceData.type);
      const centerLat = Math.round(geofenceData.centerLatitude * 1000000);
      const centerLng = Math.round(geofenceData.centerLongitude * 1000000);
      
      const tx = await this.contract.createGeofence(
        geofenceData.name,
        geofenceType,
        centerLat,
        centerLng,
        geofenceData.radius,
        geofenceData.description || ''
      );
      
      const receipt = await tx.wait();
      
      // Extract geofence ID from events
      const event = receipt.events?.find(e => e.event === 'GeofenceCreated');
      const geofenceId = event?.args?.geofenceId?.toString();
      
      console.log(`🗺️ Geofence created on blockchain with ID: ${geofenceId}`);
      
      return {
        success: true,
        geofenceId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('❌ Failed to create geofence on blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // View Functions
  async getTourist(touristId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const tourist = await this.contract.getTourist(touristId);
      
      return {
        success: true,
        data: {
          id: tourist.id.toString(),
          walletAddress: tourist.walletAddress,
          digitalId: tourist.digitalId,
          firstName: tourist.firstName,
          lastName: tourist.lastName,
          passportNumber: tourist.passportNumber,
          nationality: tourist.nationality,
          phoneNumber: tourist.phoneNumber,
          emergencyContact: tourist.emergencyContact,
          isActive: tourist.isActive,
          registrationTime: new Date(tourist.registrationTime.toNumber() * 1000),
          lastLocationUpdate: tourist.lastLocationUpdate.toNumber() > 0 
            ? new Date(tourist.lastLocationUpdate.toNumber() * 1000) 
            : null
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get tourist from blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSOSAlert(alertId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const alert = await this.contract.getSOSAlert(alertId);
      
      return {
        success: true,
        data: {
          id: alert.id.toString(),
          touristId: alert.touristId.toString(),
          alertType: this.parseAlertType(alert.alertType),
          severity: this.parseSeverity(alert.severity),
          status: this.parseStatus(alert.status),
          message: alert.message,
          latitude: alert.latitude.toNumber() / 1000000,
          longitude: alert.longitude.toNumber() / 1000000,
          locationAddress: alert.locationAddress,
          timestamp: new Date(alert.timestamp.toNumber() * 1000),
          acknowledgedBy: alert.acknowledgedBy !== ethers.constants.AddressZero ? alert.acknowledgedBy : null,
          acknowledgedAt: alert.acknowledgedAt.toNumber() > 0 ? new Date(alert.acknowledgedAt.toNumber() * 1000) : null,
          resolvedBy: alert.resolvedBy !== ethers.constants.AddressZero ? alert.resolvedBy : null,
          resolvedAt: alert.resolvedAt.toNumber() > 0 ? new Date(alert.resolvedAt.toNumber() * 1000) : null,
          responseNotes: alert.responseNotes,
          isBlockchainVerified: alert.isBlockchainVerified
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get SOS alert from blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAllActiveAlerts() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const activeAlertIds = await this.contract.getAllActiveAlerts();
      const activeAlerts = [];
      
      for (const alertId of activeAlertIds) {
        const alertResult = await this.getSOSAlert(alertId.toString());
        if (alertResult.success) {
          activeAlerts.push(alertResult.data);
        }
      }
      
      return {
        success: true,
        data: activeAlerts
      };
      
    } catch (error) {
      console.error('❌ Failed to get active alerts from blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getPlatformStats() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const stats = await this.contract.getPlatformStats();
      
      return {
        success: true,
        data: {
          totalTourists: stats.totalTourists.toString(),
          totalAlerts: stats.totalAlerts.toString(),
          activeAlerts: stats.activeAlerts.toString(),
          totalGeofences: stats.totalGeofences.toString(),
          totalViolations: stats.totalViolations.toString()
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get platform stats from blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Utility functions
  getAlertTypeEnum(type) {
    const types = {
      'SOS': 0,
      'PANIC': 1,
      'EMERGENCY': 2,
      'GEOFENCE': 3,
      'SAFETY_CHECK': 4
    };
    return types[type] || 0;
  }

  getSeverityEnum(severity) {
    const severities = {
      'LOW': 0,
      'MEDIUM': 1,
      'HIGH': 2,
      'CRITICAL': 3
    };
    return severities[severity] || 1;
  }

  getGeofenceTypeEnum(type) {
    const types = {
      'SAFE_ZONE': 0,
      'DANGER_ZONE': 1,
      'RESTRICTED_AREA': 2
    };
    return types[type] || 0;
  }

  parseAlertType(type) {
    const types = ['SOS', 'PANIC', 'EMERGENCY', 'GEOFENCE', 'SAFETY_CHECK'];
    return types[type] || 'UNKNOWN';
  }

  parseSeverity(severity) {
    const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    return severities[severity] || 'UNKNOWN';
  }

  parseStatus(status) {
    const statuses = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'];
    return statuses[status] || 'UNKNOWN';
  }

  // Admin functions
  async addResponder(responderAddress) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }
      
      const tx = await this.contract.addResponder(responderAddress);
      const receipt = await tx.wait();
      
      console.log(`✅ Responder ${responderAddress} added to blockchain`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
      
    } catch (error) {
      console.error('❌ Failed to add responder on blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Event listeners
  setupEventListeners(callbacks = {}) {
    if (!this.contract) {
      console.error('Contract not initialized for event listeners');
      return;
    }

    // SOS Alert triggered
    this.contract.on('SOSAlertTriggered', (alertId, touristId, alertType, severity, event) => {
      console.log(`🚨 New SOS Alert: ${alertId} from tourist ${touristId}`);
      if (callbacks.onSOSAlert) {
        callbacks.onSOSAlert({
          alertId: alertId.toString(),
          touristId: touristId.toString(),
          alertType: this.parseAlertType(alertType),
          severity: this.parseSeverity(severity),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }
    });

    // Location updates
    this.contract.on('LocationUpdated', (touristId, latitude, longitude, timestamp, event) => {
      console.log(`📍 Location updated for tourist ${touristId}`);
      if (callbacks.onLocationUpdate) {
        callbacks.onLocationUpdate({
          touristId: touristId.toString(),
          latitude: latitude.toNumber() / 1000000,
          longitude: longitude.toNumber() / 1000000,
          timestamp: new Date(timestamp.toNumber() * 1000),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }
    });

    // Geofence violations
    this.contract.on('GeofenceViolation', (violationId, touristId, geofenceId, event) => {
      console.log(`⚠️ Geofence violation: ${violationId} by tourist ${touristId}`);
      if (callbacks.onGeofenceViolation) {
        callbacks.onGeofenceViolation({
          violationId: violationId.toString(),
          touristId: touristId.toString(),
          geofenceId: geofenceId.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }
    });

    console.log('✅ Blockchain event listeners set up');
  }

  // Cleanup
  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
      console.log('✅ All blockchain event listeners removed');
    }
  }
}

module.exports = BlockchainService;