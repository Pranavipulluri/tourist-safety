const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("🚀 Deploying TouristSafetyPlatform smart contract...");
  
  // Get the contract factory
  const TouristSafetyPlatform = await ethers.getContractFactory("TouristSafetyPlatform");
  
  // Deploy the contract
  console.log("📝 Deploying contract...");
  const touristSafetyPlatform = await TouristSafetyPlatform.deploy();
  
  // Wait for deployment
  await touristSafetyPlatform.deployed();
  
  console.log("✅ TouristSafetyPlatform deployed to:", touristSafetyPlatform.address);
  console.log("🔗 Network:", await touristSafetyPlatform.provider.getNetwork());
  console.log("👤 Deployer:", await touristSafetyPlatform.signer.getAddress());
  
  // Verify contract on Polygonscan (if on mainnet/testnet)
  const network = await touristSafetyPlatform.provider.getNetwork();
  if (network.chainId === 137 || network.chainId === 80001) {
    console.log("⏳ Waiting for block confirmations...");
    await touristSafetyPlatform.deployTransaction.wait(6);
    
    console.log("🔍 Verifying contract on Polygonscan...");
    try {
      await hre.run("verify:verify", {
        address: touristSafetyPlatform.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Polygonscan");
    } catch (error) {
      console.error("❌ Verification failed:", error.message);
    }
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: touristSafetyPlatform.address,
    deployer: await touristSafetyPlatform.signer.getAddress(),
    deploymentTime: new Date().toISOString(),
    transactionHash: touristSafetyPlatform.deployTransaction.hash,
    gasUsed: (await touristSafetyPlatform.deployTransaction.wait()).gasUsed.toString(),
    abi: TouristSafetyPlatform.interface.format('json')
  };
  
  // Write deployment info to file
  const fs = require('fs');
  const deploymentPath = './deployment-info.json';
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to ${deploymentPath}`);
  
  // Display important addresses and info
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("====================");
  console.log(`Contract Address: ${touristSafetyPlatform.address}`);
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${await touristSafetyPlatform.signer.getAddress()}`);
  console.log(`Transaction Hash: ${touristSafetyPlatform.deployTransaction.hash}`);
  console.log(`Gas Used: ${(await touristSafetyPlatform.deployTransaction.wait()).gasUsed}`);
  
  console.log("\n🔧 NEXT STEPS:");
  console.log("1. Update .env files with the contract address");
  console.log("2. Configure frontend to connect to the deployed contract");
  console.log("3. Add authorized responders and admins");
  console.log("4. Test the contract functions");
  
  return touristSafetyPlatform;
}

// Handle script execution
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });