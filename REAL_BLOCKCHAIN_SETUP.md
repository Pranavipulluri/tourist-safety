# 🔗 Real Blockchain Configuration Guide

## Step 1: Choose Your Blockchain Network

### Recommended Options:

#### **Option A: Polygon Mumbai (Testnet) - FREE** ⭐ **RECOMMENDED**
- **Cost**: FREE (test tokens)
- **Speed**: Fast (2-3 second confirmations)
- **Gas Fees**: Near zero
- **Perfect for**: Development and testing

#### **Option B: Polygon Mainnet - LOW COST**
- **Cost**: Very low (~$0.01 per transaction)
- **Speed**: Fast (2-3 second confirmations)  
- **Gas Fees**: Much cheaper than Ethereum
- **Perfect for**: Production deployment

#### **Option C: Ethereum Sepolia (Testnet) - FREE**
- **Cost**: FREE (test tokens)
- **Speed**: Moderate (12-15 seconds)
- **Gas Fees**: Simulated
- **Perfect for**: Ethereum testing

#### **Option D: Ethereum Mainnet - EXPENSIVE**
- **Cost**: High (~$5-50 per transaction)
- **Speed**: Moderate (12-15 seconds)
- **Gas Fees**: Very expensive
- **Perfect for**: High-value production only

## Step 2: Get Required Credentials

### For Polygon Mumbai (Recommended):

1. **Get RPC URL**: 
   - Free: `https://rpc-mumbai.maticvigil.com/`
   - Or use Alchemy: `https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY`

2. **Create Wallet**:
   - Install MetaMask: https://metamask.io/
   - Create new account
   - Copy private key (KEEP SECURE!)

3. **Get Test MATIC**:
   - Visit: https://faucet.polygon.technology/
   - Enter your wallet address
   - Get free test MATIC tokens

4. **Add Mumbai Network to MetaMask**:
   - Network Name: Mumbai Testnet
   - RPC URL: https://rpc-mumbai.maticvigil.com/
   - Chain ID: 80001
   - Currency Symbol: MATIC
   - Block Explorer: https://mumbai.polygonscan.com/

## Step 3: Deploy Smart Contract

### Option A: Use Remix IDE (Easiest)

1. **Open Remix**: https://remix.ethereum.org/
2. **Create Contract File**:
   - New file: `TouristDigitalId.sol`
   - Copy content from `contracts/TouristDigitalId.sol`
3. **Compile Contract**:
   - Solidity Compiler tab
   - Select version 0.8.19+
   - Click "Compile"
4. **Deploy Contract**:
   - Deploy & Run tab
   - Environment: "Injected Provider - MetaMask"
   - Connect MetaMask to Mumbai
   - Click "Deploy"
   - Confirm transaction in MetaMask
   - **SAVE THE CONTRACT ADDRESS!**

### Option B: Use Hardhat (Advanced)

1. **Install Hardhat**:
   ```bash
   npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
   ```

2. **Initialize Hardhat**:
   ```bash
   npx hardhat init
   ```

3. **Configure Hardhat** (`hardhat.config.js`):
   ```javascript
   require("@nomiclabs/hardhat-ethers");
   
   module.exports = {
     solidity: "0.8.19",
     networks: {
       mumbai: {
         url: "https://rpc-mumbai.maticvigil.com/",
         accounts: [process.env.BLOCKCHAIN_PRIVATE_KEY]
       }
     }
   };
   ```

4. **Deploy Contract**:
   ```bash
   npx hardhat run scripts/deploy.js --network mumbai
   ```

## Step 4: Update Your .env File

Replace the mock values in your `.env` file:

```env
# Blockchain Configuration (REAL)
BLOCKCHAIN_NETWORK_URL=https://rpc-mumbai.maticvigil.com/
BLOCKCHAIN_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
TOURIST_ID_CONTRACT_ADDRESS=0xYourDeployedContractAddressHere
GAS_LIMIT=500000
GAS_PRICE=20000000000
```

**⚠️ SECURITY WARNING**: Never commit your private key to version control!

## Step 5: Test Real Blockchain Connection

1. **Restart Your Server**:
   ```bash
   npm run start:dev
   ```

2. **Check Connection**:
   ```bash
   curl http://localhost:3000/api/digital-id/blockchain/status
   ```

3. **Expected Response**:
   ```json
   {
     "connected": true,
     "networkName": "mumbai",
     "chainId": 80001,
     "blockNumber": 41234567,
     "gasPrice": "1.5 gwei",
     "walletBalance": "0.1 MATIC"
   }
   ```

## Step 6: Test Digital ID Creation

```bash
# Create a tourist first
curl -X POST http://localhost:3000/api/tourist \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@test.com",
    "phoneNumber": "+1-555-0123",
    "nationality": "American", 
    "passportNumber": "US123456789"
  }'

# Create digital ID on REAL blockchain
curl -X POST http://localhost:3000/api/digital-id/create \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "TOURIST_ID_FROM_ABOVE",
    "passportNumber": "US123456789",
    "nationality": "American",
    "dateOfBirth": "1990-01-15",
    "issueDate": "2020-01-01",
    "expiryDate": "2030-01-01",
    "kycData": {
      "fullName": "John Doe",
      "address": "123 Main St, NYC",
      "phoneNumber": "+1-555-0123",
      "email": "john@test.com",
      "emergencyContact": "+1-555-0124"
    }
  }'
```

## Step 7: Production Deployment

### For Production on Polygon Mainnet:

1. **Get Real MATIC**:
   - Buy MATIC from exchange (Coinbase, Binance, etc.)
   - Transfer to your wallet

2. **Update .env for Mainnet**:
   ```env
   BLOCKCHAIN_NETWORK_URL=https://polygon-rpc.com/
   BLOCKCHAIN_PRIVATE_KEY=0xYourRealPrivateKey
   TOURIST_ID_CONTRACT_ADDRESS=0xYourMainnetContractAddress
   ```

3. **Deploy to Mainnet**:
   - Use same process as testnet
   - Deploy contract to Polygon mainnet
   - Update contract address in .env

## Troubleshooting

### Common Issues:

1. **"Invalid private key"**:
   - Ensure private key starts with "0x"
   - Check it's 64 characters (32 bytes)

2. **"Insufficient funds"**:
   - Get more test tokens from faucet
   - Check wallet balance

3. **"Network connection failed"**:
   - Try different RPC URL
   - Check internet connection

4. **"Contract deployment failed"**:
   - Increase gas limit
   - Check wallet has enough tokens

### Getting Help:

- **Polygon Docs**: https://docs.polygon.technology/
- **Remix IDE**: https://remix.ethereum.org/
- **MetaMask Support**: https://support.metamask.io/

## Security Best Practices

1. **Private Key Security**:
   - Never share private keys
   - Use environment variables
   - Consider hardware wallets for production

2. **Contract Security**:
   - Audit smart contracts before mainnet
   - Use established patterns
   - Test thoroughly on testnet

3. **API Security**:
   - Use HTTPS in production
   - Implement rate limiting
   - Validate all inputs

---

**🎉 Once configured, your Tourist Safety System will have REAL blockchain digital identity management with tamper-proof records!**
