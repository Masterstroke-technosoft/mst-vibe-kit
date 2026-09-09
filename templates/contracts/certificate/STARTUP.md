# On-Chain Certificate — Startup Guide

This project was scaffolded with the **certificate** template: a soulbound
(non-transferable) ERC-721 `Certificate` registry, plus a Next.js frontend
for issuing single or batch credentials, looking one up, and sharing a
QR-code verification link. See `QUICKSTART.md` for the general
install/deploy/test flow — this file covers what's specific to this
template.

## 1. Install dependencies

```
pnpm install
```

## 2. Configure environment variables

Copy `.env.example` to `.env.local` at the project root and set `PRIVATE_KEY`
to a funded testnet account — this is the account that deploys the contract
and becomes its owner (the only address allowed to issue or revoke
certificates). **Never commit `.env.local`.**

## 3. Start the local stack

```
npm run dev
```

This starts a local Hardhat node and the Next.js frontend on
http://localhost:3000.

## 4. Deploy the Certificate contract

```
npm run deploy:testnet
```

The contract address and ABI are written to `packages/shared/src/contracts.ts`
automatically — refresh the frontend and it picks up the deployment.

## 5. Try it out

1. Open http://localhost:3000 and connect the wallet you deployed with (it's
   the contract owner — only it can issue or revoke).
2. Under **Issue Certificate**, fill in a recipient address, holder name,
   and credential, then click **Issue certificate**. The app hashes the
   credential fields with keccak256 and stores that fingerprint on-chain —
   changing even one character later produces a different hash.
3. Under **Batch Issue**, paste one `address,holderName,credential,issuedOn`
   row per line to issue many certificates in a single transaction — useful
   for a graduating cohort or training batch.
4. Under **Look Up & Share**, enter a token ID to see its status and a QR
   code. The QR encodes a link to `/verify/[tokenId]` — a public page that
   works for anyone, wallet or not, and reads the certificate straight from
   the chain.
5. If a certificate turns out to be fraudulent or was issued in error, use
   **Revoke** from the same lookup panel — the token stays on-chain as a
   record, but verification now reports it as invalid.

## How verification actually works

`Certificate.verify(tokenId)` is a single, free on-chain read that returns
whether the token exists, who holds it, its keccak256 fingerprint, when it
was issued, and whether it's been revoked. That's the entire "scan and know
instantly" flow — no backend, no database, no phone calls.

## Troubleshooting

- **"No Certificate deployment found for this network"** — you haven't run
  `npm run deploy:testnet` yet, or your wallet is on a different network
  than the one you deployed to.
- **Issue/Batch Issue/Revoke buttons do nothing** — only the deployer wallet
  (the contract owner) can call these; connect that wallet.
- **Transfer reverts** — this is expected. Certificates are soulbound: once
  issued, they can never be transferred between holders, only issued (mint)
  or revoked.
