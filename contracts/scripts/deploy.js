const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const owner = process.env.CONTRACT_OWNER || "0xA89c45b89b0558e866c5B983E27a61Df6b0FA968";
  const treasury = process.env.TREASURY_WALLET || owner;
  const contractMetadataURI =
    process.env.CONTRACT_METADATA_URI || "ipfs://YOUR_COLLECTION_METADATA.json";
  const mintPrice = hre.ethers.parseEther(process.env.MINT_PRICE_ETH || "0.01");
  const maxSupply = Number(process.env.MAX_SUPPLY || 500);
  const maxMintPerWallet = Number(process.env.MAX_MINT_PER_WALLET || 5);

  const factory = await hre.ethers.getContractFactory("AzizbekCECollection");
  const contract = await factory.deploy(
    owner,
    treasury,
    contractMetadataURI,
    mintPrice,
    maxSupply,
    maxMintPerWallet
  );

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployment = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || null,
    contractAddress: address,
    owner,
    treasury,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  const frontendConfigPath = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "src",
    "config",
    "deployment.json"
  );
  fs.writeFileSync(frontendConfigPath, JSON.stringify(deployment, null, 2));

  console.log("Deployment complete");
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
