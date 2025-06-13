const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x2139A6A365B7A716ae219Cbd7dD19fd286d3A2c4";
  const gameAddress = "0xf47cB5cFB4a6E696C91295a475945C694634B2a5";
  const userAddress = "0x704b903d168Aa907262520E0A0F8C065d7941FD4";
  
  const Token = await hre.ethers.getContractFactory("Web3DuelToken");
  const token = Token.attach(tokenAddress);
  
  const Game = await hre.ethers.getContractFactory("Web3DuelGame");
  const game = Game.attach(gameAddress);
  
  console.log("=== Token Information ===");
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  console.log(`Token: ${name} (${symbol}), Decimals: ${decimals}`);
  
  console.log("\n=== User Balance ===");
  const balance = await token.balanceOf(userAddress);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} ${symbol}`);
  
  console.log("\n=== Game Contract Info ===");
  const entryFee = await game.entryFee();
  console.log(`Entry Fee: ${hre.ethers.formatEther(entryFee)} ${symbol}`);
  
  console.log("\n=== Allowance ===");
  const allowance = await token.allowance(userAddress, gameAddress);
  console.log(`Allowance: ${hre.ethers.formatEther(allowance)} ${symbol}`);
  
  console.log("\n=== Analysis ===");
  console.log(`Has enough balance: ${balance >= entryFee ? '✅ YES' : '❌ NO'}`);
  console.log(`Has enough allowance: ${allowance >= entryFee ? '✅ YES' : '❌ NO'}`);
  
  if (allowance < entryFee) {
    console.log("\n⚠️  You need to approve tokens before creating a game!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
