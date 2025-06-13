const hre = require("hardhat");

async function main() {
  console.log("🎮 WEB3DUEL TWO-PLAYER TEST");
  console.log("===========================");
  
  const tokenAddress = "0x2139A6A365B7A716ae219Cbd7dD19fd286d3A2c4";
  const gameAddress = "0xf47cB5cFB4a6E696C91295a475945C694634B2a5";
  
  // Player 1: Default hardhat account
  const [player1] = await hre.ethers.getSigners();
  
  // Player 2: Using provided private key for testing
  const player2PrivateKey = "34816b0f0c2999753050389a7814ae64241404153588d44d45a9e5b39342c951";
  const player2 = new hre.ethers.Wallet(player2PrivateKey, player1.provider);
  
  console.log(`🎯 Player 1: ${player1.address}`);
  console.log(`🎯 Player 2: ${player2.address}`);
  
  try {
    // Contract ABIs
    const tokenABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)", 
      "function balanceOf(address) view returns (uint256)",
      "function allowance(address,address) view returns (uint256)",
      "function approve(address,uint256) returns (bool)",
      "function transfer(address,uint256) returns (bool)"
    ];
    
    const gameABI = [
      "function entryFee() view returns (uint256)",
      "function gameIdCounter() view returns (uint256)",
      "function createGame(string) returns (uint256)",
      "function joinGame(uint256)",
      "function games(uint256) view returns (address,address,address,bool,string)",
      "function declareWinner(uint256,address)",
      "function claimPrize(uint256)"
    ];
    
    // Connect contracts
    const token1 = new hre.ethers.Contract(tokenAddress, tokenABI, player1);
    const game1 = new hre.ethers.Contract(gameAddress, gameABI, player1);
    const token2 = new hre.ethers.Contract(tokenAddress, tokenABI, player2);
    const game2 = new hre.ethers.Contract(gameAddress, gameABI, player2);
    
    console.log("\n✅ Contracts connected for both players");
    
    // Check basic info
    const entryFee = await game1.entryFee();
    const symbol = await token1.symbol();
    
    console.log(`💰 Entry Fee: ${hre.ethers.formatEther(entryFee)} ${symbol}`);
    
    // Check balances
    const balance1 = await token1.balanceOf(player1.address);
    const balance2 = await token2.balanceOf(player2.address);
    
    console.log(`\n👤 Player 1 Balance: ${hre.ethers.formatEther(balance1)} ${symbol}`);
    console.log(`👤 Player 2 Balance: ${hre.ethers.formatEther(balance2)} ${symbol}`);
    
    // Transfer tokens to player 2 if needed
    if (balance2 < entryFee * 2n) {
      console.log("\n💸 Transferring tokens to Player 2...");
      const transferTx = await token1.transfer(player2.address, hre.ethers.parseEther("10"));
      await transferTx.wait();
      console.log("✅ Tokens transferred to Player 2");
    }
    
    // Approve tokens for both players
    console.log("\n📝 Setting up token approvals...");
    
    const allowance1 = await token1.allowance(player1.address, gameAddress);
    if (allowance1 < entryFee) {
      const approve1 = await token1.approve(gameAddress, hre.ethers.parseEther("100"));
      await approve1.wait();
      console.log("✅ Player 1 tokens approved");
    }
    
    const allowance2 = await token2.allowance(player2.address, gameAddress);
    if (allowance2 < entryFee) {
      const approve2 = await token2.approve(gameAddress, hre.ethers.parseEther("100"));
      await approve2.wait();
      console.log("✅ Player 2 tokens approved");
    }
    
    // Test 1: Player 1 creates a game
    console.log("\n🎮 TEST 1: Player 1 Creates Game");
    console.log("=================================");
    
    const initialGameCount = await game1.gameIdCounter();
    console.log(`📊 Initial game count: ${initialGameCount}`);
    
    const createTx = await game1.createGame("Rock Paper Scissors Test", { gasLimit: 300000 });
    console.log(`📤 Create game transaction: ${createTx.hash}`);
    
    const createReceipt = await createTx.wait();
    console.log(`✅ Game created! Gas used: ${createReceipt.gasUsed}`);
    
    const gameId = initialGameCount;
    console.log(`🎯 Game ID: ${gameId}`);
    
    // Check initial game state
    let gameState = await game1.games(gameId);
    console.log(`\n📋 Initial Game State:`);
    console.log(`  Player 1: ${gameState[0]} ✅`);
    console.log(`  Player 2: ${gameState[1] === '0x0000000000000000000000000000000000000000' ? 'Empty Slot (Waiting...)' : gameState[1]} ⏳`);
    console.log(`  Winner: ${gameState[2] === '0x0000000000000000000000000000000000000000' ? 'TBD (Game not finished)' : gameState[2]} 🏆`);
    console.log(`  Game Type: ${gameState[4]}`);
    console.log(`  Status: 🔄 Waiting for Player 2 to Join`);
    
    // Test 2: Player 2 joins the game
    console.log("\n🎮 TEST 2: Player 2 Joins Game");
    console.log("===============================");
    
    const joinTx = await game2.joinGame(gameId, { gasLimit: 300000 });
    console.log(`📤 Join game transaction: ${joinTx.hash}`);
    
    const joinReceipt = await joinTx.wait();
    console.log(`✅ Player 2 joined! Gas used: ${joinReceipt.gasUsed}`);
    
    // Check updated game state
    gameState = await game1.games(gameId);
    console.log(`\n📋 Updated Game State:`);
    console.log(`  Player 1: ${gameState[0]} ✅`);
    console.log(`  Player 2: ${gameState[1]} ✅`);
    console.log(`  Winner: ${gameState[2] === '0x0000000000000000000000000000000000000000' ? 'TBD (Game starting...)' : gameState[2]} 🏆`);
    console.log(`  Game Type: ${gameState[4]}`);
    console.log(`  Status: 🎮 Ready to Play! Both players joined!`);
    
    // Test 3: Simulate gameplay (this would normally happen through the game server)
    console.log("\n🎮 TEST 3: Simulate Gameplay");
    console.log("=============================");
    
    console.log("🎲 Simulating Rock Paper Scissors game...");
    console.log("📝 Player 1 plays: Rock 🪨");
    console.log("📝 Player 2 plays: Scissors ✂️");
    console.log("🏆 Player 1 wins the match!");
    
    // Only the contract owner or authorized address should declare winner
    // For now, let's use player 1 (this should be the game server in production)
    const declareTx = await game1.declareWinner(gameId, player1.address, { gasLimit: 300000 });
    console.log(`📤 Declare winner transaction: ${declareTx.hash}`);
    
    const declareReceipt = await declareTx.wait();
    console.log(`✅ Winner declared! Gas used: ${declareReceipt.gasUsed}`);
    
    // Final game state
    gameState = await game1.games(gameId);
    console.log(`\n📋 Final Game State:`);
    console.log(`  Player 1: ${gameState[0]} ✅`);
    console.log(`  Player 2: ${gameState[1]} ✅`);
    console.log(`  Winner: ${gameState[2]} 🏆`);
    console.log(`  Claimed: ${gameState[3] ? '✅ Prize Claimed' : '⏳ Prize Available'}`);
    console.log(`  Game Type: ${gameState[4]}`);
    console.log(`  Status: 🎉 Game Completed!`);
    
    // Test 4: Winner claims prize
    console.log("\n🎮 TEST 4: Claim Prize");
    console.log("======================");
    
    const balanceBefore = await token1.balanceOf(player1.address);
    console.log(`💰 Player 1 balance before: ${hre.ethers.formatEther(balanceBefore)} ${symbol}`);
    
    const claimTx = await game1.claimPrize(gameId, { gasLimit: 300000 });
    await claimTx.wait();
    
    const balanceAfter = await token1.balanceOf(player1.address);
    console.log(`💰 Player 1 balance after: ${hre.ethers.formatEther(balanceAfter)} ${symbol}`);
    console.log(`🎉 Prize claimed: ${hre.ethers.formatEther(balanceAfter - balanceBefore)} ${symbol}`);
    
    console.log("\n🎉 TWO-PLAYER TEST COMPLETED! 🎉");
    console.log("=================================");
    console.log("✅ Game creation working");
    console.log("✅ Game joining working");  
    console.log("✅ Game completion working");
    console.log("✅ Prize claiming working");
    console.log("✅ Both players can interact with contracts");
    
    console.log("\n🚀 Ready for frontend testing!");
    console.log("Player addresses for frontend testing:");
    console.log(`Player 1: ${player1.address}`);
    console.log(`Player 2: ${player2.address}`);
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 