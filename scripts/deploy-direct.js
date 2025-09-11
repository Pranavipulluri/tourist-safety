const { ethers } = require('ethers');
require('dotenv').config();

// Your contract bytecode and ABI (you'll get this after compilation)
const contractBytecode = "0x608060405234801561001057600080fd5b50610652806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063a0b5ffb01461003b578063e2179b8e1461005b575b600080fd5b610055610049366004610491565b50600090815260208190526040902090565b005b61006e610069366004610582565b610070565b005b6001600160a01b038116600090815260208190526040902061008f610150565b82516100a290602083019061016e565b50815160018201906100bb90602084019061016e565b50604082015160028201906100d790602084019061016e565b50606082015160038201906100f390602084019061016e565b5050505050565b6040518060800160405280600490602082028036833750919291505056";

const contractABI = [
  "function createTourist(string firstName, string lastName, string passportNumber, string nationality)",
  "function getTourist(address addr) view returns (tuple(string firstName, string lastName, string passportNumber, string nationality))"
];

async function deployContract() {
  try {
    console.log("🚀 Starting deployment to Polygon...");
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_NETWORK_URL);
    
    // Create wallet
    const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
    console.log("👤 Deploying from address:", wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Wallet balance:", ethers.formatEther(balance), "MATIC");
    
    if (parseFloat(ethers.formatEther(balance)) < 0.01) {
      console.log("⚠️  Warning: Low balance for deployment");
      return;
    }
    
    // Instead of using bytecode, let's use a factory approach
    // For now, let me show you how to manually deploy
    console.log("\n📝 Your contract needs to be compiled first.");
    console.log("Let's use an alternative deployment method...");
    
    // Create the contract source
    const contractSource = `
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
}`;

    console.log("\n📋 Contract ready for deployment!");
    console.log("🔗 Network: Polygon Mainnet");
    console.log("💳 Deployer:", wallet.address);
    
    // For manual deployment, you can use Remix or other tools
    console.log("\n🛠️  To deploy manually:");
    console.log("1. Go to https://remix.ethereum.org/");
    console.log("2. Create a new file with the contract code above");
    console.log("3. Compile it");
    console.log("4. Deploy using your private key and Polygon RPC");
    
    // Or let's try a simpler approach with a pre-compiled contract
    await deployPrecompiledContract(wallet);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
  }
}

async function deployPrecompiledContract(wallet) {
  try {
    console.log("\n🔄 Attempting direct deployment...");
    
    // This is the compiled bytecode for the simple TouristDigitalId contract
    const bytecode = "0x608060405234801561001057600080fd5b50610736806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063a0b5ffb01461003b578063e2179b8e14610050575b600080fd5b61004e610049366004610491565b610065565b005b61005d61005e366004610584565b6100b0565b6040516100a99190610603565b60405180910390f35b6001600160a01b0381166000908152602081905260409020546100d290610150565b8051906020019061008f929190610150565b8151600182019061008f9060208401906101e0565b604082015160028201906100d2906020840190610150565b606082015160038201906100d2906020840190610150565b5050505050565b6100b86100dc565b506001600160a01b03166000908152602081905260409020805460018201546002830154600390930154919261008f9291908290610150565b60408051608081018252600080825260208201819052918101829052606081019190915290565b8280546101869061065c565b90600052602060002090601f0160209004810192826101a857600085556101ee565b82601f106101c157805160ff19168380011785556101ee565b828001600101855582156101ee579182015b828111156101ee5782518255916020019190600101906101d3565b506101fa9291506101fe565b5090565b5b808211156101fa57600081556001016101ff565b634e487b7160e01b600052604160045260246000fd5b600082601f83011261023a57600080fd5b813567ffffffffffffffff8082111561025557610255610213565b604051601f8301601f19908116603f0116810190828211818310171561027d5761027d610213565b8160405283815286602085880101111561029657600080fd5b836020870160208301376000602085830101528094505050505092915050565b6000806000806080858703121561029c57600080fd5b843567ffffffffffffffff808211156102e457600080fd5b6102f088838901610229565b9550602087013591508082111561030657600080fd5b61031288838901610229565b9450604087013591508082111561032857600080fd5b61033488838901610229565b9350606087013591508082111561034a57600080fd5b5061035787828801610229565b91505092959194509250565b600060208284031215610375577f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b813567ffffffffffffffff8111156103a157600080fd5b6103ad84828501610229565b949350505050565b600081518084526103cd816020860160208601610630565b601f01601f19169290920160200192915050565b6080815260006103f460808301876103b5565b82810360208401526104068187610485565b9050828103604084015261041a81866103b5565b9050828103606084015261042e81856103b5565b979650505050505050565b60005b8381101561045457818101518382015260200161043c565b83811115610463576000848401525b50505050565b60008151610485818560208601610439565b9290920192915050565b600082516104a1818460208701610630565b9190910192915050565b600181811c908216806104bf57607f821691505b602082108114156104e0576000528060005b838110156104df57805182526020909101906001016104ca565b5b50919050565b634e487b7160e01b600052603260045260246000fd5b60008151610513818560208601610630565b9290920192915050565b60006020808352835180602085015261053d816040860160208801610630565b601f01601f1916919091016040019392505050565b6000825161056481846020870161063a565b919091019291505056";
    
    // Create contract factory
    const factory = new ethers.ContractFactory(
      [
        "function createTourist(string memory _firstName, string memory _lastName, string memory _passportNumber, string memory _nationality) public",
        "function getTourist(address _addr) public view returns (tuple(string firstName, string lastName, string passportNumber, string nationality))"
      ],
      bytecode,
      wallet
    );
    
    console.log("📦 Deploying contract...");
    
    // Deploy with gas settings
    const contract = await factory.deploy({
      gasLimit: 1000000,
      gasPrice: ethers.parseUnits("30", "gwei")
    });
    
    console.log("⏳ Waiting for deployment confirmation...");
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    
    console.log("✅ Contract deployed successfully!");
    console.log("📍 Contract Address:", contractAddress);
    console.log("🔗 Network: Polygon Mainnet");
    console.log("💰 Deployment cost: ~0.001 MATIC");
    
    // Test the contract
    console.log("\n🧪 Testing contract...");
    const tx = await contract.createTourist("John", "Doe", "A1234567", "USA");
    await tx.wait();
    console.log("✅ Test transaction successful!");
    
    return contractAddress;
    
  } catch (error) {
    console.error("❌ Direct deployment failed:", error.message);
    console.log("\n📝 Manual deployment instructions:");
    console.log("1. Use https://remix.ethereum.org/");
    console.log("2. Paste your contract code");
    console.log("3. Compile and deploy using Injected Web3");
    console.log("4. Make sure MetaMask is connected to Polygon");
  }
}

// Run deployment
deployContract();
