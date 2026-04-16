# AzizbekCE NFT Studio Architecture

## 1. Maqsad

`AzizbekCE NFT Studio` bitta professional dApp ichida quyidagi oqimni birlashtiradi:

- NFT yaratish
- metadata tayyorlash
- testnetga deploy qilish
- holder-only governance
- wallet-connected frontend demo

## 2. High-Level Arxitektura

```text
User Wallet (MetaMask)
        |
        v
React Frontend (Vite + ethers)
        |
        v
AzizbekCECollection.sol
        |
        +--> ERC-721 minting
        +--> Proposal creation
        +--> Token-based voting
        +--> Treasury management
```

## 3. Smart-kontrakt modullari

Asosiy kontrakt: [AzizbekCECollection.sol](/c:/Users/User/CE/4-topshiriq/contracts/contracts/AzizbekCECollection.sol)

### NFT Layer

- `ERC721Enumerable`: wallet ichidagi tokenlarni ko'rish uchun
- `ERC721URIStorage`: har bir token uchun alohida metadata URI saqlash uchun
- `mint`, `batchMint`, `ownerMint`: mint oqimlari

### Governance Layer

- `Proposal` struct: title, description, proposer, deadline, vote natijalari
- `createProposal`: holder-only proposal yaratish
- `castVote`: token IDs bo'yicha vote
- `proposalTokenVoteUsed`: bir token bir proposalda qayta ishlatilmasligi uchun himoya
- `executeProposal`: deadline’dan keyin natijani finalize qilish
- `cancelProposal`: zero-vote holatda proposalni bekor qilish

### Admin Layer

- `pause`, `unpause`
- `setSaleActive`
- `setMintPrice`
- `setMaxSupply`
- `setMaxMintPerWallet`
- `setTreasury`
- `withdraw`

## 4. Xavfsizlik qarorlari

- `ReentrancyGuard`: mint va withdraw uchun
- `Pausable`: favqulodda to'xtatish
- `onlyOwner`: operatsion boshqaruv funksiyalari
- `onlyHolder`: governance entry guard
- token-level vote tracking: transfer orqali double voting riskini kamaytiradi

## 5. Frontend Arxitekturasi

Asosiy UI: [frontend/src/App.tsx](/c:/Users/User/CE/4-topshiriq/frontend/src/App.tsx)

### UI bloklari

- Hero + launch summary
- Live stats cards
- Mint Studio
- Governance Board
- Collector Gallery

### Web3 integratsiya

- `ethers.BrowserProvider` orqali wallet connect
- `getContract(...)` helper orqali contract runner yaratish
- ABI `contracts/scripts/export-abi.js` orqali frontendga sync qilinadi
- Deploy bo'lgach `frontend/src/config/deployment.json` yangilanadi

## 6. Metadata Strategiyasi

Loyiha ikki xil metadata oqimini qo'llab-quvvatlaydi:

- `data:application/json;base64,...`
  Bu demo va tezkor testlar uchun ideal.
- `ipfs://...`
  Production web3 storage uchun tavsiya etiladi.

Shu yondashuv foydalanuvchiga API key yoki qo'shimcha backend bo'lmasa ham NFT mint qilish imkonini beradi.

## 7. Deploy Pipeline

### Contract deploy

1. `.env` ga RPC URL va funded deployer private key yoziladi
2. `npm run contracts:deploy:sepolia`
3. deploy ma'lumoti `contracts/deployments/sepolia.json` ga yoziladi
4. frontend config avtomatik yangilanadi

### Frontend publish

1. `npm run frontend:build`
2. build natijasi `frontend/dist`
3. Vercel, Netlify yoki GitHub Pages’ga chiqarish mumkin

## 8. Kengaytirish yo'nalishlari

- Pinata yoki NFT.Storage bilan secure upload backend
- OpenZeppelin `ERC721Votes` bilan snapshot voting
- on-chain royalty support
- collection reveal mechanics
- admin analytics dashboard
