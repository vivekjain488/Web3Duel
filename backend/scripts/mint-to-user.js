const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x2139A6A365B7A716ae219Cbd7dD19fd286d3A2c4";
  const userAddress = "0x704b903d168Aa907262520E0A0F8C065d7941FD4"; // Your wallet
  
  const Token = await hre.ethers.getContractFactory("Web3DuelToken");
  const token = Token.attach(tokenAddress);
  
  console.log("Minting 1000 tokens to user:", userAddress);
  
  // Mint 1000 tokens to user
  const mintAmount = hre.ethers.parseEther("1000");
  const tx = await token.mint(userAddress, mintAmount);
  await tx.wait();
  
  console.log("Transaction hash:", tx.hash);
  
  // Check new balance
  const balance = await token.balanceOf(userAddress);
  console.log("New balance:", hre.ethers.formatEther(balance), "W3D");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
