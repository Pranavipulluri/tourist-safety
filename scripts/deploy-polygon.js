const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying TouristDigitalId to Polygon Mainnet...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📊 Deployment Details:");
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");
  
  if (parseFloat(ethers.formatEther(balance)) < 0.1) {
    console.log("⚠️  WARNING: Low MATIC balance!");
    console.log("Please add at least 0.1 MATIC for deployment.");
    return;
  }

  // Deploy the contract
  console.log("\n🔨 Compiling and deploying contract...");
  const TouristDigitalId = await ethers.getContractFactory("TouristDigitalId");
  
  // Estimate gas
  const estimatedGas = await TouristDigitalId.getDeployTransaction().estimateGas();
  console.log("Estimated gas:", estimatedGas.toString());
  
  // Deploy with specific gas settings
  const touristDigitalId = await TouristDigitalId.deploy({
    gasLimit: 5000000,
    gasPrice: ethers.parseUnits("30", "gwei")
  });

  // Wait for deployment
  console.log("⏳ Waiting for deployment confirmation...");
  await touristDigitalId.waitForDeployment();
  
  const contractAddress = await touristDigitalId.getAddress();
  console.log("✅ TouristDigitalId deployed to:", contractAddress);

  // Update .env file
  console.log("\n📝 Updating environment configuration...");
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent = envContent.replace(
    /TOURIST_ID_CONTRACT_ADDRESS=.*/,
    `TOURIST_ID_CONTRACT_ADDRESS=${contractAddress}`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env file updated with contract address");

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: "Polygon Mainnet",
    chainId: 137,
    deploymentTime: new Date().toISOString(),
    transactionHash: touristDigitalId.deploymentTransaction().hash,
    gasUsed: estimatedGas.toString(),
    gasPrice: "30000000000"
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Information:");
  console.log("Address:", contractAddress);
  console.log("Network: Polygon Mainnet");
  console.log("Chain ID: 137");
  console.log("Deployer:", deployer.address);
  
  console.log("\n🔗 Useful Links:");
  console.log(`PolygonScan: https://polygonscan.com/address/${contractAddress}`);
  console.log(`Transaction: https://polygonscan.com/tx/${touristDigitalId.deploymentTransaction().hash}`);
  
  console.log("\n📚 Next Steps:");
  console.log("1. Verify the contract on PolygonScan:");
  console.log(`   npx hardhat verify --network polygon ${contractAddress}`);
  console.log("2. Test the contract functions");
  console.log("3. Restart your application");
  console.log("4. Add authorized verifiers if needed");
  
  // Test basic functionality
  console.log("\n🧪 Testing basic contract functionality...");
  try {
    const totalIds = await touristDigitalId.getTotalDigitalIds();
    console.log("✅ Contract is working - Total Digital IDs:", totalIds.toString());
    
    const isVerifier = await touristDigitalId.isAuthorizedVerifier(deployer.address);
    console.log("✅ Deployer is authorized verifier:", isVerifier);
  } catch (error) {
    console.log("⚠️  Contract test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
