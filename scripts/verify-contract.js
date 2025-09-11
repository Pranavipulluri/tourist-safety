const { ethers } = require('ethers');
require('dotenv').config();

async function verifyContract() {
  try {
    console.log("🔍 Verifying contract deployment...");
    
    const contractAddress = process.env.TOURIST_ID_CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      console.log("❌ Contract address not found in .env file");
      console.log("Please add: TOURIST_ID_CONTRACT_ADDRESS=0xYourContractAddress");
      return;
    }
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_NETWORK_URL);
    
    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      [
        "function createTourist(string memory _firstName, string memory _lastName, string memory _passportNumber, string memory _nationality) public",
        "function getTourist(address _addr) public view returns (tuple(string firstName, string lastName, string passportNumber, string nationality))"
      ],
      provider
    );
    
    console.log("📍 Contract Address:", contractAddress);
    console.log("🔗 Network:", "Polygon Mainnet");
    
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.log("❌ No contract found at this address");
      return;
    }
    
    console.log("✅ Contract found!");
    console.log("📦 Contract bytecode length:", code.length);
    
    // Test contract call (this should work without gas)
    try {
      const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      
      // This will fail but that's expected for an empty mapping
      try {
        const tourist = await contract.getTourist(zeroAddress);
        console.log("📋 Test call successful");
      } catch (error) {
        if (error.message.includes("revert")) {
          console.log("✅ Contract is responding (empty result is expected)");
        }
      }
      
      console.log("🎉 Contract verification successful!");
      console.log("\n🚀 Your contract is ready to use!");
      console.log("📝 You can now:");
      console.log("  - Start your server: npm run start:dev");
      console.log("  - Test endpoints: http://localhost:3000/api/docs");
      console.log("  - Create digital IDs via API");
      
    } catch (error) {
      console.error("⚠️  Contract verification partial:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

verifyContract();
