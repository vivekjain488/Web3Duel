const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x2139A6A365B7A716ae219Cbd7dD19fd286d3A2c4";
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Minting tokens to:", deployer.address);
  
  const Token = await hre.ethers.getContractFactory("Web3DuelToken");
  const token = Token.attach(tokenAddress);
  
  // Mint 1000 tokens to the deployer
  const mintAmount = hre.ethers.parseEther("1000");
  const tx = await token.mint(deployer.address, mintAmount);
  await tx.wait();
  
  console.log("Minted 1000 W3D tokens to:", deployer.address);
  
  // Check balance
  const balance = await token.balanceOf(deployer.address);
  console.log("Current balance:", hre.ethers.formatEther(balance), "W3D");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
