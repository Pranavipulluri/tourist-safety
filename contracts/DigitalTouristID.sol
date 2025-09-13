// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title DigitalTouristID
 * @dev Blockchain-backed Digital Tourist ID with dynamic lifecycle and tiered access control
 */
contract DigitalTouristID is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Role definitions for access control
    bytes32 public constant TOURISM_DEPT_ROLE = keccak256("TOURISM_DEPT_ROLE");
    bytes32 public constant POLICE_ROLE = keccak256("POLICE_ROLE");
    bytes32 public constant HOTEL_ROLE = keccak256("HOTEL_ROLE");
    bytes32 public constant KIOSK_ROLE = keccak256("KIOSK_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    Counters.Counter private _idCounter;

    // Tourist ID status enumeration
    enum IDStatus {
        ACTIVE,
        EXPIRED,
        REVOKED,
        LOST,
        REPLACED
    }

    // Access level enumeration
    enum AccessLevel {
        MINIMAL,      // Only basic info
        BOOKING,      // Hotel booking information
        SAFETY,       // Location and emergency contacts
        FULL,         // Complete profile (police only)
        EMERGENCY     // All data accessible during emergency
    }

    // Digital Tourist ID structure
    struct DigitalID {
        string touristId;
        address touristWallet;
        string encryptedPersonalData; // IPFS hash of encrypted data
        string encryptedBookingData;  // Hotel booking information
        string encryptedLocationData; // Current location and itinerary
        string emergencyContacts;     // Emergency contact information
        uint256 issuedAt;
        uint256 expiresAt;
        uint256 checkoutTime;         // Hotel checkout or departure time
        IDStatus status;
        string biometricHash;         // For secure verification
        mapping(address => AccessLevel) accessPermissions;
        mapping(bytes32 => bool) consentGiven; // Consent for specific access types
        string[] accessLog;          // Immutable access log
        bool emergencyOverride;      // For emergency situations
    }

    // Mapping from ID counter to Digital ID
    mapping(uint256 => DigitalID) private digitalIDs;
    
    // Mapping from tourist wallet to their current active ID
    mapping(address => uint256) private touristToActiveID;
    
    // Mapping from tourist ID string to blockchain ID
    mapping(string => uint256) private touristIdToBlockchainId;

    // Events for blockchain logging
    event IDIssued(
        uint256 indexed blockchainId,
        string indexed touristId,
        address indexed touristWallet,
        uint256 expiresAt
    );

    event IDAccessed(
        uint256 indexed blockchainId,
        address indexed accessor,
        AccessLevel accessLevel,
        uint256 timestamp,
        string purpose
    );

    event ConsentUpdated(
        uint256 indexed blockchainId,
        bytes32 indexed consentType,
        bool granted,
        uint256 timestamp
    );

    event IDExpired(
        uint256 indexed blockchainId,
        string indexed touristId,
        uint256 timestamp
    );

    event IDReissued(
        uint256 indexed oldId,
        uint256 indexed newId,
        string indexed touristId,
        string reason
    );

    event EmergencyAccess(
        uint256 indexed blockchainId,
        address indexed accessor,
        string reason,
        uint256 timestamp
    );

    event DataPurged(
        uint256 indexed blockchainId,
        string indexed touristId,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TOURISM_DEPT_ROLE, msg.sender);
    }

    /**
     * @dev Issue a new Digital Tourist ID
     */
    function issueDigitalID(
        string memory _touristId,
        address _touristWallet,
        string memory _encryptedPersonalData,
        string memory _encryptedBookingData,
        string memory _emergencyContacts,
        string memory _biometricHash,
        uint256 _validityPeriod,
        uint256 _checkoutTime
    ) external onlyRole(TOURISM_DEPT_ROLE) returns (uint256) {
        require(_touristWallet != address(0), "Invalid wallet address");
        require(bytes(_touristId).length > 0, "Tourist ID cannot be empty");
        
        // Revoke any existing active ID for this tourist
        uint256 existingId = touristToActiveID[_touristWallet];
        if (existingId != 0) {
            digitalIDs[existingId].status = IDStatus.REPLACED;
        }

        _idCounter.increment();
        uint256 newId = _idCounter.current();

        DigitalID storage newDigitalID = digitalIDs[newId];
        newDigitalID.touristId = _touristId;
        newDigitalID.touristWallet = _touristWallet;
        newDigitalID.encryptedPersonalData = _encryptedPersonalData;
        newDigitalID.encryptedBookingData = _encryptedBookingData;
        newDigitalID.emergencyContacts = _emergencyContacts;
        newDigitalID.biometricHash = _biometricHash;
        newDigitalID.issuedAt = block.timestamp;
        newDigitalID.expiresAt = block.timestamp + _validityPeriod;
        newDigitalID.checkoutTime = _checkoutTime;
        newDigitalID.status = IDStatus.ACTIVE;
        newDigitalID.emergencyOverride = false;

        // Set default consent permissions
        newDigitalID.consentGiven[keccak256("POLICE_ACCESS")] = true;
        newDigitalID.consentGiven[keccak256("EMERGENCY_ACCESS")] = true;
        newDigitalID.consentGiven[keccak256("TOURISM_DEPT_ACCESS")] = true;

        // Update mappings
        touristToActiveID[_touristWallet] = newId;
        touristIdToBlockchainId[_touristId] = newId;

        emit IDIssued(newId, _touristId, _touristWallet, newDigitalID.expiresAt);
        
        return newId;
    }

    /**
     * @dev Access Digital ID with tiered permissions
     */
    function accessDigitalID(
        uint256 _blockchainId,
        string memory _purpose
    ) external returns (
        string memory personalData,
        string memory bookingData,
        string memory locationData,
        string memory emergencyContacts,
        bool hasAccess
    ) {
        DigitalID storage digitalID = digitalIDs[_blockchainId];
        require(digitalID.status == IDStatus.ACTIVE, "ID is not active");
        require(block.timestamp <= digitalID.expiresAt, "ID has expired");

        AccessLevel accessLevel = _determineAccessLevel(msg.sender, digitalID);
        require(accessLevel != AccessLevel.MINIMAL || _hasMinimalAccess(digitalID), "Access denied");

        // Log access attempt
        string memory logEntry = string(abi.encodePacked(
            "Access by: ", _addressToString(msg.sender),
            " Purpose: ", _purpose,
            " Level: ", _accessLevelToString(accessLevel),
            " Time: ", _uint256ToString(block.timestamp)
        ));
        digitalID.accessLog.push(logEntry);

        // Return data based on access level
        if (accessLevel == AccessLevel.FULL || digitalID.emergencyOverride) {
            personalData = digitalID.encryptedPersonalData;
            bookingData = digitalID.encryptedBookingData;
            locationData = digitalID.encryptedLocationData;
            emergencyContacts = digitalID.emergencyContacts;
            hasAccess = true;
        } else if (accessLevel == AccessLevel.SAFETY) {
            locationData = digitalID.encryptedLocationData;
            emergencyContacts = digitalID.emergencyContacts;
            hasAccess = true;
        } else if (accessLevel == AccessLevel.BOOKING) {
            bookingData = digitalID.encryptedBookingData;
            hasAccess = true;
        } else {
            hasAccess = false;
        }

        emit IDAccessed(_blockchainId, msg.sender, accessLevel, block.timestamp, _purpose);
    }

    /**
     * @dev Update consent permissions
     */
    function updateConsent(
        uint256 _blockchainId,
        bytes32 _consentType,
        bool _granted
    ) external {
        DigitalID storage digitalID = digitalIDs[_blockchainId];
        require(msg.sender == digitalID.touristWallet, "Only tourist can update consent");
        require(digitalID.status == IDStatus.ACTIVE, "ID is not active");

        digitalID.consentGiven[_consentType] = _granted;
        
        emit ConsentUpdated(_blockchainId, _consentType, _granted, block.timestamp);
    }

    /**
     * @dev Update location data (for family tracking with consent)
     */
    function updateLocation(
        uint256 _blockchainId,
        string memory _encryptedLocationData
    ) external {
        DigitalID storage digitalID = digitalIDs[_blockchainId];
        require(
            msg.sender == digitalID.touristWallet || 
            hasRole(TOURISM_DEPT_ROLE, msg.sender),
            "Unauthorized location update"
        );
        require(digitalID.status == IDStatus.ACTIVE, "ID is not active");

        digitalID.encryptedLocationData = _encryptedLocationData;
    }

    /**
     * @dev Report lost ID and issue replacement
     */
    function reportLostID(
        string memory _touristId,
        string memory _biometricHash,
        address _newWallet
    ) external onlyRole(KIOSK_ROLE) returns (uint256) {
        uint256 oldId = touristIdToBlockchainId[_touristId];
        require(oldId != 0, "No existing ID found");

        DigitalID storage oldDigitalID = digitalIDs[oldId];
        require(keccak256(bytes(oldDigitalID.biometricHash)) == keccak256(bytes(_biometricHash)), "Biometric verification failed");

        // Mark old ID as lost
        oldDigitalID.status = IDStatus.LOST;

        // Issue new ID with same data but new wallet
        uint256 newId = issueDigitalID(
            _touristId,
            _newWallet,
            oldDigitalID.encryptedPersonalData,
            oldDigitalID.encryptedBookingData,
            oldDigitalID.emergencyContacts,
            _biometricHash,
            oldDigitalID.expiresAt - block.timestamp,
            oldDigitalID.checkoutTime
        );

        emit IDReissued(oldId, newId, _touristId, "Lost device");
        
        return newId;
    }

    /**
     * @dev Emergency access override
     */
    function emergencyAccess(
        uint256 _blockchainId,
        string memory _reason
    ) external onlyRole(EMERGENCY_ROLE) {
        DigitalID storage digitalID = digitalIDs[_blockchainId];
        digitalID.emergencyOverride = true;
        
        emit EmergencyAccess(_blockchainId, msg.sender, _reason, block.timestamp);
    }

    /**
     * @dev Auto-expire ID based on checkout time
     */
    function autoExpireID(uint256 _blockchainId) external {
        DigitalID storage digitalID = digitalIDs[_blockchainId];
        require(
            block.timestamp >= digitalID.checkoutTime || 
            block.timestamp >= digitalID.expiresAt,
            "ID not ready for expiration"
        );

        digitalID.status = IDStatus.EXPIRED;
        
        // Clear mappings
        delete touristToActiveID[digitalID.touristWallet];
        
        emit IDExpired(_blockchainId, digitalID.touristId, block.timestamp);
    }

    /**
     * @dev Purge expired data (Zero-Trust compliance)
     */
    function purgeExpiredData(uint256 _blockchainId) external onlyRole(TOURISM_DEPT_ROLE) {
        DigitalID storage digitalID = digitalIDs[_blockchainId];
        require(digitalID.status == IDStatus.EXPIRED, "ID must be expired first");
        require(block.timestamp >= digitalID.expiresAt + 30 days, "Purge grace period not met");

        // Keep only essential audit trail
        string memory touristId = digitalID.touristId;
        delete digitalIDs[_blockchainId];
        
        emit DataPurged(_blockchainId, touristId, block.timestamp);
    }

    /**
     * @dev Get access log for audit purposes
     */
    function getAccessLog(uint256 _blockchainId) external view returns (string[] memory) {
        require(
            hasRole(TOURISM_DEPT_ROLE, msg.sender) || 
            hasRole(POLICE_ROLE, msg.sender) ||
            digitalIDs[_blockchainId].touristWallet == msg.sender,
            "Unauthorized access to logs"
        );
        
        return digitalIDs[_blockchainId].accessLog;
    }

    /**
     * @dev Get ID status and basic info
     */
    function getIDStatus(uint256 _blockchainId) external view returns (
        string memory touristId,
        IDStatus status,
        uint256 expiresAt,
        bool emergencyOverride
    ) {
        DigitalID storage digitalID = digitalIDs[_blockchainId];
        return (
            digitalID.touristId,
            digitalID.status,
            digitalID.expiresAt,
            digitalID.emergencyOverride
        );
    }

    // Internal helper functions
    function _determineAccessLevel(address _accessor, DigitalID storage _digitalID) internal view returns (AccessLevel) {
        if (_digitalID.emergencyOverride && hasRole(EMERGENCY_ROLE, _accessor)) {
            return AccessLevel.EMERGENCY;
        }
        
        if (hasRole(POLICE_ROLE, _accessor) && _digitalID.consentGiven[keccak256("POLICE_ACCESS")]) {
            return AccessLevel.FULL;
        }
        
        if (hasRole(HOTEL_ROLE, _accessor) && _digitalID.consentGiven[keccak256("HOTEL_ACCESS")]) {
            return AccessLevel.BOOKING;
        }
        
        if (_digitalID.consentGiven[keccak256("FAMILY_ACCESS")]) {
            return AccessLevel.SAFETY;
        }
        
        return AccessLevel.MINIMAL;
    }

    function _hasMinimalAccess(DigitalID storage _digitalID) internal view returns (bool) {
        return hasRole(TOURISM_DEPT_ROLE, msg.sender) || 
               _digitalID.touristWallet == msg.sender;
    }

    // Utility functions for string conversion
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    function _uint256ToString(uint256 _value) internal pure returns (string memory) {
        if (_value == 0) return "0";
        uint256 temp = _value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(_value % 10)));
            _value /= 10;
        }
        return string(buffer);
    }

    function _accessLevelToString(AccessLevel _level) internal pure returns (string memory) {
        if (_level == AccessLevel.MINIMAL) return "MINIMAL";
        if (_level == AccessLevel.BOOKING) return "BOOKING";
        if (_level == AccessLevel.SAFETY) return "SAFETY";
        if (_level == AccessLevel.FULL) return "FULL";
        if (_level == AccessLevel.EMERGENCY) return "EMERGENCY";
        return "UNKNOWN";
    }

    // Role management functions
    function grantPoliceRole(address _police) external onlyRole(TOURISM_DEPT_ROLE) {
        grantRole(POLICE_ROLE, _police);
    }

    function grantHotelRole(address _hotel) external onlyRole(TOURISM_DEPT_ROLE) {
        grantRole(HOTEL_ROLE, _hotel);
    }

    function grantKioskRole(address _kiosk) external onlyRole(TOURISM_DEPT_ROLE) {
        grantRole(KIOSK_ROLE, _kiosk);
    }

    function grantEmergencyRole(address _emergency) external onlyRole(TOURISM_DEPT_ROLE) {
        grantRole(EMERGENCY_ROLE, _emergency);
    }
}