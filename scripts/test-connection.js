const { ethers } = require("hardhat");

async function testConnection() {
  try {
    console.log("🔍 Testing Polygon connection...");
    
    // Get the provider
    const provider = ethers.provider;
    
    // Check network
    const network = await provider.getNetwork();
    console.log("📡 Connected to network:", network.name, "Chain ID:", network.chainId.toString());
    
    // Get signers
    const signers = await ethers.getSigners();
    console.log("👤 Deployer address:", signers[0].address);
    
    // Check balance
    const balance = await provider.getBalance(signers[0].address);
    console.log("💰 Balance:", ethers.formatEther(balance), "MATIC");
    
    // Get current gas price
    const gasPrice = await provider.getFeeData();
    console.log("⛽ Current gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
    
    if (parseFloat(ethers.formatEther(balance)) < 0.01) {
      console.log("⚠️  Warning: Low balance. You might need more MATIC for deployment.");
    }
    
    console.log("✅ Connection test successful!");
    
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
  }
}

testConnection();
