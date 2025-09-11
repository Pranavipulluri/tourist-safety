const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function verifyPolygonConnection() {
    console.log('🔗 Verifying Polygon Mainnet Connection...\n');
    
    try {
        // Connect to Polygon
        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_NETWORK_URL);
        const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
        
        console.log('📊 Connection Details:');
        console.log(`RPC URL: ${process.env.BLOCKCHAIN_NETWORK_URL}`);
        console.log(`Wallet Address: ${wallet.address}`);
        
        // Check network
        const network = await provider.getNetwork();
        console.log(`\n🌐 Network Information:`);
        console.log(`Chain ID: ${network.chainId}`);
        console.log(`Network Name: ${network.name}`);
        
        if (network.chainId !== 137n) {
            console.log('❌ ERROR: Not connected to Polygon Mainnet!');
            console.log('Expected Chain ID: 137');
            return false;
        }
        
        console.log('✅ Connected to Polygon Mainnet');
        
        // Check wallet balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`\n💰 Wallet Balance: ${ethers.formatEther(balance)} MATIC`);
        
        if (parseFloat(ethers.formatEther(balance)) < 0.01) {
            console.log('⚠️  WARNING: Very low MATIC balance!');
            console.log('Please add MATIC for transaction fees.');
        }
        
        // Check gas price
        const gasPrice = await provider.getFeeData();
        console.log(`\n⛽ Current Gas Prices:`);
        console.log(`Gas Price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);
        console.log(`Max Fee: ${ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei')} gwei`);
        
        // Test contract interaction if deployed
        const contractAddress = process.env.TOURIST_ID_CONTRACT_ADDRESS;
        if (contractAddress && contractAddress !== '0x1234567890123456789012345678901234567890') {
            console.log(`\n🔍 Testing Contract Interaction:`);
            console.log(`Contract Address: ${contractAddress}`);
            
            // Simple contract ABI for testing
            const abi = [
                "function getTotalDigitalIds() view returns (uint256)",
                "function isAuthorizedVerifier(address) view returns (bool)",
                "function owner() view returns (address)"
            ];
            
            try {
                const contract = new ethers.Contract(contractAddress, abi, provider);
                
                const totalIds = await contract.getTotalDigitalIds();
                console.log(`Total Digital IDs: ${totalIds}`);
                
                const isVerifier = await contract.isAuthorizedVerifier(wallet.address);
                console.log(`Is Authorized Verifier: ${isVerifier}`);
                
                const owner = await contract.owner();
                console.log(`Contract Owner: ${owner}`);
                
                console.log('✅ Contract is accessible and working');
                
            } catch (contractError) {
                console.log('⚠️  Contract test failed:', contractError.message);
                console.log('This might mean the contract is not deployed yet.');
            }
        } else {
            console.log('\n📝 Contract not deployed yet.');
            console.log('Run deployment script to deploy the contract.');
        }
        
        console.log('\n🎉 Polygon connection verification complete!');
        return true;
        
    } catch (error) {
        console.error('❌ Connection verification failed:', error.message);
        
        if (error.message.includes('could not detect network')) {
            console.log('\n💡 Solution: Check your BLOCKCHAIN_NETWORK_URL');
            console.log('Make sure your Alchemy API key is valid and active.');
        }
        
        if (error.message.includes('invalid private key')) {
            console.log('\n💡 Solution: Check your BLOCKCHAIN_PRIVATE_KEY');
            console.log('Make sure it\'s a valid 64-character hex string.');
        }
        
        return false;
    }
}

async function testTransactionCost() {
    console.log('\n💸 Estimating Transaction Costs...\n');
    
    try {
        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_NETWORK_URL);
        const gasPrice = await provider.getFeeData();
        
        const transactions = [
            { name: 'Contract Deployment', gas: 2500000 },
            { name: 'Create Digital ID', gas: 150000 },
            { name: 'Verify Digital ID', gas: 80000 },
            { name: 'Update Digital ID', gas: 100000 }
        ];
        
        console.log('📊 Estimated Transaction Costs (in MATIC):');
        console.log('='.repeat(50));
        
        for (const tx of transactions) {
            const cost = (BigInt(tx.gas) * gasPrice.gasPrice) / BigInt(10**18);
            const costFloat = parseFloat(cost.toString());
            console.log(`${tx.name.padEnd(20)}: ${costFloat.toFixed(6)} MATIC`);
        }
        
        console.log('='.repeat(50));
        console.log('\n💡 Note: Costs may vary based on network congestion');
        
    } catch (error) {
        console.error('❌ Cost estimation failed:', error.message);
    }
}

async function createTestTransaction() {
    console.log('\n🧪 Creating Test Transaction...\n');
    
    try {
        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_NETWORK_URL);
        const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
        
        // Get current nonce
        const nonce = await provider.getTransactionCount(wallet.address);
        console.log(`Current nonce: ${nonce}`);
        
        // Create a simple transaction (send 0 MATIC to self)
        const tx = {
            to: wallet.address,
            value: 0,
            gasLimit: 21000,
            gasPrice: await provider.getFeeData().then(data => data.gasPrice),
            nonce: nonce
        };
        
        console.log('📝 Transaction details:');
        console.log(`To: ${tx.to}`);
        console.log(`Value: ${tx.value} MATIC`);
        console.log(`Gas Limit: ${tx.gasLimit}`);
        console.log(`Gas Price: ${ethers.formatUnits(tx.gasPrice, 'gwei')} gwei`);
        
        console.log('\n⚠️  This is a test - no actual transaction will be sent.');
        console.log('To send real transactions, remove this safety check.');
        
        // Uncomment below to send actual test transaction
        // const response = await wallet.sendTransaction(tx);
        // console.log(`Transaction sent: ${response.hash}`);
        // await response.wait();
        // console.log('✅ Transaction confirmed');
        
    } catch (error) {
        console.error('❌ Test transaction failed:', error.message);
    }
}

// Main function
async function main() {
    console.log('🔗 Polygon Mainnet Verification Tool\n');
    console.log('='.repeat(60));
    
    const isConnected = await verifyPolygonConnection();
    
    if (isConnected) {
        await testTransactionCost();
        await createTestTransaction();
        
        console.log('\n✅ All verifications passed!');
        console.log('\n📋 Ready for production deployment:');
        console.log('1. npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox');
        console.log('2. npx hardhat compile');
        console.log('3. npx hardhat run scripts/deploy-polygon.js --network polygon');
        console.log('4. npx hardhat verify --network polygon <CONTRACT_ADDRESS>');
    } else {
        console.log('\n❌ Fix connection issues before proceeding.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { verifyPolygonConnection, testTransactionCost };
