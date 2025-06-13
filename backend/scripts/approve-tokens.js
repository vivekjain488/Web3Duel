const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x2139A6A365B7A716ae219Cbd7dD19fd286d3A2c4";
  const gameAddress = "0xf47cB5cFB4a6E696C91295a475945C694634B2a5";
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Approving tokens from:", signer.address);
  
  const Token = await hre.ethers.getContractFactory("Web3DuelToken");
  const token = Token.attach(tokenAddress);
  
  // Approve a large amount (1000 tokens) so user doesn't need to approve again
  const approveAmount = hre.ethers.parseEther("1000");
  
  console.log(`Approving ${hre.ethers.formatEther(approveAmount)} tokens for game contract...`);
  
  const tx = await token.approve(gameAddress, approveAmount);
  console.log("Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Tokens approved successfully!");
  
  // Check new allowance
  const allowance = await token.allowance(signer.address, gameAddress);
  console.log(`New allowance: ${hre.ethers.formatEther(allowance)} W3D`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
