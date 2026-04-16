import { formatEther } from "ethers";
import { useEffect, useState } from "react";
import { MintStudio } from "./components/MintStudio";
import { ProposalBoard } from "./components/ProposalBoard";
import { StatCard } from "./components/StatCard";
import { TokenGallery } from "./components/TokenGallery";
import { SITE_CONFIG } from "./config/site";
import {
  configuredChainId,
  configuredChainName,
  configuredContractAddress,
  explorerAddressUrl,
  explorerTxUrl,
  getBrowserProvider,
  getContract,
  getReadOnlyProvider,
  isContractConfigured,
  shortenAddress
} from "./lib/contract";
import {
  buildMetadataDataUri,
  resolveMetadata,
  type MetadataForm,
  type TokenMetadata
} from "./lib/metadata";

type DashboardSnapshot = {
  saleActive: boolean;
  mintPriceWei: bigint;
  maxSupply: number;
  totalMinted: number;
  proposalCount: number;
  treasury: string;
};

type ProposalView = {
  id: number;
  proposer: string;
  title: string;
  description: string;
  deadline: number;
  yesVotes: number;
  noVotes: number;
  canceled: boolean;
  executed: boolean;
  state: string;
};

type TokenView = {
  id: number;
  tokenURI: string;
  metadata: TokenMetadata | null;
};

type StatusState = {
  tone: "info" | "success" | "error";
  message: string;
  txHash?: string;
};

const initialMintForm: MetadataForm = {
  name: "Odilbek Genesis #001",
  description:
    "A creator membership NFT that unlocks community voting, mint credibility, and future drop participation.",
  image: "",
  externalUrl: "https://github.com/muhamadovodilbek2-dot",
  attributesText: "Artist: Odilbek\nUtility: Governance\nEdition: Genesis",
  customUri: ""
};

