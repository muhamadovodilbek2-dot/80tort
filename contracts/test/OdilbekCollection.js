const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("OdilbekCollection", function () {
  async function deployFixture() {
    const [owner, treasury, collector, voter] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("OdilbekCollection");
    const contract = await factory.deploy(
      owner.address,
      treasury.address,
      "ipfs://collection.json",
      ethers.parseEther("0.01"),
      100,
      5
    );

    return { contract, owner, treasury, collector, voter };
  }

  it("mints an NFT and stores the metadata URI", async function () {
    const { contract, collector } = await loadFixture(deployFixture);
    const metadataURI = "ipfs://metadata-1.json";

    await expect(
      contract.connect(collector).mint(metadataURI, {
        value: ethers.parseEther("0.01")
      })
    )
      .to.emit(contract, "Minted")
      .withArgs(collector.address, 1, metadataURI);

    expect(await contract.ownerOf(1)).to.equal(collector.address);
    expect(await contract.tokenURI(1)).to.equal(metadataURI);
    expect(await contract.totalMinted()).to.equal(1);
  });

  it("supports batch minting with per-wallet enforcement", async function () {
    const { contract, collector } = await loadFixture(deployFixture);

    await contract.connect(collector).batchMint(
      ["ipfs://1.json", "ipfs://2.json", "ipfs://3.json"],
      {
        value: ethers.parseEther("0.03")
      }
    );

    expect(await contract.totalMinted()).to.equal(3);
    expect(await contract.balanceOf(collector.address)).to.equal(3);
    expect(await contract.mintedPerWallet(collector.address)).to.equal(3);
  });

  it("creates proposals and allows token-based voting without token reuse", async function () {
    const { contract, collector } = await loadFixture(deployFixture);

    await contract.connect(collector).batchMint(
      ["ipfs://1.json", "ipfs://2.json"],
      {
        value: ethers.parseEther("0.02")
      }
    );

    await contract
      .connect(collector)
      .createProposal(
        "Feature the Genesis Drop",
        "Promote the first two minted NFTs on the public gallery for the next campaign.",
        24
      );

    await contract.connect(collector).castVote(1, [1, 2], true);

    const proposal = await contract.getProposal(1);
    expect(proposal.yesVotes).to.equal(2);
    expect(proposal.noVotes).to.equal(0);

    await expect(contract.connect(collector).castVote(1, [1], false)).to.be.revertedWith(
      "Token already used"
    );
  });

  it("cancels a proposal before votes are cast", async function () {
    const { contract, collector } = await loadFixture(deployFixture);

    await contract.connect(collector).mint("ipfs://1.json", {
      value: ethers.parseEther("0.01")
    });

    await contract
      .connect(collector)
      .createProposal(
        "Archive Week Two",
        "Remove week-two assets from rotation before community voting begins.",
        24
      );

    await expect(contract.connect(collector).cancelProposal(1))
      .to.emit(contract, "ProposalCanceled")
      .withArgs(1);

    expect(await contract.getProposalState(1)).to.equal("Canceled");
  });

  it("executes a proposal after the deadline", async function () {
    const { contract, collector } = await loadFixture(deployFixture);

    await contract.connect(collector).mint("ipfs://1.json", {
      value: ethers.parseEther("0.01")
    });

    await contract
      .connect(collector)
      .createProposal(
        "Launch Social Campaign",
        "Approve a social launch campaign for the next collection announcement.",
        6
      );

    await contract.connect(collector).castVote(1, [1], true);
    await time.increase(6 * 60 * 60 + 1);

    await expect(contract.executeProposal(1))
      .to.emit(contract, "ProposalExecuted")
      .withArgs(1, true);

    expect(await contract.getProposalState(1)).to.equal("Executed - Passed");
  });

  it("withdraws collected mint funds to the treasury wallet", async function () {
    const { contract, treasury, collector } = await loadFixture(deployFixture);

    await contract.connect(collector).mint("ipfs://1.json", {
      value: ethers.parseEther("0.01")
    });

    await expect(() => contract.withdraw()).to.changeEtherBalances(
      [contract, treasury],
      [ethers.parseEther("-0.01"), ethers.parseEther("0.01")]
    );
  });
});
