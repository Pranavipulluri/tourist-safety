// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TouristDigitalId
 * @dev Smart contract for managing tourist digital identities on Polygon
 * @author Tourist Safety System
 */
contract TouristDigitalId is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _digitalIdCounter;
    
    struct DigitalIdentity {
        string touristId;
        string name;
        string nationality;
        string passportNumber;
        string phoneNumber;
        string emergencyContact;
        uint256 createdAt;
        uint256 updatedAt;
        bool isActive;
        bool isVerified;
        string ipfsHash; // For storing additional documents
    }
    
    // Mapping from digital ID to identity data
    mapping(uint256 => DigitalIdentity) public digitalIdentities;
    
    // Mapping from tourist ID to digital ID
    mapping(string => uint256) public touristIdToDigitalId;
    
    // Mapping for authorized verifiers
    mapping(address => bool) public authorizedVerifiers;
    
    // Events
    event DigitalIdCreated(
        uint256 indexed digitalId,
        string indexed touristId,
        string name,
        uint256 timestamp
    );
    
    event DigitalIdVerified(
        uint256 indexed digitalId,
        address indexed verifier,
        uint256 timestamp
    );
    
    event DigitalIdUpdated(
        uint256 indexed digitalId,
        uint256 timestamp
    );
    
    event DigitalIdDeactivated(
        uint256 indexed digitalId,
        uint256 timestamp
    );
    
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    
    // Modifiers
    modifier onlyAuthorizedVerifier() {
        require(
            authorizedVerifiers[msg.sender] || msg.sender == owner(),
            "TouristDigitalId: Not authorized verifier"
        );
        _;
    }
    
    modifier validDigitalId(uint256 digitalId) {
        require(digitalId > 0 && digitalId <= _digitalIdCounter.current(), 
                "TouristDigitalId: Invalid digital ID");
        _;
    }
    
    constructor() {
        // Add deployer as initial authorized verifier
        authorizedVerifiers[msg.sender] = true;
    }
    
    /**
     * @dev Create a new digital identity for a tourist
     * @param touristId Unique tourist identifier
     * @param name Tourist's full name
     * @param nationality Tourist's nationality
     * @param passportNumber Tourist's passport number
     * @param phoneNumber Tourist's phone number
     * @param emergencyContact Emergency contact information
     * @param ipfsHash IPFS hash for additional documents
     * @return digitalId The created digital ID
     */
    function createDigitalId(
        string memory touristId,
        string memory name,
        string memory nationality,
        string memory passportNumber,
        string memory phoneNumber,
        string memory emergencyContact,
        string memory ipfsHash
    ) external onlyAuthorizedVerifier nonReentrant returns (uint256) {
        require(bytes(touristId).length > 0, "TouristDigitalId: Tourist ID required");
        require(bytes(name).length > 0, "TouristDigitalId: Name required");
        require(touristIdToDigitalId[touristId] == 0, "TouristDigitalId: Tourist ID already exists");
        
        _digitalIdCounter.increment();
        uint256 newDigitalId = _digitalIdCounter.current();
        
        digitalIdentities[newDigitalId] = DigitalIdentity({
            touristId: touristId,
            name: name,
            nationality: nationality,
            passportNumber: passportNumber,
            phoneNumber: phoneNumber,
            emergencyContact: emergencyContact,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true,
            isVerified: false,
            ipfsHash: ipfsHash
        });
        
        touristIdToDigitalId[touristId] = newDigitalId;
        
        emit DigitalIdCreated(newDigitalId, touristId, name, block.timestamp);
        
        return newDigitalId;
    }
    
    /**
     * @dev Verify a digital identity
     * @param digitalId The digital ID to verify
     */
    function verifyDigitalId(uint256 digitalId) 
        external 
        onlyAuthorizedVerifier 
        validDigitalId(digitalId) 
        nonReentrant 
    {
        require(digitalIdentities[digitalId].isActive, "TouristDigitalId: Digital ID is not active");
        
        digitalIdentities[digitalId].isVerified = true;
        digitalIdentities[digitalId].updatedAt = block.timestamp;
        
        emit DigitalIdVerified(digitalId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get digital identity information
     * @param digitalId The digital ID to retrieve
     * @return Digital identity data
     */
    function getDigitalId(uint256 digitalId) 
        external 
        view 
        validDigitalId(digitalId) 
        returns (DigitalIdentity memory) 
    {
        return digitalIdentities[digitalId];
    }
    
    /**
     * @dev Get digital ID by tourist ID
     * @param touristId The tourist ID
     * @return digitalId The corresponding digital ID
     */
    function getDigitalIdByTouristId(string memory touristId) 
        external 
        view 
        returns (uint256) 
    {
        return touristIdToDigitalId[touristId];
    }
    
    /**
     * @dev Update digital identity information
     * @param digitalId The digital ID to update
     * @param phoneNumber New phone number
     * @param emergencyContact New emergency contact
     * @param ipfsHash New IPFS hash
     */
    function updateDigitalId(
        uint256 digitalId,
        string memory phoneNumber,
        string memory emergencyContact,
        string memory ipfsHash
    ) external onlyAuthorizedVerifier validDigitalId(digitalId) nonReentrant {
        require(digitalIdentities[digitalId].isActive, "TouristDigitalId: Digital ID is not active");
        
        if (bytes(phoneNumber).length > 0) {
            digitalIdentities[digitalId].phoneNumber = phoneNumber;
        }
        if (bytes(emergencyContact).length > 0) {
            digitalIdentities[digitalId].emergencyContact = emergencyContact;
        }
        if (bytes(ipfsHash).length > 0) {
            digitalIdentities[digitalId].ipfsHash = ipfsHash;
        }
        
        digitalIdentities[digitalId].updatedAt = block.timestamp;
        
        emit DigitalIdUpdated(digitalId, block.timestamp);
    }
    
    /**
     * @dev Deactivate a digital identity
     * @param digitalId The digital ID to deactivate
     */
    function deactivateDigitalId(uint256 digitalId) 
        external 
        onlyAuthorizedVerifier 
        validDigitalId(digitalId) 
        nonReentrant 
    {
        digitalIdentities[digitalId].isActive = false;
        digitalIdentities[digitalId].updatedAt = block.timestamp;
        
        emit DigitalIdDeactivated(digitalId, block.timestamp);
    }
    
    /**
     * @dev Add an authorized verifier
     * @param verifier Address to add as verifier
     */
    function addAuthorizedVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "TouristDigitalId: Invalid verifier address");
        authorizedVerifiers[verifier] = true;
        emit VerifierAdded(verifier);
    }
    
    /**
     * @dev Remove an authorized verifier
     * @param verifier Address to remove from verifiers
     */
    function removeAuthorizedVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = false;
        emit VerifierRemoved(verifier);
    }
    
    /**
     * @dev Get total number of digital IDs created
     * @return Total count of digital IDs
     */
    function getTotalDigitalIds() external view returns (uint256) {
        return _digitalIdCounter.current();
    }
    
    /**
     * @dev Check if an address is an authorized verifier
     * @param verifier Address to check
     * @return True if authorized, false otherwise
     */
    function isAuthorizedVerifier(address verifier) external view returns (bool) {
        return authorizedVerifiers[verifier] || verifier == owner();
    }
    
    /**
     * @dev Batch create multiple digital IDs (for efficiency)
     * @param touristIds Array of tourist IDs
     * @param names Array of names
     * @param nationalities Array of nationalities
     * @param passportNumbers Array of passport numbers
     * @param phoneNumbers Array of phone numbers
     * @param emergencyContacts Array of emergency contacts
     * @param ipfsHashes Array of IPFS hashes
     * @return digitalIds Array of created digital IDs
     */
    function batchCreateDigitalIds(
        string[] memory touristIds,
        string[] memory names,
        string[] memory nationalities,
        string[] memory passportNumbers,
        string[] memory phoneNumbers,
        string[] memory emergencyContacts,
        string[] memory ipfsHashes
    ) external onlyAuthorizedVerifier nonReentrant returns (uint256[] memory) {
        require(touristIds.length == names.length, "TouristDigitalId: Array length mismatch");
        require(touristIds.length <= 50, "TouristDigitalId: Batch size too large");
        
        uint256[] memory newDigitalIds = new uint256[](touristIds.length);
        
        for (uint256 i = 0; i < touristIds.length; i++) {
            require(bytes(touristIds[i]).length > 0, "TouristDigitalId: Tourist ID required");
            require(touristIdToDigitalId[touristIds[i]] == 0, "TouristDigitalId: Tourist ID already exists");
            
            _digitalIdCounter.increment();
            uint256 newDigitalId = _digitalIdCounter.current();
            
            digitalIdentities[newDigitalId] = DigitalIdentity({
                touristId: touristIds[i],
                name: names[i],
                nationality: nationalities[i],
                passportNumber: passportNumbers[i],
                phoneNumber: phoneNumbers[i],
                emergencyContact: emergencyContacts[i],
                createdAt: block.timestamp,
                updatedAt: block.timestamp,
                isActive: true,
                isVerified: false,
                ipfsHash: ipfsHashes[i]
            });
            
            touristIdToDigitalId[touristIds[i]] = newDigitalId;
            newDigitalIds[i] = newDigitalId;
            
            emit DigitalIdCreated(newDigitalId, touristIds[i], names[i], block.timestamp);
        }
        
        return newDigitalIds;
    }
}
