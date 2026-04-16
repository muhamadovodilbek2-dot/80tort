import { BrowserProvider, Contract, JsonRpcProvider, type ContractRunner } from "ethers";
import deployment from "../config/deployment.json";
import abi from "./azizbek-ce-collection.abi.json";

export const configuredContractAddress =
  import.meta.env.VITE_CONTRACT_ADDRESS || deployment.contractAddress || "";
export const configuredChainId = Number(
  import.meta.env.VITE_CHAIN_ID || deployment.chainId || 11155111
);
export const configuredChainName =
  import.meta.env.VITE_CHAIN_NAME || deployment.network || "Sepolia";
export const configuredRpcUrl = import.meta.env.VITE_RPC_URL || "";
export const configuredExplorer =
  import.meta.env.VITE_BLOCK_EXPLORER || "https://sepolia.etherscan.io";
export const contractAbi = abi;

export function isContractConfigured() {
  return Boolean(configuredContractAddress && contractAbi.length);
}

export function getBrowserProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask topilmadi. Iltimos, brauzer extension o'rnating.");
  }

  return new BrowserProvider(window.ethereum);
}

export function getReadOnlyProvider() {
  if (configuredRpcUrl) {
    return new JsonRpcProvider(configuredRpcUrl);
  }

  if (window.ethereum) {
    return new BrowserProvider(window.ethereum);
  }

  return null;
}

export function getContract(providerOrSigner: ContractRunner) {
  if (!isContractConfigured()) {
    throw new Error("Kontrakt manzili yoki ABI hali sozlanmagan.");
  }

  return new Contract(configuredContractAddress, contractAbi, providerOrSigner);
}

export function shortenAddress(address: string, prefix = 6, suffix = 4) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
}

export function ipfsToHttp(uri: string) {
  if (!uri.startsWith("ipfs://")) {
    return uri;
  }

  return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
}

export function normalizeUri(uri: string) {
  if (uri.startsWith("ipfs://")) {
    return ipfsToHttp(uri);
  }

  return uri;
}

export function explorerAddressUrl(address: string) {
  return `${configuredExplorer}/address/${address}`;
}

export function explorerTxUrl(txHash: string) {
  return `${configuredExplorer}/tx/${txHash}`;
}

export function explorerTokenUrl(contractAddress: string, tokenId: number) {
  return `${configuredExplorer}/token/${contractAddress}?a=${tokenId}`;
}
