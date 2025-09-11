@echo off
title Tourist Safety System - Real Blockchain Setup

echo.
echo 🔗 Tourist Safety System - Real Blockchain Setup
echo ==================================================

REM Check if .env exists
if not exist ".env" (
    echo ❌ .env file not found! Creating template...
    copy .env.example .env
)

echo.
echo 📋 Setup Checklist:
echo ===================

echo.
echo 1. 🦊 MetaMask Setup
echo    - Install MetaMask: https://metamask.io/
echo    - Create wallet and backup seed phrase
echo    - Copy private key (Settings ^> Security ^& Privacy ^> Export Private Key)
echo.

echo 2. 🌐 Choose Network:
echo    a) Polygon Mumbai (Testnet) - FREE ⭐ RECOMMENDED
echo       - RPC: https://rpc-mumbai.maticvigil.com/
echo       - Chain ID: 80001
echo       - Get test MATIC: https://faucet.polygon.technology/
echo.
echo    b) Polygon Mainnet - LOW COST
echo       - RPC: https://polygon-rpc.com/
echo       - Chain ID: 137
echo       - Need real MATIC tokens
echo.

echo 3. 🏗️  Deploy Smart Contract:
echo    - Go to: https://remix.ethereum.org/
echo    - Upload: contracts/TouristDigitalId.sol
echo    - Compile with Solidity 0.8.19+
echo    - Deploy to your chosen network
echo    - SAVE THE CONTRACT ADDRESS!
echo.

echo 4. ⚙️  Update Configuration:
echo    Edit your .env file with:
echo.
echo    # Replace these values:
echo    BLOCKCHAIN_NETWORK_URL=https://rpc-mumbai.maticvigil.com/
echo    BLOCKCHAIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
echo    TOURIST_ID_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_HERE
echo.

echo 5. 🧪 Test Setup:
echo    npm run start:dev
echo    curl http://localhost:3000/api/digital-id/blockchain/status
echo.

echo 6. 🎉 Start Creating Digital IDs:
echo    Your system is now connected to REAL blockchain!
echo    Visit: http://localhost:3000/api/docs
echo.

echo 📚 Need help? Check REAL_BLOCKCHAIN_SETUP.md for detailed guide!
echo.

set /p open_links="🔗 Open helpful links? (y/n): "

if /i "%open_links%"=="y" (
    echo Opening helpful resources...
    
    REM Open MetaMask installation
    start https://metamask.io/
    timeout /t 2 /nobreak >nul
    
    REM Open Polygon faucet
    start https://faucet.polygon.technology/
    timeout /t 2 /nobreak >nul
    
    REM Open Remix IDE
    start https://remix.ethereum.org/
)

echo.
echo ✅ Setup guide complete! Follow the steps above to connect to real blockchain.
echo 💡 Start with Polygon Mumbai testnet (FREE) before going to mainnet.
echo.

pause
