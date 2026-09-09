# DemoNFT — Startup Guide

This project was scaffolded with the **demo** template: an ERC-721 (`DemoNFT`)
contract, a Next.js frontend (wallet connect, mint, gallery, transfer), a
small Express backend that pins images/metadata to IPFS via Pinata, and an
MST SDK wallet playground. See `QUICKSTART.md` for the general
install/deploy/test flow — this file covers what's specific to the demo.

## 1. Install dependencies

```
pnpm install
```

## 2. Configure environment variables

Copy `.env.example` to `.env.local` at the project root and fill in:

- `PRIVATE_KEY` — a funded testnet account, required to deploy the contract.
- `PINATA_JWT` — required so the backend can pin images/metadata to IPFS.
  Create a free account and generate a JWT at
  https://app.pinata.cloud/developers/api-keys.
- `PINATA_GATEWAY` — optional, only if you use a dedicated Pinata gateway
  domain instead of the public one.

**Never commit `.env.local`.**

## 3. Start the local stack

```
npm run dev
```

This starts, in parallel:

- a local Hardhat node (`packages/contracts`)
- the demo backend on http://localhost:4000 (`packages/backend`)
- the Next.js frontend on http://localhost:3000 (`packages/frontend`)

## 4. Deploy DemoNFT

```
npm run deploy:testnet
```

The contract address and ABI are written to `packages/shared/src/contracts.ts`
automatically — refresh the frontend and it picks up the deployment.

## 5. Try the demo

1. Open http://localhost:3000 and connect a wallet (make sure it's on MST
   Testnet).
2. Under **Mint NFT**, pick an image, give it a name, and click **Mint NFT**.
   The image is uploaded to IPFS through the backend, minted metadata is
   pinned, and the resulting `ipfs://` token URI is passed to
   `DemoNFT.mint`.
3. Under **NFT Gallery**, enter a token ID to see its owner, metadata, and
   image.
4. Under **Transfer NFT**, move a token between two addresses.
5. Under **SDK Wallet Playground**, generate a burner wallet with the MST SDK
   directly (no browser extension needed) and try a balance check, gas
   estimate, or native transfer — funded from the testnet faucet only.

## Troubleshooting

- **"No DemoNFT deployment found for this network"** — you haven't run
  `npm run deploy:testnet` yet, or your wallet is on a different network than
  the one you deployed to.
- **Minting fails at the upload step** — check that `PINATA_JWT` is set in
  `.env.local` and that the backend is running (`http://localhost:4000/api/health`
  should return `{ "ok": true, "pinataConfigured": true }`).
- **Backend not reachable from the frontend** — the frontend calls
  `http://localhost:4000` by default. If you run the backend elsewhere, set
  `NEXT_PUBLIC_BACKEND_URL` in `packages/frontend/.env.local`.
