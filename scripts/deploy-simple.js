const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to Polygon Mainnet...");
  
  // Get the contract factory
  const TouristDigitalId = await hre.ethers.getContractFactory("TouristDigitalId");
  
  console.log("📝 Deploying SimpleTouristId contract...");
  
  // Deploy the contract
  const touristContract = await TouristDigitalId.deploy();
  
  // Wait for deployment to complete
  await touristContract.waitForDeployment();
  
  const contractAddress = await touristContract.getAddress();
  
  console.log("✅ SimpleTouristId deployed to:", contractAddress);
  console.log("🔗 Network:", hre.network.name);
  console.log("⛽ Gas used during deployment:", (await touristContract.deploymentTransaction()).gasLimit.toString());
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address
  };
  
  console.log("\n📄 Deployment Details:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Save to .env update
  console.log("\n🔧 Add this to your .env file:");
  console.log(`TOURIST_ID_CONTRACT_ADDRESS=${contractAddress}`);
  
  return contractAddress;
}

main()
  .then((contractAddress) => {
    console.log(`\n🎉 Deployment completed successfully!`);
    console.log(`📋 Contract Address: ${contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
