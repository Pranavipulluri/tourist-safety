require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local development
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    
    // Polygon Mainnet
    polygon: {
      url: process.env.BLOCKCHAIN_NETWORK_URL || "https://polygon-mainnet.g.alchemy.com/v2/XmbIM4kcSjZ9DNkl-R1hj",
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: 30000000000, // 30 gwei
      gas: 5000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    
    // Polygon Mumbai Testnet (for testing)
    mumbai: {
      url: "https://polygon-mumbai.g.alchemy.com/v2/your-api-key",
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: 20000000000,
      gas: 5000000
    }
  },
  
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || ""
    }
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  
  mocha: {
    timeout: 40000
  }
};
