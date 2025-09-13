// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TouristSafetyPlatform
 * @dev Comprehensive smart contract for tourist safety with SOS alerts, geofencing, and immutable records
 */
contract TouristSafetyPlatform is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Counters for unique IDs
    Counters.Counter private _touristIdCounter;
    Counters.Counter private _alertIdCounter;
    Counters.Counter private _geofenceIdCounter;
    
    // Enums for better type safety
    enum AlertType { SOS, PANIC, EMERGENCY, GEOFENCE, SAFETY_CHECK }
    enum AlertSeverity { LOW, MEDIUM, HIGH, CRITICAL }
    enum AlertStatus { ACTIVE, ACKNOWLEDGED, RESOLVED }
    enum GeofenceType { SAFE_ZONE, DANGER_ZONE, RESTRICTED_AREA }
    
    // Structs
    struct Tourist {
        uint256 id;
        address walletAddress;
        string digitalId;
        string firstName;
        string lastName;
        string passportNumber;
        string nationality;
        string phoneNumber;
        string emergencyContact;
        bool isActive;
        uint256 registrationTime;
        uint256 lastLocationUpdate;
    }
    
    struct SOSAlert {
        uint256 id;
        uint256 touristId;
        AlertType alertType;
        AlertSeverity severity;
        AlertStatus status;
        string message;
        int256 latitude;
        int256 longitude;
        string locationAddress;
        uint256 timestamp;
        address acknowledgedBy;
        uint256 acknowledgedAt;
        address resolvedBy;
        uint256 resolvedAt;
        string responseNotes;
        bool isBlockchainVerified;
    }
    
    struct LocationRecord {
        uint256 touristId;
        int256 latitude;
        int256 longitude;
        uint256 accuracy;
        uint256 timestamp;
        string address;
        bytes32 dataHash; // Hash of location data for integrity
    }
    
    struct Geofence {
        uint256 id;
        string name;
        GeofenceType geofenceType;
        int256 centerLatitude;
        int256 centerLongitude;
        uint256 radius; // in meters
        bool isActive;
        address createdBy;
        uint256 createdAt;
        string description;
    }
    
    struct GeofenceViolation {
        uint256 id;
        uint256 touristId;
        uint256 geofenceId;
        int256 latitude;
        int256 longitude;
        uint256 timestamp;
        string violationType; // "ENTRY" or "EXIT"
        bool isResolved;
    }
    
    // Mappings
    mapping(address => uint256) public addressToTouristId;
    mapping(uint256 => Tourist) public tourists;
    mapping(uint256 => SOSAlert) public sosAlerts;
    mapping(uint256 => Geofence) public geofences;
    mapping(uint256 => GeofenceViolation) public geofenceViolations;
    mapping(uint256 => LocationRecord[]) public touristLocations;
    mapping(address => bool) public authorizedResponders;
    mapping(address => bool) public authorizedAdmins;
    
    // Arrays for iteration
    uint256[] public allTouristIds;
    uint256[] public allAlertIds;
    uint256[] public allGeofenceIds;
    uint256[] public allViolationIds;
    
    // Events
    event TouristRegistered(uint256 indexed touristId, address indexed walletAddress, string digitalId);
    event SOSAlertTriggered(uint256 indexed alertId, uint256 indexed touristId, AlertType alertType, AlertSeverity severity);
    event AlertAcknowledged(uint256 indexed alertId, address indexed responder, uint256 timestamp);
    event AlertResolved(uint256 indexed alertId, address indexed resolver, uint256 timestamp);
    event LocationUpdated(uint256 indexed touristId, int256 latitude, int256 longitude, uint256 timestamp);
    event GeofenceCreated(uint256 indexed geofenceId, string name, GeofenceType geofenceType);
    event GeofenceViolation(uint256 indexed violationId, uint256 indexed touristId, uint256 indexed geofenceId);
    event EmergencyResponseTriggered(uint256 indexed alertId, uint256 indexed touristId, address responder);
    
    // Modifiers
    modifier onlyTourist() {
        require(addressToTouristId[msg.sender] != 0, "Not a registered tourist");
        _;
    }
    
    modifier onlyResponder() {
        require(authorizedResponders[msg.sender] || authorizedAdmins[msg.sender] || owner() == msg.sender, "Not authorized responder");
        _;
    }
    
    modifier onlyAdmin() {
        require(authorizedAdmins[msg.sender] || owner() == msg.sender, "Not authorized admin");
        _;
    }
    
    modifier validCoordinates(int256 _latitude, int256 _longitude) {
        require(_latitude >= -90000000 && _latitude <= 90000000, "Invalid latitude");
        require(_longitude >= -180000000 && _longitude <= 180000000, "Invalid longitude");
        _;
    }
    
    constructor() {
        // Initialize the owner as admin and responder
        authorizedAdmins[msg.sender] = true;
        authorizedResponders[msg.sender] = true;
    }
    
    /**
     * @dev Register a new tourist
     */
    function registerTourist(
        string memory _digitalId,
        string memory _firstName,
        string memory _lastName,
        string memory _passportNumber,
        string memory _nationality,
        string memory _phoneNumber,
        string memory _emergencyContact
    ) external {
        require(addressToTouristId[msg.sender] == 0, "Tourist already registered");
        require(bytes(_digitalId).length > 0, "Digital ID required");
        require(bytes(_firstName).length > 0, "First name required");
        require(bytes(_lastName).length > 0, "Last name required");
        
        _touristIdCounter.increment();
        uint256 newTouristId = _touristIdCounter.current();
        
        tourists[newTouristId] = Tourist({
            id: newTouristId,
            walletAddress: msg.sender,
            digitalId: _digitalId,
            firstName: _firstName,
            lastName: _lastName,
            passportNumber: _passportNumber,
            nationality: _nationality,
            phoneNumber: _phoneNumber,
            emergencyContact: _emergencyContact,
            isActive: true,
            registrationTime: block.timestamp,
            lastLocationUpdate: 0
        });
        
        addressToTouristId[msg.sender] = newTouristId;
        allTouristIds.push(newTouristId);
        
        emit TouristRegistered(newTouristId, msg.sender, _digitalId);
    }
    
    /**
     * @dev Trigger SOS Alert
     */
    function triggerSOSAlert(
        AlertType _alertType,
        AlertSeverity _severity,
        string memory _message,
        int256 _latitude,
        int256 _longitude,
        string memory _locationAddress
    ) external onlyTourist validCoordinates(_latitude, _longitude) nonReentrant {
        uint256 touristId = addressToTouristId[msg.sender];
        require(tourists[touristId].isActive, "Tourist account not active");
        
        _alertIdCounter.increment();
        uint256 newAlertId = _alertIdCounter.current();
        
        sosAlerts[newAlertId] = SOSAlert({
            id: newAlertId,
            touristId: touristId,
            alertType: _alertType,
            severity: _severity,
            status: AlertStatus.ACTIVE,
            message: _message,
            latitude: _latitude,
            longitude: _longitude,
            locationAddress: _locationAddress,
            timestamp: block.timestamp,
            acknowledgedBy: address(0),
            acknowledgedAt: 0,
            resolvedBy: address(0),
            resolvedAt: 0,
            responseNotes: "",
            isBlockchainVerified: true
        });
        
        allAlertIds.push(newAlertId);
        
        emit SOSAlertTriggered(newAlertId, touristId, _alertType, _severity);
        emit EmergencyResponseTriggered(newAlertId, touristId, address(0));
    }
    
    /**
     * @dev Acknowledge an SOS alert
     */
    function acknowledgeAlert(uint256 _alertId, string memory _notes) external onlyResponder {
        require(sosAlerts[_alertId].id != 0, "Alert does not exist");
        require(sosAlerts[_alertId].status == AlertStatus.ACTIVE, "Alert not active");
        
        sosAlerts[_alertId].status = AlertStatus.ACKNOWLEDGED;
        sosAlerts[_alertId].acknowledgedBy = msg.sender;
        sosAlerts[_alertId].acknowledgedAt = block.timestamp;
        sosAlerts[_alertId].responseNotes = _notes;
        
        emit AlertAcknowledged(_alertId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Resolve an SOS alert
     */
    function resolveAlert(uint256 _alertId, string memory _resolutionNotes) external onlyResponder {
        require(sosAlerts[_alertId].id != 0, "Alert does not exist");
        require(sosAlerts[_alertId].status != AlertStatus.RESOLVED, "Alert already resolved");
        
        sosAlerts[_alertId].status = AlertStatus.RESOLVED;
        sosAlerts[_alertId].resolvedBy = msg.sender;
        sosAlerts[_alertId].resolvedAt = block.timestamp;
        sosAlerts[_alertId].responseNotes = string(abi.encodePacked(sosAlerts[_alertId].responseNotes, " | Resolution: ", _resolutionNotes));
        
        emit AlertResolved(_alertId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update tourist location
     */
    function updateLocation(
        int256 _latitude,
        int256 _longitude,
        uint256 _accuracy,
        string memory _address
    ) external onlyTourist validCoordinates(_latitude, _longitude) {
        uint256 touristId = addressToTouristId[msg.sender];
        
        // Create data hash for integrity
        bytes32 dataHash = keccak256(abi.encodePacked(touristId, _latitude, _longitude, block.timestamp, msg.sender));
        
        LocationRecord memory newLocation = LocationRecord({
            touristId: touristId,
            latitude: _latitude,
            longitude: _longitude,
            accuracy: _accuracy,
            timestamp: block.timestamp,
            address: _address,
            dataHash: dataHash
        });
        
        touristLocations[touristId].push(newLocation);
        tourists[touristId].lastLocationUpdate = block.timestamp;
        
        emit LocationUpdated(touristId, _latitude, _longitude, block.timestamp);
        
        // Check for geofence violations
        _checkGeofenceViolations(touristId, _latitude, _longitude);
    }
    
    /**
     * @dev Create a geofence
     */
    function createGeofence(
        string memory _name,
        GeofenceType _geofenceType,
        int256 _centerLatitude,
        int256 _centerLongitude,
        uint256 _radius,
        string memory _description
    ) external onlyAdmin validCoordinates(_centerLatitude, _centerLongitude) {
        require(bytes(_name).length > 0, "Geofence name required");
        require(_radius > 0, "Radius must be greater than 0");
        
        _geofenceIdCounter.increment();
        uint256 newGeofenceId = _geofenceIdCounter.current();
        
        geofences[newGeofenceId] = Geofence({
            id: newGeofenceId,
            name: _name,
            geofenceType: _geofenceType,
            centerLatitude: _centerLatitude,
            centerLongitude: _centerLongitude,
            radius: _radius,
            isActive: true,
            createdBy: msg.sender,
            createdAt: block.timestamp,
            description: _description
        });
        
        allGeofenceIds.push(newGeofenceId);
        
        emit GeofenceCreated(newGeofenceId, _name, _geofenceType);
    }
    
    /**
     * @dev Internal function to check geofence violations
     */
    function _checkGeofenceViolations(uint256 _touristId, int256 _latitude, int256 _longitude) internal {
        for (uint256 i = 0; i < allGeofenceIds.length; i++) {
            uint256 geofenceId = allGeofenceIds[i];
            Geofence memory geofence = geofences[geofenceId];
            
            if (!geofence.isActive) continue;
            
            // Calculate distance (simplified calculation for demo)
            int256 latDiff = _latitude - geofence.centerLatitude;
            int256 lonDiff = _longitude - geofence.centerLongitude;
            uint256 distanceSquared = uint256(latDiff * latDiff + lonDiff * lonDiff);
            uint256 radiusSquared = geofence.radius * geofence.radius;
            
            bool isInsideGeofence = distanceSquared <= radiusSquared;
            
            // Create violation record for restricted areas or danger zones
            if (isInsideGeofence && (geofence.geofenceType == GeofenceType.RESTRICTED_AREA || geofence.geofenceType == GeofenceType.DANGER_ZONE)) {
                _createGeofenceViolation(_touristId, geofenceId, _latitude, _longitude, "ENTRY");
            }
        }
    }
    
    /**
     * @dev Create a geofence violation record
     */
    function _createGeofenceViolation(
        uint256 _touristId,
        uint256 _geofenceId,
        int256 _latitude,
        int256 _longitude,
        string memory _violationType
    ) internal {
        _geofenceIdCounter.increment();
        uint256 violationId = _geofenceIdCounter.current();
        
        geofenceViolations[violationId] = GeofenceViolation({
            id: violationId,
            touristId: _touristId,
            geofenceId: _geofenceId,
            latitude: _latitude,
            longitude: _longitude,
            timestamp: block.timestamp,
            violationType: _violationType,
            isResolved: false
        });
        
        allViolationIds.push(violationId);
        
        emit GeofenceViolation(violationId, _touristId, _geofenceId);
        
        // Auto-trigger alert for violation
        _alertIdCounter.increment();
        uint256 alertId = _alertIdCounter.current();
        
        string memory alertMessage = string(abi.encodePacked("Geofence violation: ", geofences[_geofenceId].name));
        
        sosAlerts[alertId] = SOSAlert({
            id: alertId,
            touristId: _touristId,
            alertType: AlertType.GEOFENCE,
            severity: AlertSeverity.HIGH,
            status: AlertStatus.ACTIVE,
            message: alertMessage,
            latitude: _latitude,
            longitude: _longitude,
            locationAddress: "",
            timestamp: block.timestamp,
            acknowledgedBy: address(0),
            acknowledgedAt: 0,
            resolvedBy: address(0),
            resolvedAt: 0,
            responseNotes: "",
            isBlockchainVerified: true
        });
        
        allAlertIds.push(alertId);
        emit SOSAlertTriggered(alertId, _touristId, AlertType.GEOFENCE, AlertSeverity.HIGH);
    }
    
    /**
     * @dev Admin functions to manage responders
     */
    function addResponder(address _responder) external onlyAdmin {
        authorizedResponders[_responder] = true;
    }
    
    function removeResponder(address _responder) external onlyAdmin {
        authorizedResponders[_responder] = false;
    }
    
    function addAdmin(address _admin) external onlyOwner {
        authorizedAdmins[_admin] = true;
    }
    
    function removeAdmin(address _admin) external onlyOwner {
        authorizedAdmins[_admin] = false;
    }
    
    /**
     * @dev View functions
     */
    function getTourist(uint256 _touristId) external view returns (Tourist memory) {
        return tourists[_touristId];
    }
    
    function getSOSAlert(uint256 _alertId) external view returns (SOSAlert memory) {
        return sosAlerts[_alertId];
    }
    
    function getAllActiveAlerts() external view returns (uint256[] memory) {
        uint256[] memory activeAlerts = new uint256[](allAlertIds.length);
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < allAlertIds.length; i++) {
            if (sosAlerts[allAlertIds[i]].status == AlertStatus.ACTIVE) {
                activeAlerts[activeCount] = allAlertIds[i];
                activeCount++;
            }
        }
        
        // Resize array to actual size
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeAlerts[i];
        }
        
        return result;
    }
    
    function getTouristLocations(uint256 _touristId) external view returns (LocationRecord[] memory) {
        return touristLocations[_touristId];
    }
    
    function getGeofence(uint256 _geofenceId) external view returns (Geofence memory) {
        return geofences[_geofenceId];
    }
    
    function getAllTourists() external view returns (uint256[] memory) {
        return allTouristIds;
    }
    
    function getAllAlerts() external view returns (uint256[] memory) {
        return allAlertIds;
    }
    
    function getAllGeofences() external view returns (uint256[] memory) {
        return allGeofenceIds;
    }
    
    function getTouristByAddress(address _touristAddress) external view returns (Tourist memory) {
        uint256 touristId = addressToTouristId[_touristAddress];
        require(touristId != 0, "Tourist not found");
        return tourists[touristId];
    }
    
    /**
     * @dev Emergency functions
     */
    function emergencyDeactivateTourist(uint256 _touristId) external onlyAdmin {
        tourists[_touristId].isActive = false;
    }
    
    function emergencyActivateTourist(uint256 _touristId) external onlyAdmin {
        tourists[_touristId].isActive = true;
    }
    
    function emergencyDeactivateGeofence(uint256 _geofenceId) external onlyAdmin {
        geofences[_geofenceId].isActive = false;
    }
    
    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalTourists,
        uint256 totalAlerts,
        uint256 activeAlerts,
        uint256 totalGeofences,
        uint256 totalViolations
    ) {
        totalTourists = allTouristIds.length;
        totalAlerts = allAlertIds.length;
        totalGeofences = allGeofenceIds.length;
        totalViolations = allViolationIds.length;
        
        // Count active alerts
        for (uint256 i = 0; i < allAlertIds.length; i++) {
            if (sosAlerts[allAlertIds[i]].status == AlertStatus.ACTIVE) {
                activeAlerts++;
            }
        }
    }
}