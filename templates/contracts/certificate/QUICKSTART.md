# QUICKSTART

This project was scaffolded with the **certificate** template: a soulbound
(non-transferable) ERC-721 `Certificate` registry, plus a Next.js frontend
for issuing single or batch credentials, looking one up, and sharing a
QR-code verification link.

## 1. Install dependencies

```
pnpm/npm install
```
If you picked `pnpm` or `yarn` and don't have it yet, install it globally
first, then re-run the install:

```
npm install -g pnpm   # or: npm install -g yarn
pnpm install           # or: yarn install

## 2. Configure environment variables

Copy `.env.example` to `.env.local` at the project root and set `PRIVATE_KEY`
to a funded testnet account — this is the account that deploys the contract
and becomes its owner **and** its first issuer (see below). **Never commit
`.env.local`.**

## 3. Start the local stack

```
npm run dev
```

This starts a local Hardhat node and the Next.js frontend on
http://localhost:3000.

## 4. Run the tests

```
npm run test
```

## 5. Deploy the Certificate contract

```
npm run deploy:testnet
```

The contract address and ABI are written to `packages/shared/src/contracts.ts`
automatically — refresh the frontend and it picks up the deployment.

## 6. Owner vs. issuer — who can do what

The contract splits two roles:

- **Owner** — set once at deploy time (transferable via standard
  `Ownable`). Only the owner can revoke certificates, pause the contract,
  and grant or remove issuer rights.
- **Issuer** — any wallet with `isIssuer[address] == true`. Issuers can
  call `issue` and `batchIssue`. The deployer is made an issuer
  automatically, but the owner can add more (a co-founder's wallet, a
  registrar's wallet, or a backend signer) with `setIssuer(address, true)`
  — no redeploying, and no single hard-coded issuing address baked into the
  frontend. This is what lets the Vibe Kit frontend work with whatever
  wallet a user connects, instead of failing simulation for anyone but the
  deployer.

Manage this from the **Issuer Wallets** panel (owner-only) — paste an
address and grant or revoke its issuer role.

## 7. Try it out

1. Open http://localhost:3000 and connect the wallet you deployed with (it's
   both the owner and, by default, an issuer).
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

## 8. Automated issuance (no browser wallet)

For issuing outside a human clicking a button — a webhook when someone
finishes a course, a cron job, another backend calling in — use the
`backend` package instead of the wallet-based forms:

1. Generate a **dedicated** wallet for this (don't reuse your deploy
   `PRIVATE_KEY`) and set its private key as `ISSUER_PRIVATE_KEY` in
   `.env.local`.
2. As the contract owner, grant that wallet issuer rights: connect the
   owner wallet in the **Issuer Wallets** panel, paste the new wallet's
   address, and click **Grant issuer role**.
3. The backend starts automatically with `npm run dev` (or run it alone
   with `npm run dev --workspace=backend`) on http://localhost:4100.
   `GET /api/health` reports whether `ISSUER_PRIVATE_KEY` is set and
   whether that wallet is actually an authorized issuer on-chain.
4. Use the **Automated Issuance** / **Automated Batch Issuance** cards in
   the frontend (they call the backend directly), or hit
   `POST /api/issue` / `POST /api/batch-issue` yourself — see
   `packages/backend/src/server.ts` for the request shape.

The backend computes the same keccak256 fingerprint and token URI as the
browser forms, so certificates issued either way are identical in shape.

## 9. Verify on MSTScan (optional)

```
npm run verify:testnet
```

## 10. Ship to mainnet

```
npm run deploy:mainnet
```

You'll be asked to type a confirmation phrase before anything is sent to
mainnet.

## How verification actually works

`Certificate.verify(tokenId)` is a single, free on-chain read that returns
whether the token exists, who holds it, its keccak256 fingerprint, when it
was issued, and whether it's been revoked. That's the entire "scan and know
instantly" flow — no backend, no database, no phone calls.

## Troubleshooting

- **"No Certificate deployment found for this network"** — you haven't run
  `npm run deploy:testnet` yet, or your wallet is on a different network
  than the one you deployed to.
- **The Issue/Issuer Wallets panels show a red "Couldn't read owner()/issuer
  status..." message, or the Issue button is stuck disabled for every
  wallet, including the deployer** — this means the ABI/address in
  `packages/shared/src/contracts.ts` doesn't match the contract actually at
  that address (most often: you edited `Certificate.sol` — or pulled a
  newer version of it — after the last deploy, so the frontend is calling
  `owner()`/`isIssuer()` against bytecode that predates those functions).
  Fix: `npm run deploy:testnet` again to deploy the current contract and
  refresh `contracts.ts`, then reload the page.
- **Issue/Batch Issue reverts, or the panel shows "not an authorized
  issuer"** (without the red ABI-mismatch message above) — connect a wallet
  with issuer rights (the deployer has them by default), or have the owner
  grant them from the Issuer Wallets panel.
- **Revoke, pause, or Issuer Wallets actions do nothing** — these are
  owner-only; connect the deployer wallet (or whoever ownership was
  transferred to).
- **Transfer reverts** — this is expected. Certificates are soulbound: once
  issued, they can never be transferred between holders, only issued (mint)
  or revoked.
- **Automated Issuance panel errors with "ISSUER_PRIVATE_KEY is not set"**
  — set it in `.env.local` and restart `npm run dev`.
- **Automated Issuance panel errors with a revert / "caller is not an
  issuer"** — the wallet derived from `ISSUER_PRIVATE_KEY` hasn't been
  granted issuer rights yet; check `GET http://localhost:4100/api/health`
  for `isIssuerConfigured`, then grant it from the Issuer Wallets panel.
