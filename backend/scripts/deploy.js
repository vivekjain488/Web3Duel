const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy Web3DuelToken
  const Web3DuelToken = await hre.ethers.getContractFactory("Web3DuelToken");
  const token = await Web3DuelToken.deploy();
  await token.waitForDeployment();
  
  const tokenAddress = await token.getAddress();
  console.log("Web3DuelToken deployed to:", tokenAddress);

  // Deploy Web3DuelGame
  const Web3DuelGame = await hre.ethers.getContractFactory("Web3DuelGame");
  const game = await Web3DuelGame.deploy(tokenAddress, hre.ethers.parseEther("1"));
  await game.waitForDeployment();
  
  const gameAddress = await game.getAddress();
  console.log("Web3DuelGame deployed to:", gameAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("Token Contract:", tokenAddress);
  console.log("Game Contract:", gameAddress);
  console.log("Network:", hre.network.name);
  console.log("Entry Fee: 1 ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });