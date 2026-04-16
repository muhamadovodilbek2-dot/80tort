# Odilbek NFT Studio

`Odilbek NFT Studio` bu NFT yaratish, mint qilish va holder-governance jarayonlarini bitta professional Web3 ilovada birlashtirgan to'liq dApp loyihasi. Loyiha Solidity asosidagi ERC-721 smart-kontrakt, React frontend, deploy skriptlari, testlar va taqdimot hujjatlari bilan GitHub’ga joylashga tayyor holatda ishlab chiqilgan.

## Qisqacha tavsif

Bu loyiha quyidagi vazifalarni amalda bajaradi:

- NFT kolleksiya yaratish
- foydalanuvchi tomonidan NFT mint qilish
- metadata URI bilan ishlash
- holder-only proposal yaratish
- token ID asosida ovoz berish
- proposal cancel va execute qilish
- testnet deploy uchun tayyor pipeline
- professional, responsive va demo uchun qulay frontend

## Asosiy imkoniyatlar

- `ERC-721` asosidagi NFT kolleksiya
- `mint`, `batchMint`, `ownerMint` funksiyalari
- `data:` yoki `ipfs://` metadata bilan ishlash
- NFT egalarigagina ruxsat berilgan governance oqimi
- har bir token bir proposal uchun faqat bir marta vote qila oladi
- treasury withdraw va sale management
- `pause / unpause` xavfsizlik boshqaruvi
- `ethers v6` orqali frontend-kontrakt integratsiyasi
- demo va taqdimot uchun tayyor UX

## Texnologiyalar

- Smart-kontrakt: `Solidity`, `Hardhat`, `OpenZeppelin`
- Frontend: `React`, `Vite`, `TypeScript`, `ethers`
- Testlash: `Hardhat test`, `chai`
- Dizayn: custom CSS, responsive editorial layout
- Deploy tayyorgarligi: `Sepolia` va `Polygon Amoy`

## Arxitektura

Yuqori darajadagi oqim:

```text
MetaMask / Wallet
        |
        v
React Frontend (Vite + ethers)
        |
        v
OdilbekCollection.sol
        |
        +--> NFT minting
        +--> Proposal creation
        +--> Token-based voting
        +--> Treasury management
```

Batafsil arxitektura hujjati: [docs/architecture.md](docs/architecture.md)

## Loyiha strukturasi

```text
.
├── contracts
│   ├── contracts/OdilbekCollection.sol
│   ├── scripts/deploy.js
│   ├── scripts/export-abi.js
│   └── test/OdilbekCollection.js
├── docs
│   ├── architecture.md
│   ├── demo-slides.md
│   └── github-about.md
├── frontend
│   ├── src/App.tsx
│   ├── src/components
│   ├── src/lib
│   └── src/config
├── .env.example
└── README.md
```

## Smart-kontrakt imkoniyatlari

Asosiy kontrakt: [contracts/contracts/OdilbekCollection.sol](contracts/contracts/OdilbekCollection.sol)

- `mint(string metadataURI)`
  Foydalanuvchi bitta NFT mint qiladi.
- `batchMint(string[] metadataURIs)`
  Bitta tranzaksiyada bir nechta NFT mint qiladi.
- `ownerMint(address recipient, string metadataURI)`
  Admin tomonidan maxsus mint.
- `createProposal(...)`
  NFT egasi governance proposal yaratadi.
- `castVote(proposalId, tokenIds, support)`
  Token ID’lar bilan yes/no ovoz beradi.
- `cancelProposal(proposalId)`
  Hali vote olinmagan proposalni bekor qiladi.
- `executeProposal(proposalId)`
  Deadline’dan keyin proposal natijasini finalize qiladi.
- `withdraw()`
  Kontrakt balansini treasury’ga o'tkazadi.

## Frontend imkoniyatlari

Asosiy interfeys: [frontend/src/App.tsx](frontend/src/App.tsx)

