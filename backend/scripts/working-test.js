// backend/scripts/working-test.js
const hre = require("hardhat");

async function main() {
  console.log("🎮 WEB3DUEL WORKING TEST");
  console.log("========================");
  
  const tokenAddress = "0x2139A6A365B7A716ae219Cbd7dD19fd286d3A2c4";
  const gameAddress = "0xf47cB5cFB4a6E696C91295a475945C694634B2a5";
  const [signer] = await hre.ethers.getSigners();
  
  console.log(`👤 Testing with: ${signer.address}`);
  
  try {
    // Test contracts step by step
    console.log("\n🔗 Connecting to contracts...");
    
    // Connect to token
    const tokenABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function balanceOf(address) view returns (uint256)",
      "function allowance(address,address) view returns (uint256)"
    ];
    
    const gameABI = [
      "function entryFee() view returns (uint256)",
      "function gameIdCounter() view returns (uint256)",
      "function createGame(string) returns (uint256)",
      "function games(uint256) view returns (address,address,address,bool,string)"
    ];
    
    const token = new hre.ethers.Contract(tokenAddress, tokenABI, signer);
    const game = new hre.ethers.Contract(gameAddress, gameABI, signer);
    
    console.log("✅ Contracts connected via ABI");
    
    // Test token
    const name = await token.name();
    const symbol = await token.symbol();
    const balance = await token.balanceOf(signer.address);
    const allowance = await token.allowance(signer.address, gameAddress);
    
    console.log(`\n💰 Token Info:`);
    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  Your Balance: ${hre.ethers.formatEther(balance)} ${symbol}`);
    console.log(`  Allowance: ${hre.ethers.formatEther(allowance)} ${symbol}`);
    
    // Test game
    const entryFee = await game.entryFee();
    const gameCount = await game.gameIdCounter();
    
    console.log(`\n🎮 Game Info:`);
    console.log(`  Entry Fee: ${hre.ethers.formatEther(entryFee)} ${symbol}`);
    console.log(`  Total Games: ${gameCount.toString()}`);
    
    // Check if user can play
    const canPlay = balance >= entryFee && allowance >= entryFee;
    console.log(`  Can Create Games: ${canPlay ? '✅ YES' : '❌ NO'}`);
    
    if (canPlay) {
      console.log("\n🎯 Testing game creation...");
      const gameType = `Test Game ${Date.now()}`;
      
      try {
        const tx = await game.createGame(gameType, { gasLimit: 300000 });
        console.log(`  Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`  ✅ Game created! Gas used: ${receipt.gasUsed.toString()}`);
        
        // Check new game count
        const newGameCount = await game.gameIdCounter();
        console.log(`  New game count: ${newGameCount.toString()}`);
        
        console.log("\n🎉 FULL TEST SUCCESSFUL! 🎉");
        console.log("Your Web3Duel platform is working perfectly!");
        
      } catch (createError) {
        console.error(`❌ Game creation failed: ${createError.message}`);
      }
    } else {
      console.log("\n⚠️  Cannot create games - insufficient balance or allowance");
    }
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });