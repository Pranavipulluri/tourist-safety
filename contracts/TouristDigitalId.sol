// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TouristDigitalId {
    struct DigitalId {
        address owner;
        string passportNumber;
        string nationality;
        string encryptedData;
        bool isActive;
        uint256 createdAt;
    }

    mapping(bytes32 => DigitalId) public digitalIds;
    mapping(address => bytes32[]) public userDigitalIds;
    
    event DigitalIdCreated(
        bytes32 indexed digitalIdHash,
        address indexed owner,
        string passportNumber,
        uint256 timestamp
    );
    
    event DigitalIdStatusUpdated(
        bytes32 indexed digitalIdHash,
        bool isActive,
        uint256 timestamp
    );

    modifier onlyOwner(bytes32 digitalIdHash) {
        require(digitalIds[digitalIdHash].owner == msg.sender, "Not the owner of this digital ID");
        _;
    }

    modifier digitalIdExists(bytes32 digitalIdHash) {
        require(digitalIds[digitalIdHash].owner != address(0), "Digital ID does not exist");
        _;
    }

    /**
     * @dev Create a new digital ID for a tourist
     * @param tourist The address of the tourist
     * @param passportNumber The passport number
     * @param nationality The nationality
     * @param encryptedData The encrypted KYC data
     * @return digitalIdHash The unique hash of the digital ID
     */
    function createDigitalId(
        address tourist,
        string memory passportNumber,
        string memory nationality,
        string memory encryptedData
    ) public returns (bytes32) {
        bytes32 digitalIdHash = keccak256(
            abi.encodePacked(
                tourist,
                passportNumber,
                nationality,
                block.timestamp
            )
        );

        require(digitalIds[digitalIdHash].owner == address(0), "Digital ID already exists");

        digitalIds[digitalIdHash] = DigitalId({
            owner: tourist,
            passportNumber: passportNumber,
            nationality: nationality,
            encryptedData: encryptedData,
            isActive: true,
            createdAt: block.timestamp
        });

        userDigitalIds[tourist].push(digitalIdHash);

        emit DigitalIdCreated(digitalIdHash, tourist, passportNumber, block.timestamp);

        return digitalIdHash;
    }

    /**
     * @dev Verify if a digital ID is valid
     * @param digitalIdHash The hash of the digital ID to verify
     * @return isValid Whether the digital ID is valid
     * @return timestamp When the digital ID was created
     * @return owner The owner address of the digital ID
     */
    function verifyDigitalId(bytes32 digitalIdHash) 
        public 
        view 
        digitalIdExists(digitalIdHash)
        returns (bool isValid, uint256 timestamp, address owner) 
    {
        DigitalId memory digitalId = digitalIds[digitalIdHash];
        return (digitalId.isActive, digitalId.createdAt, digitalId.owner);
    }

    /**
     * @dev Get detailed information about a digital ID
     * @param digitalIdHash The hash of the digital ID
     * @return owner The owner address
     * @return passportNumber The passport number
     * @return nationality The nationality
     * @return isActive Whether the digital ID is active
     * @return createdAt When the digital ID was created
     */
    function getDigitalIdDetails(bytes32 digitalIdHash)
        public
        view
        digitalIdExists(digitalIdHash)
        returns (
            address owner,
            string memory passportNumber,
            string memory nationality,
            bool isActive,
            uint256 createdAt
        )
    {
        DigitalId memory digitalId = digitalIds[digitalIdHash];
        return (
            digitalId.owner,
            digitalId.passportNumber,
            digitalId.nationality,
            digitalId.isActive,
            digitalId.createdAt
        );
    }

    /**
     * @dev Update the status of a digital ID (activate/deactivate)
     * @param digitalIdHash The hash of the digital ID
     * @param isActive The new status
     */
    function updateDigitalIdStatus(bytes32 digitalIdHash, bool isActive) 
        public 
        onlyOwner(digitalIdHash)
        digitalIdExists(digitalIdHash)
    {
        digitalIds[digitalIdHash].isActive = isActive;
        emit DigitalIdStatusUpdated(digitalIdHash, isActive, block.timestamp);
    }

    /**
     * @dev Get all digital IDs for a user
     * @param user The user address
     * @return An array of digital ID hashes
     */
    function getUserDigitalIds(address user) public view returns (bytes32[] memory) {
        return userDigitalIds[user];
    }

    /**
     * @dev Get the encrypted data for a digital ID (only owner can access)
     * @param digitalIdHash The hash of the digital ID
     * @return The encrypted KYC data
     */
    function getEncryptedData(bytes32 digitalIdHash) 
        public 
        view 
        onlyOwner(digitalIdHash)
        digitalIdExists(digitalIdHash)
        returns (string memory) 
    {
        return digitalIds[digitalIdHash].encryptedData;
    }
}
