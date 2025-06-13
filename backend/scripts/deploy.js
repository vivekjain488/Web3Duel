const hre = require("hardhat");

async function main() {
  const Coin = await hre.ethers.getContractFactory("Web3DuelCoin");
  const coin = await Coin.deploy();
  await coin.deployed();
  console.log("Coin deployed to:", coin.address);

  const Game = await hre.ethers.getContractFactory("Web3DuelGame");
  const game = await Game.deploy(coin.address, hre.ethers.parseEther("100"));
  await game.deployed();
  console.log("Game deployed to:", game.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});