const initialProposalForm = {
  title: "Feature the Genesis collection on the homepage",
  description:
    "Approve the first community-curated hero collection and prioritize it across the launch interface.",
  durationHours: "24"
};

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>({
    saleActive: false,
    mintPriceWei: 0n,
    maxSupply: 0,
    totalMinted: 0,
    proposalCount: 0,
    treasury: SITE_CONFIG.ownerWallet
  });
  const [proposals, setProposals] = useState<ProposalView[]>([]);
  const [ownedTokens, setOwnedTokens] = useState<TokenView[]>([]);
  const [eligibleVotesByProposal, setEligibleVotesByProposal] = useState<Record<number, number[]>>(
    {}
  );
  const [mintMode, setMintMode] = useState<"builder" | "custom">("builder");
  const [mintForm, setMintForm] = useState<MetadataForm>(initialMintForm);
  const [proposalForm, setProposalForm] = useState(initialProposalForm);
  const [status, setStatus] = useState<StatusState>({
    tone: isContractConfigured() ? "info" : "error",
    message: isContractConfigured()
      ? "Dashboard ready. Connect wallet to start minting and voting."
      : "Contract ABI yoki manzili hali sozlanmagan. Avval compile va deploy bosqichini yakunlang."
  });
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [busyProposalId, setBusyProposalId] = useState<number | null>(null);

  const contractReady = isContractConfigured();
  const wrongChain = chainId !== null && chainId !== configuredChainId;
  const previewUri = mintMode === "custom" ? mintForm.customUri.trim() : buildMetadataDataUri(mintForm);

  async function refreshWalletData(
    contract: Awaited<ReturnType<typeof getContract>>,
    address: string,
    loadedProposals: ProposalView[]
  ) {
    if (!address) {
      setOwnedTokens([]);
      setEligibleVotesByProposal({});
      return;
    }

    setIsLoadingTokens(true);

    try {
      const tokenIdsRaw = (await contract.walletOfOwner(address)) as bigint[];
      const tokenIds = tokenIdsRaw.map((value) => Number(value));

      const tokens = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const tokenURI = String(await contract.tokenURI(tokenId));
          let metadata: TokenMetadata | null = null;

          try {
            metadata = await resolveMetadata(tokenURI);
          } catch {
            metadata = null;
          }

          return {
            id: tokenId,
            tokenURI,
            metadata
          };
        })
      );

      const eligibilityEntries = await Promise.all(
        loadedProposals.map(async (proposal) => {
          if (proposal.state !== "Active") {
            return [proposal.id, []] as const;
          }

          const flags = await Promise.all(
            tokenIds.map(async (tokenId) =>
              Boolean(await contract.proposalTokenVoteUsed(proposal.id, tokenId))
            )
          );

          const eligibleTokenIds = tokenIds.filter((_, index) => !flags[index]);
          return [proposal.id, eligibleTokenIds] as const;
        })
      );

      setOwnedTokens(tokens);
      setEligibleVotesByProposal(Object.fromEntries(eligibilityEntries));
    } finally {
      setIsLoadingTokens(false);
    }
  }

  async function refreshDashboard(currentAddress = walletAddress) {
    if (!contractReady) {
      setIsLoadingDashboard(false);
      return;
    }

    try {
      setIsLoadingDashboard(true);
      const runner = getReadOnlyProvider();

      if (!runner) {
        setStatus({
          tone: "error",
          message: "Read-only provider topilmadi. RPC URL yoki wallet provider kiriting."
        });
        setIsLoadingDashboard(false);
        return;
      }

      const contract = getContract(runner);
      const [saleActive, mintPriceWei, maxSupply, totalMinted, proposalCount, treasury] =
        await Promise.all([
          contract.saleActive(),
          contract.mintPrice(),
          contract.maxSupply(),
          contract.totalMinted(),
          contract.proposalCount(),
          contract.treasury()
        ]);

      const totalProposals = Number(proposalCount);
      const proposalIds = Array.from({ length: totalProposals }, (_, index) => totalProposals - index);

      const loadedProposals = await Promise.all(
        proposalIds.map(async (proposalId) => {
          const [proposal, state] = await Promise.all([
            contract.getProposal(proposalId),
            contract.getProposalState(proposalId)
          ]);

          return {
            id: Number(proposal.id),
            proposer: String(proposal.proposer),
            title: String(proposal.title),
            description: String(proposal.description),
            deadline: Number(proposal.deadline),
            yesVotes: Number(proposal.yesVotes),
            noVotes: Number(proposal.noVotes),
            canceled: Boolean(proposal.canceled),
            executed: Boolean(proposal.executed),
            state: String(state)
          };
        })
      );

      setSnapshot({
        saleActive: Boolean(saleActive),
        mintPriceWei: mintPriceWei as bigint,
        maxSupply: Number(maxSupply),
        totalMinted: Number(totalMinted),
        proposalCount: totalProposals,
        treasury: String(treasury)
      });
      setProposals(loadedProposals);

      await refreshWalletData(contract, currentAddress, loadedProposals);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dashboard loading failed";
      setStatus({
        tone: "error",
        message
      });
    } finally {
      setIsLoadingDashboard(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      if (!window.ethereum) {
        await refreshDashboard("");
        return;
      }

      try {
        const browserProvider = getBrowserProvider();
        const [network, accounts] = await Promise.all([
          browserProvider.getNetwork(),
          browserProvider.send("eth_accounts", [])
        ]);

        if (ignore) {
          return;
        }

        setChainId(Number(network.chainId));

        const addressList = accounts as string[];
        if (addressList[0]) {
          setWalletAddress(addressList[0]);
        } else {
          await refreshDashboard("");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Wallet bootstrap failed";
        setStatus({
          tone: "error",
          message
        });
      }
    }

    void bootstrap();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    void refreshDashboard(walletAddress);
  }, [walletAddress, chainId]);

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accountsValue: unknown) => {
      const accounts = accountsValue as string[];
      setWalletAddress(accounts[0] || "");
    };

    const handleChainChanged = (nextChainId: unknown) => {
      setChainId(Number(nextChainId as string));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  async function connectWallet() {
    try {
      const browserProvider = getBrowserProvider();
      const accounts = (await browserProvider.send("eth_requestAccounts", [])) as string[];
      const network = await browserProvider.getNetwork();

      setWalletAddress(accounts[0] || "");
      setChainId(Number(network.chainId));
      setStatus({
        tone: "success",
        message: "Wallet connected successfully."
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet connection failed";
      setStatus({
        tone: "error",
        message
      });
    }
  }

  async function switchToConfiguredChain() {
    if (!window.ethereum) {
      setStatus({
        tone: "error",
        message: "MetaMask topilmadi. To'g'ri chain’ga o'tish uchun wallet kerak."
      });
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${configuredChainId.toString(16)}` }]
      });
      setStatus({
        tone: "success",
        message: `${configuredChainName} network tanlandi.`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network switch failed";
      setStatus({
        tone: "error",
        message
      });
    }
  }

  async function getSignerContract() {
    const browserProvider = getBrowserProvider();
    const signer = await browserProvider.getSigner();

    return getContract(signer);
  }

  function updateMintForm(field: keyof MetadataForm, value: string) {
    setMintForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateProposalForm(field: keyof typeof initialProposalForm, value: string) {
    setProposalForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleMint() {
    if (!walletAddress) {
      setStatus({
        tone: "error",
        message: "Mint qilish uchun avval wallet ulang."
      });
      return;
    }

    if (wrongChain) {
      setStatus({
        tone: "error",
        message: `Wallet ${configuredChainName} chain’ida bo'lishi kerak.`
      });
      return;
    }

    if (mintMode === "builder") {
      if (!mintForm.name.trim() || !mintForm.description.trim() || !mintForm.image.trim()) {
        setStatus({
          tone: "error",
          message: "Builder mode uchun name, description va image URL majburiy."
        });
        return;
      }
    } else if (!mintForm.customUri.trim()) {
      setStatus({
        tone: "error",
        message: "Custom URI mode uchun tayyor metadata URI kiriting."
      });
      return;
    }

    try {
      setIsMinting(true);
      const contract = await getSignerContract();
      const tokenURI = mintMode === "custom" ? mintForm.customUri.trim() : previewUri;
      const tx = await contract.mint(tokenURI, {
        value: snapshot.mintPriceWei
      });

      await tx.wait();

      setStatus({
        tone: "success",
        message: "NFT muvaffaqiyatli mint qilindi.",
        txHash: tx.hash
      });

      await refreshDashboard(walletAddress);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mint failed";
      setStatus({
        tone: "error",
        message
      });
    } finally {
      setIsMinting(false);
    }
  }

  async function handleCreateProposal() {
    if (!walletAddress) {
      setStatus({
        tone: "error",
        message: "Proposal yuborish uchun wallet ulanishi kerak."
      });
      return;
    }

    if (wrongChain) {
      setStatus({
        tone: "error",
        message: `Proposal yaratish uchun ${configuredChainName} chain’iga o'ting.`
      });
      return;
    }

    if (!proposalForm.title.trim() || !proposalForm.description.trim()) {
      setStatus({
        tone: "error",
        message: "Proposal title va description kiritilishi kerak."
      });
      return;
    }

    try {
      setIsCreatingProposal(true);
      const contract = await getSignerContract();
      const tx = await contract.createProposal(
        proposalForm.title.trim(),
        proposalForm.description.trim(),
        Number(proposalForm.durationHours)
      );

      await tx.wait();

      setStatus({
        tone: "success",
        message: "Proposal chain’ga joylandi.",
        txHash: tx.hash
      });

      await refreshDashboard(walletAddress);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Proposal creation failed";
      setStatus({
        tone: "error",
        message
      });
    } finally {
      setIsCreatingProposal(false);
    }
  }

  async function handleVote(proposalId: number, support: boolean) {
    const eligibleTokenIds = eligibleVotesByProposal[proposalId] || [];

    if (eligibleTokenIds.length === 0) {
      setStatus({
        tone: "error",
        message: "Bu proposal uchun ovoz beradigan bo'sh token topilmadi."
      });
      return;
    }

    try {
      setBusyProposalId(proposalId);
      const contract = await getSignerContract();
      const tx = await contract.castVote(proposalId, eligibleTokenIds, support);

      await tx.wait();

      setStatus({
        tone: "success",
        message: support ? "Yes vote yuborildi." : "No vote yuborildi.",
        txHash: tx.hash
      });

      await refreshDashboard(walletAddress);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vote failed";
      setStatus({
        tone: "error",
        message
      });
    } finally {
      setBusyProposalId(null);
    }
  }

  async function handleCancelProposal(proposalId: number) {
    try {
      setBusyProposalId(proposalId);
      const contract = await getSignerContract();
      const tx = await contract.cancelProposal(proposalId);

      await tx.wait();

      setStatus({
        tone: "success",
        message: `Proposal #${proposalId} bekor qilindi.`,
        txHash: tx.hash
      });

      await refreshDashboard(walletAddress);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cancel failed";
      setStatus({
        tone: "error",
        message
      });
    } finally {
      setBusyProposalId(null);
    }
  }

  async function handleExecuteProposal(proposalId: number) {
    try {
      setBusyProposalId(proposalId);
      const contract = await getSignerContract();
      const tx = await contract.executeProposal(proposalId);

      await tx.wait();

      setStatus({
        tone: "success",
        message: `Proposal #${proposalId} execute qilindi.`,
        txHash: tx.hash
      });

      await refreshDashboard(walletAddress);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Execute failed";
      setStatus({
        tone: "error",
        message
      });
    } finally {
      setBusyProposalId(null);
    }
  }

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb--sun" />
      <div className="bg-orb bg-orb--ocean" />

      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-lockup__mark">OD</span>
          <div>
            <strong>{SITE_CONFIG.appName}</strong>
            <span>{SITE_CONFIG.collectionSymbol} testnet launch dashboard</span>
          </div>
        </div>

        <div className="topbar__actions">
          <a href={explorerAddressUrl(SITE_CONFIG.ownerWallet)} target="_blank" rel="noreferrer">
            Treasury
          </a>
          {wrongChain ? (
            <button type="button" className="topbar__button topbar__button--ghost" onClick={switchToConfiguredChain}>
              Switch to {configuredChainName}
            </button>
          ) : null}
          <button type="button" className="topbar__button" onClick={connectWallet}>
            {walletAddress ? shortenAddress(walletAddress) : "Connect Wallet"}
          </button>
        </div>
      </header>

      <main className="page-content">
        <section className="hero">
          <div className="hero__copy">
            <span className="eyebrow">Professional NFT + governance dApp</span>
            <h1>{SITE_CONFIG.headline}</h1>
            <p>{SITE_CONFIG.description}</p>

            <div className="hero__meta">
              <span>Chain: {configuredChainName}</span>
              <span>Owner: {SITE_CONFIG.ownerName}</span>
              <span>Wallet: {shortenAddress(SITE_CONFIG.ownerWallet)}</span>
            </div>

            <div className="hero__chips">
              <span>ERC-721</span>
              <span>Holder voting</span>
              <span>Metadata builder</span>
              <span>Testnet-ready</span>
            </div>
          </div>

          <aside className="hero-card">
            <span className="eyebrow">Launch Summary</span>
            <h2>From mint to governance in one flow</h2>
            <ul className="hero-card__list">
              <li>Mint NFTs with direct metadata data URIs or IPFS-ready token URIs.</li>
              <li>Create holder proposals and cast token-weighted votes.</li>
              <li>Ship a polished frontend tied to the deployed contract address.</li>
            </ul>
            <div className="hero-card__footer">
              <span>{contractReady ? "Contract configured" : "Deploy contract to finish setup"}</span>
              <strong>{configuredContractAddress ? shortenAddress(configuredContractAddress) : "Pending address"}</strong>
            </div>
          </aside>
        </section>

        <section className="stats-grid">
          <StatCard
            label="Supply"
            value={
              isLoadingDashboard ? "..." : `${snapshot.totalMinted}/${snapshot.maxSupply || "--"}`
            }
            detail="Live minted supply on the collection"
            accent="sun"
          />
          <StatCard
            label="Mint Price"
            value={snapshot.mintPriceWei ? `${formatEther(snapshot.mintPriceWei)} ETH` : "--"}
            detail="Exact price enforced by the smart contract"
            accent="ocean"
          />
          <StatCard
            label="Proposals"
            value={String(snapshot.proposalCount)}
            detail="Community governance items created by holders"
            accent="ink"
          />
          <StatCard
            label="Voting Power"
            value={String(ownedTokens.length)}
            detail="NFTs currently available in your connected wallet"
            accent="sun"
          />
        </section>

        <section className={`status-banner status-banner--${status.tone}`}>
          <div>
            <strong>{status.tone === "error" ? "Attention" : status.tone === "success" ? "Success" : "Info"}</strong>
            <p>{status.message}</p>
          </div>
          {status.txHash ? (
            <a href={explorerTxUrl(status.txHash)} target="_blank" rel="noreferrer">
              View tx
            </a>
          ) : null}
        </section>

        <section className="workspace-grid">
          <MintStudio
            connected={Boolean(walletAddress)}
            saleActive={snapshot.saleActive}
            mintPrice={snapshot.mintPriceWei ? `${formatEther(snapshot.mintPriceWei)} ETH` : "--"}
            mintMode={mintMode}
            mintForm={mintForm}
            previewUri={previewUri}
            submitting={isMinting}
            onMintModeChange={setMintMode}
            onMintFormChange={updateMintForm}
            onSubmit={handleMint}
          />

          <aside className="panel panel--compact">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Operations</span>
                <h2>Launch control panel</h2>
              </div>
            </div>

            <div className="info-stack">
              <div className="info-row">
                <span>Expected network</span>
                <strong>{configuredChainName}</strong>
              </div>
              <div className="info-row">
                <span>Connected wallet</span>
                <strong>{walletAddress ? shortenAddress(walletAddress) : "Not connected"}</strong>
              </div>
              <div className="info-row">
                <span>Treasury wallet</span>
                <strong>{shortenAddress(snapshot.treasury)}</strong>
              </div>
              <div className="info-row">
                <span>Contract readiness</span>
                <strong>{contractReady ? "Ready" : "Pending deploy"}</strong>
              </div>
            </div>

            <div className="checklist">
              <h3>Launch checklist</h3>
              <ul>
                <li>Deploy contract and sync ABI to frontend</li>
                <li>Fill `VITE_CONTRACT_ADDRESS` after testnet deployment</li>
                <li>Mint sample NFTs and open the demo gallery</li>
                <li>Create a governance proposal for the presentation flow</li>
              </ul>
            </div>
          </aside>
        </section>

        <ProposalBoard
          proposals={proposals}
          proposalForm={proposalForm}
          walletAddress={walletAddress}
          ownerWallet={SITE_CONFIG.ownerWallet}
          eligibleVotesByProposal={eligibleVotesByProposal}
          submittingProposal={isCreatingProposal}
          busyProposalId={busyProposalId}
          onProposalFormChange={updateProposalForm}
          onCreateProposal={handleCreateProposal}
          onVote={handleVote}
          onCancel={handleCancelProposal}
          onExecute={handleExecuteProposal}
        />

        <TokenGallery tokens={ownedTokens} loading={isLoadingTokens} />
      </main>
    </div>
  );
}

export default App;
