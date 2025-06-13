const fs = require('fs');
const path = require('path');

function listContracts() {
  console.log("🔍 Available Contracts:");
  console.log("======================");
  
  const artifactsDir = path.join(__dirname, '../artifacts/contracts');
  
  if (fs.existsSync(artifactsDir)) {
    const contractDirs = fs.readdirSync(artifactsDir);
    
    contractDirs.forEach(dir => {
      const contractPath = path.join(artifactsDir, dir);
      if (fs.statSync(contractPath).isDirectory()) {
        console.log(`📁 ${dir}/`);
        const files = fs.readdirSync(contractPath);
        files.forEach(file => {
          if (file.endsWith('.json')) {
            const contractName = file.replace('.json', '');
            console.log(`  ✅ ${contractName}`);
          }
        });
      }
    });
  } else {
    console.log("❌ Artifacts directory not found. Run 'npx hardhat compile' first.");
  }
  
  console.log("\n📂 Source contracts:");
  const contractsDir = path.join(__dirname, '../contracts');
  const sourceFiles = fs.readdirSync(contractsDir);
  sourceFiles.forEach(file => {
    if (file.endsWith('.sol')) {
      console.log(`  📄 ${file}`);
    }
  });
}

listContracts();