- Wallet ulash
- live mint statistikasi
- metadata builder
- custom metadata URI orqali mint
- holder proposal formasi
- yes/no vote tugmalari
- collector gallery
- explorer havolalari
- chain noto'g'ri bo'lsa network switch ko'rsatmasi

## Dizayn va UX yondashuvi

Frontend oddiy demo ko'rinishida emas, balki portfolio va himoya uchun mos professional ko'rinishda ishlangan:

- kuchli hero section
- shaffof panel va editorial card kompozitsiyasi
- mobil va desktop uchun responsive layout
- aniq status bannerlar
- mint, governance va gallery bloklarining mantiqiy ajratilishi
- foydalanuvchi uchun tushunarli call-to-action oqimi

## Lokal ishga tushirish

### 1. Dependency o'rnatish

```bash
npm install
npm --prefix contracts install
npm --prefix frontend install
```

### 2. Smart-kontraktni compile qilish

```bash
npm run contracts:compile
```

### 3. Testlarni ishga tushirish

```bash
npm run contracts:test
```

### 4. ABI ni frontendga eksport qilish

```bash
npm run contracts:export-abi
```

### 5. Frontendni development rejimida ishga tushirish

```bash
npm run frontend:dev
```

### 6. Frontend production build

```bash
npm run frontend:build
```

## Muhit o'zgaruvchilari

Ildiz `.env.example` va bo'limlarga tegishli `.env.example` fayllar tayyor.

### Smart-kontrakt uchun

`contracts/.env.example` faylidan foydalaning:

```env
CONTRACT_OWNER=0x7b6AAE8F15b2C6b6d4F5b1Aa1970639e37b4Bd8A
TREASURY_WALLET=0x7b6AAE8F15b2C6b6d4F5b1Aa1970639e37b4Bd8A
CONTRACT_METADATA_URI=ipfs://YOUR_COLLECTION_METADATA.json
MINT_PRICE_ETH=0.01
MAX_SUPPLY=500
MAX_MINT_PER_WALLET=5
SEPOLIA_RPC_URL=YOUR_RPC_URL
DEPLOYER_PRIVATE_KEY=YOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

### Frontend uchun

`frontend/.env.example` faylidan foydalaning:

```env
VITE_CONTRACT_ADDRESS=DEPLOY_QILINGAN_MANZIL
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia
VITE_RPC_URL=YOUR_SEPOLIA_RPC_URL
VITE_BLOCK_EXPLORER=https://sepolia.etherscan.io
```

## Testnet deploy

Sepolia deploy uchun:

```bash
npm run contracts:deploy:sepolia
npm run contracts:export-abi
```

Deploy qilingandan keyin:

- `contracts/deployments/sepolia.json` yangilanadi
- `frontend/src/config/deployment.json` yangilanadi
- frontend kontrakt adresini avtomatik o'qiydi

## Demo ssenariysi

1. Wallet ulanadi
2. Metadata builder orqali NFT mint qilinadi
3. Holder proposal yaratiladi
4. Mavjud tokenlar bilan vote beriladi
5. Deadline tugagach proposal execute qilinadi
6. Token gallery va explorer sahifasi ko'rsatiladi

## Tekshiruv holati

Loyiha lokal darajada tekshirildi:

- smart-kontrakt compile bo'ldi
- `6` ta test muvaffaqiyatli o'tdi
- frontend production build muvaffaqiyatli bo'ldi

## GitHub uchun tayyor materiallar

- Arxitektura: [docs/architecture.md](docs/architecture.md)
- Taqdimot slaydlari: [docs/demo-slides.md](docs/demo-slides.md)
- GitHub about va tavsif matnlari: [docs/github-about.md](docs/github-about.md)

## Muallif

- Ism: `Azizbek`
- GitHub: `Odilbek`
- Email: `Odilbek@gmail.com`
- Owner wallet: `0x7b6AAE8F15b2C6b6d4F5b1Aa1970639e37b4Bd8A`

## Litsenziya

MIT License. Batafsil: [LICENSE](LICENSE)
