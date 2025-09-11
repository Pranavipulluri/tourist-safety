# 🚀 Deploy TouristDigitalId Contract to Polygon

## Quick Deployment Guide

### Option 1: Using Remix (Recommended)

1. **Go to Remix IDE**: https://remix.ethereum.org/

2. **Create New File**: Create `TouristDigitalId.sol`

3. **Paste Contract Code**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TouristDigitalId {
    struct Tourist {
        string firstName;
        string lastName;
        string passportNumber;
        string nationality;
    }

    mapping(address => Tourist) public tourists;

    function createTourist(
        string memory _firstName,
        string memory _lastName,
        string memory _passportNumber,
        string memory _nationality
    ) public {
        tourists[msg.sender] = Tourist(_firstName, _lastName, _passportNumber, _nationality);
    }

    function getTourist(address _addr) public view returns (Tourist memory) {
        return tourists[_addr];
    }
}
```

4. **Compile Contract**:
   - Go to "Solidity Compiler" tab
   - Select compiler version: 0.8.19
   - Click "Compile TouristDigitalId.sol"

5. **Setup MetaMask**:
   - Install MetaMask browser extension
   - Import your private key: `a18b89f5f37f8eb9e8445dfa93944698ed8ba57879d29f13131faf84793016f6`
   - Add Polygon Network:
     - Network Name: Polygon Mainnet
     - RPC URL: `https://polygon-mainnet.g.alchemy.com/v2/XmbIM4kcSjZ9DNkl-R1hj`
     - Chain ID: 137
     - Symbol: MATIC
     - Block Explorer: https://polygonscan.com

6. **Deploy Contract**:
   - Go to "Deploy & Run Transactions" tab
   - Environment: "Injected Web3" (MetaMask)
   - Select your account
   - Contract: TouristDigitalId
   - Click "Deploy"
   - Confirm transaction in MetaMask

7. **Get Contract Address**:
   - After deployment, copy the contract address
   - Update your .env file:
   ```
   TOURIST_ID_CONTRACT_ADDRESS=0xYourContractAddress
   ```

### Option 2: Using Hardhat (If you prefer command line)

1. **Install Dependencies**:
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

2. **Initialize Hardhat**:
```bash
npx hardhat init
```

3. **Deploy**:
```bash
npx hardhat run scripts/deploy-simple.js --network polygon
```

## 📋 Contract Functions

After deployment, your contract will have:

- `createTourist(firstName, lastName, passportNumber, nationality)` - Register a tourist
- `getTourist(address)` - Get tourist information

## 🔧 Integration with Your Backend

Once deployed, update your `.env` file:

```env
# Blockchain Configuration
BLOCKCHAIN_NETWORK_URL=https://polygon-mainnet.g.alchemy.com/v2/XmbIM4kcSjZ9DNkl-R1hj
BLOCKCHAIN_PRIVATE_KEY=a18b89f5f37f8eb9e8445dfa93944698ed8ba57879d29f13131faf84793016f6
TOURIST_ID_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Your backend will automatically connect to the real blockchain!

## ⚠️ Important Notes

1. **Keep Private Key Safe**: Never share or commit your private key
2. **Test First**: Consider deploying to Mumbai testnet first
3. **Gas Costs**: Each transaction costs MATIC tokens
4. **Backup**: Save your contract address safely

## 🎉 After Deployment

Your Tourist Safety System will now use real blockchain for:
- Creating digital tourist IDs
- Verifying tourist identities
- Immutable record keeping
- Decentralized data storage
