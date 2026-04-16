// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract OdilbekCollection is
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable,
    Pausable,
    ReentrancyGuard
{
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint64 createdAt;
        uint64 deadline;
        uint32 yesVotes;
        uint32 noVotes;
        bool canceled;
        bool executed;
    }

    uint256 public mintPrice;
    uint256 public maxSupply;
    uint256 public maxMintPerWallet;
    uint256 public totalMinted;
    uint64 public minProposalDuration;
    uint64 public maxProposalDuration;
    bool public saleActive;

    string private contractMetadataURI;
    address payable public treasury;

    uint256 public proposalCount;

    mapping(address => uint256) public mintedPerWallet;
    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => mapping(uint256 => bool)) public proposalTokenVoteUsed;

    event Minted(address indexed minter, uint256 indexed tokenId, string tokenURI);
    event SaleStateUpdated(bool indexed isActive);
    event TreasuryUpdated(address indexed treasury);
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        uint64 deadline,
        string title
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);

    modifier onlyHolder() {
        require(balanceOf(msg.sender) > 0, "Holder access only");
        _;
    }

    constructor(
        address initialOwner,
        address payable initialTreasury,
        string memory initialContractMetadataURI,
        uint256 initialMintPrice,
        uint256 initialMaxSupply,
        uint256 initialMaxMintPerWallet
    ) ERC721("Odilbek Creator Editions", "ODNFT") Ownable() {
        require(initialTreasury != address(0), "Treasury required");
        require(initialOwner != address(0), "Owner required");
        require(initialMaxSupply > 0, "Max supply required");
        require(initialMaxMintPerWallet > 0, "Wallet limit required");

        transferOwnership(initialOwner);
        treasury = initialTreasury;
        contractMetadataURI = initialContractMetadataURI;
        mintPrice = initialMintPrice;
        maxSupply = initialMaxSupply;
        maxMintPerWallet = initialMaxMintPerWallet;
        minProposalDuration = 6 hours;
        maxProposalDuration = 30 days;
        saleActive = true;
    }

    function mint(string calldata metadataURI)
        external
        payable
        whenNotPaused
        nonReentrant
        returns (uint256 tokenId)
    {
        require(saleActive, "Sale is inactive");
        require(msg.value == mintPrice, "Incorrect mint price");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(totalMinted < maxSupply, "Max supply reached");
        require(
            mintedPerWallet[msg.sender] + 1 <= maxMintPerWallet,
            "Wallet mint limit reached"
        );

        tokenId = _mintToken(msg.sender, metadataURI);
    }

    function ownerMint(address recipient, string calldata metadataURI)
        external
        onlyOwner
        whenNotPaused
        returns (uint256 tokenId)
    {
        require(recipient != address(0), "Recipient required");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(totalMinted < maxSupply, "Max supply reached");

        tokenId = _mintToken(recipient, metadataURI);
    }

    function batchMint(string[] calldata metadataURIs)
        external
        payable
        whenNotPaused
        nonReentrant
        returns (uint256[] memory mintedTokenIds)
    {
        uint256 quantity = metadataURIs.length;
        require(saleActive, "Sale is inactive");
        require(quantity > 0 && quantity <= 5, "Batch mint range is 1-5");
        require(totalMinted + quantity <= maxSupply, "Max supply reached");
        require(
            mintedPerWallet[msg.sender] + quantity <= maxMintPerWallet,
            "Wallet mint limit reached"
        );
        require(msg.value == mintPrice * quantity, "Incorrect batch price");

        mintedTokenIds = new uint256[](quantity);

        for (uint256 i = 0; i < quantity; i++) {
            require(bytes(metadataURIs[i]).length > 0, "Metadata URI required");
            mintedTokenIds[i] = _mintToken(msg.sender, metadataURIs[i]);
        }
    }

    function createProposal(
        string calldata title,
        string calldata description,
        uint64 durationInHours
    ) external onlyHolder whenNotPaused returns (uint256 proposalId) {
        require(bytes(title).length >= 4, "Title too short");
        require(bytes(description).length >= 10, "Description too short");

        uint64 duration = durationInHours * uint64(1 hours);
        require(
            duration >= minProposalDuration && duration <= maxProposalDuration,
            "Proposal duration out of range"
        );

        proposalId = ++proposalCount;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            createdAt: uint64(block.timestamp),
            deadline: uint64(block.timestamp + duration),
            yesVotes: 0,
            noVotes: 0,
            canceled: false,
            executed: false
        });

        emit ProposalCreated(proposalId, msg.sender, uint64(block.timestamp + duration), title);
    }

    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = _getProposalOrRevert(proposalId);
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal already canceled");
        require(
            proposal.proposer == msg.sender || owner() == msg.sender,
            "Only proposer or owner"
        );
        require(proposal.yesVotes + proposal.noVotes == 0, "Proposal already voted");

        proposal.canceled = true;

        emit ProposalCanceled(proposalId);
    }

    function castVote(
        uint256 proposalId,
        uint256[] calldata tokenIds,
        bool support
    ) external onlyHolder whenNotPaused {
        Proposal storage proposal = _getProposalOrRevert(proposalId);
        uint256 voteWeight = tokenIds.length;

        require(voteWeight > 0, "At least one token required");
        require(!proposal.canceled, "Proposal canceled");
        require(!proposal.executed, "Proposal executed");
        require(block.timestamp < proposal.deadline, "Voting period ended");

        for (uint256 i = 0; i < voteWeight; i++) {
            uint256 tokenId = tokenIds[i];
            require(ownerOf(tokenId) == msg.sender, "Only token owner can vote");
            require(!proposalTokenVoteUsed[proposalId][tokenId], "Token already used");

            proposalTokenVoteUsed[proposalId][tokenId] = true;
        }

        if (support) {
            proposal.yesVotes += uint32(voteWeight);
        } else {
            proposal.noVotes += uint32(voteWeight);
        }

        emit VoteCast(proposalId, msg.sender, support, voteWeight);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = _getProposalOrRevert(proposalId);
        require(!proposal.canceled, "Proposal canceled");
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp >= proposal.deadline, "Voting still active");

        proposal.executed = true;

        emit ProposalExecuted(proposalId, proposal.yesVotes > proposal.noVotes);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return _getProposalOrRevert(proposalId);
    }

    function getProposalState(uint256 proposalId) external view returns (string memory) {
        Proposal storage proposal = _getProposalOrRevert(proposalId);

        if (proposal.canceled) {
            return "Canceled";
        }

        if (proposal.executed) {
            return proposal.yesVotes > proposal.noVotes ? "Executed - Passed" : "Executed - Rejected";
        }

        if (block.timestamp < proposal.deadline) {
            return "Active";
        }

        return proposal.yesVotes > proposal.noVotes ? "Succeeded" : "Defeated";
    }

    function walletOfOwner(address account) external view returns (uint256[] memory tokenIds) {
        uint256 count = balanceOf(account);
        tokenIds = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(account, i);
        }
    }

    function contractURI() external view returns (string memory) {
        return contractMetadataURI;
    }

    function setSaleActive(bool isActive) external onlyOwner {
        saleActive = isActive;
        emit SaleStateUpdated(isActive);
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= totalMinted, "Below minted supply");
        maxSupply = newMaxSupply;
    }

    function setMaxMintPerWallet(uint256 newLimit) external onlyOwner {
        require(newLimit > 0, "Limit required");
        maxMintPerWallet = newLimit;
    }

    function setProposalDurationBounds(uint64 minDuration, uint64 maxDuration) external onlyOwner {
        require(minDuration > 0, "Min duration required");
        require(maxDuration >= minDuration, "Invalid duration range");
        minProposalDuration = minDuration;
        maxProposalDuration = maxDuration;
    }

    function setTreasury(address payable newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Treasury required");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function setContractMetadataURI(string calldata newContractMetadataURI) external onlyOwner {
        require(bytes(newContractMetadataURI).length > 0, "Metadata URI required");
        contractMetadataURI = newContractMetadataURI;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = treasury.call{value: balance}("");
        require(success, "Withdraw failed");
    }

    function _mintToken(address recipient, string memory metadataURI)
        internal
        returns (uint256 tokenId)
    {
        unchecked {
            totalMinted += 1;
            mintedPerWallet[recipient] += 1;
        }

        tokenId = totalMinted;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit Minted(recipient, tokenId, metadataURI);
    }

    function _getProposalOrRevert(uint256 proposalId)
        internal
        view
        returns (Proposal storage proposal)
    {
        proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal not found");
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
