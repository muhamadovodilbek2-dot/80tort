const fs = require("fs");
const path = require("path");

const artifactPath = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "OdilbekCollection.sol",
  "OdilbekCollection.json"
);

if (!fs.existsSync(artifactPath)) {
  console.error("Artifact not found. Run `npm run compile` in the contracts folder first.");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const targetPath = path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "src",
  "lib",
  "odilbek-collection.abi.json"
);

fs.writeFileSync(targetPath, JSON.stringify(artifact.abi, null, 2));

console.log(`ABI exported to ${targetPath}`);
