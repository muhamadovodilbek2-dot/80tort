# AzizbekCE NFT Studio

Professional darajadagi NFT minting va holder-governance dApp. Loyiha `AzizbekCE` brendi uchun tayyorlangan bo'lib, ERC-721 kolleksiya, token-based ovoz berish, metadata builder, testnet deploy skriptlari va polished frontend interfeysni o'z ichiga oladi.

## Asosiy imkoniyatlar

- ERC-721 NFT kolleksiya yaratish va mint qilish
- `data:` metadata URI yoki `ipfs://...` URI bilan NFT chiqarish
- Holder-only proposal yaratish
- Token ID asosida vote qilish, ya'ni bir token bir proposalga faqat bir marta ovoz beradi
- Proposal cancel va execute oqimlari
- Treasury withdraw, sale toggle, pause, mint parametrlarini boshqarish
- React + TypeScript frontend orqali wallet ulanishi va live dashboard
- GitHub uchun tayyor loyiha struktura, README va demo slaydlar

## Tech Stack

- Smart contracts: Solidity, Hardhat, OpenZeppelin
- Frontend: React, Vite, TypeScript, ethers v6
- UX/UI: custom CSS system, responsive glassmorphism editorial layout
- Deployment: Sepolia yoki Polygon Amoy uchun env-driven skriptlar

## Loyiha strukturasi

```text
.
├── contracts
│   ├── contracts/AzizbekCECollection.sol
│   ├── scripts/deploy.js
│   ├── scripts/export-abi.js
│   └── test/AzizbekCECollection.js
├── docs
│   ├── architecture.md
│   └── demo-slides.md
├── frontend
│   └── src
└── README.md
```

## Smart-kontrakt arxitekturasi

Kontrakt [contracts/contracts/AzizbekCECollection.sol](/c:/Users/User/CE/4-topshiriq/contracts/contracts/AzizbekCECollection.sol) ichida yozilgan.

- `mint` va `batchMint`: foydalanuvchi NFT mint qiladi
- `ownerMint`: admin maxsus mint qiladi
- `createProposal`: NFT holder governance proposal yaratadi
- `castVote`: token ID ro'yxati bilan ovoz beradi
- `cancelProposal`: proposer yoki owner, agar hali vote bo'lmagan bo'lsa, proposalni bekor qiladi
- `executeProposal`: deadline tugagach natijani finalize qiladi
- `withdraw`, `pause`, `setSaleActive`, `setMintPrice`: operatsion boshqaruv

## Lokal ishga tushirish

### 1. Dependency o'rnatish

```bash
npm install
npm --prefix contracts install
npm --prefix frontend install
```

### 2. Smart-kontraktni compile va test qilish

```bash
npm run contracts:compile
npm run contracts:test
npm run contracts:export-abi
```

### 3. Frontendni ishga tushirish

`.env.example` fayldan nusxa olib kerakli qiymatlarni kiriting.

```bash
npm run frontend:dev
```

## Testnet deploy

`contracts/.env.example` asosida `contracts/.env` yarating:

```env
CONTRACT_OWNER=0xA89c45b89b0558e866c5B983E27a61Df6b0FA968
TREASURY_WALLET=0xA89c45b89b0558e866c5B983E27a61Df6b0FA968
CONTRACT_METADATA_URI=ipfs://YOUR_COLLECTION_METADATA.json
MINT_PRICE_ETH=0.01
MAX_SUPPLY=500
MAX_MINT_PER_WALLET=5
SEPOLIA_RPC_URL=YOUR_RPC_URL
DEPLOYER_PRIVATE_KEY=YOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

Keyin deploy qiling:

```bash
npm run contracts:deploy:sepolia
npm run contracts:export-abi
```

Deploy skripti `contracts/deployments/<network>.json` va `frontend/src/config/deployment.json` fayllarini yangilaydi.

## Frontend konfiguratsiyasi

`frontend/.env.example` asosida `frontend/.env` yarating:

```env
VITE_CONTRACT_ADDRESS=DEPLOY_QILINGAN_MANZIL
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia
VITE_RPC_URL=YOUR_SEPOLIA_RPC_URL
VITE_BLOCK_EXPLORER=https://sepolia.etherscan.io
```

## Demo ssenariysi

1. Wallet ulang
2. Builder orqali metadata kiriting va NFT mint qiling
3. Yangi proposal yarating
4. O'sha walletdagi tokenlar bilan `Vote yes` yoki `Vote no` bosing
5. Deadline tugagach proposalni execute qiling
6. Token gallery va explorer havolalarini ko'rsating

## GitHub’ga joylash

```bash
git init
git add .
git commit -m "feat: launch AzizbekCE NFT Studio"
git branch -M main
git remote add origin https://github.com/<your-username>/azizbekce-nft-studio.git
git push -u origin main
```

## Hujjatlar

- Arxitektura: [docs/architecture.md](/c:/Users/User/CE/4-topshiriq/docs/architecture.md)
- Slayd deck: [docs/demo-slides.md](/c:/Users/User/CE/4-topshiriq/docs/demo-slides.md)

## Eslatma

Testnet deploy uchun funded deployer wallet, RPC URL va private key kerak bo'ladi. Repo ichidagi owner va treasury default tarzda `Azizbek` wallet manziliga sozlangan:

`0xA89c45b89b0558e866c5B983E27a61Df6b0FA968`
