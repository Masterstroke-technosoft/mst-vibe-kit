# create-mst-app

A one-command scaffolder that sets up a complete MST blockchain project —
contracts, frontend, and both testnet/mainnet configs baked in. Write
contracts, test on testnet, deploy to mainnet. No configuration hunt.

The pattern is stolen directly from `create-react-app`: one opinionated
scaffolder, sensible defaults, zero-config out of the box.

```
npx create-mst-app
```

## What you get

```
my-mst-project/
├── packages/
│   ├── contracts/   Hardhat project · Solidity smart contracts
│   ├── frontend/    Next.js starter · wallet connect · generated hooks
│   └── shared/      TypeScript types · contract ABIs · constants
├── .env.example     Template for PRIVATE_KEY, RPC URLs (never commit secrets)
├── .env.local       .gitignored · local secrets (created for you)
├── package.json     workspaces · scripts for dev/deploy
└── turbo.json       task orchestration
```

`hardhat.config.ts` in `packages/contracts` is pre-wired for both networks:

| Network | Chain ID | RPC |
|---|---|---|
| MST Testnet | `91562037` | `https://testnetrpc.mstblockchain.com` |
| MST Mainnet | `4646` | `https://mariorpc.mstblockchain.com` |

You only need to set `PRIVATE_KEY` in `.env.local` to deploy.

## CLI flow

Running `npx create-mst-app` asks four questions — project name, template,
package manager (pnpm/npm/yarn), and whether to `git init` — then installs
dependencies and prints next steps. Non-interactive usage:

```
npx create-mst-app my-app --template defi --pm pnpm --git --yes
```

| Flag | Values |
|---|---|
| `--template <name>` | `blank`, `token`, `rwa`, `defi`, `demo`, `certificate`, `insurance`, `supplychain` |
| `--pm <manager>` | `pnpm` (default), `npm`, `yarn` |
| `--git` / `--no-git` | initialize a git repo |
| `--skip-install` | skip dependency installation |
| `-y`, `--yes` | accept defaults, skip prompts |

## Templates

| Template | Standard | Includes |
|---|---|---|
| `blank` | — | Empty Hardhat config + `Hello.sol` example |
| `token` | MEP-20 | Fungible token with mint/burn roles, full test suite |
| `rwa` | Permissioned ERC-20 | `RWAShareToken` — whitelist-gated transfers, admin-set NAV (`pricePerShare`), and a burn-to-redeem flow that emits `RedemptionRequested` for off-chain settlement |
| `defi` | Staking + Vesting | `ProjectToken` (shared ERC-20) + `Staking` (Synthetix-style reward-per-second accumulator, pause-new-stakes) + `Vesting` (linear, per-beneficiary, cliff + revocation) — all three deployed and wired together |
| `demo` | NFT + MST SDK | `DemoNFT` (ERC-721) with image minting via a Pinata IPFS backend, a wallet/mint/transfer/gallery frontend, and an MST SDK burner-wallet playground |
| `certificate` | Soulbound ERC-721 | `Certificate` — non-transferable credential NFTs with single and batch issuance, revocation, and a public `/verify/[tokenId]` page with QR-code sharing |
| `insurance` | Parametric Insurance | `ParametricInsurance` — buy coverage with an on-chain premium quote, an oracle-restricted `submitOracleData` call that pays out automatically when a trigger condition is met, and pool funding/withdrawal controls |
| `supplychain` | Custody Registry | `SupplyChain` — product registration, participant-gated custody transfers, inspection/certification/delivery checkpoints, owner-only recall, and a public `/track/[productId]` page with QR-code sharing |

All templates use OpenZeppelin base contracts (`AccessControl`, `Pausable`,
`ReentrancyGuard`) and are non-upgradeable by default. `marketplace` is on
the roadmap (see below).

## Built-in scripts (in every generated project)

| Command | What it does |
|---|---|
| `npm run dev` | Hardhat node + Next.js frontend on localhost:3000 |
| `npm run test` | Run contract tests with Hardhat |
| `npm run compile` | Compile contracts, generate TypeScript types |
| `npm run lint` | Lint Solidity with Solhint |
| `npm run deploy:testnet` | Deploy to MST Testnet |
| `npm run deploy:mainnet` | Deploy to MST Mainnet (requires `PRIVATE_KEY` + typed confirmation) |
| `npm run verify:testnet` / `verify:mainnet` | Verify source on MSTScan |
| `npm run clean` | Remove build artifacts and cache |

The deploy script refuses to run without `PRIVATE_KEY`, and on mainnet it
prints the target chain and requires typing `yes, deploy to mainnet` before
sending anything. After a successful deploy, contract addresses and ABIs are
written to `packages/shared/src/contracts.ts` and
`packages/contracts/deployments.json`, which the frontend's generated hooks
read from automatically.

## Repository layout (this repo)

This repo *is* the `create-mst-app` package:

```
mst-vibe-kit/
├── bin/create-mst-app.js     CLI entry point
├── src/                      CLI implementation (prompts, scaffolding, install)
├── templates/
│   ├── base/                 files common to every generated project
│   └── contracts/<name>/     per-template overlay: contract, test,
│                              deploy.config.ts, frontend example page + hooks
└── test/                     end-to-end scaffold smoke tests
```

Adding a new contract template means adding a directory under
`templates/contracts/<id>` and an entry in `src/templates.js`.

## Developing this CLI

```
node bin/create-mst-app.js my-test-app --skip-install --no-git
```

```
npm test
```

## Roadmap

- **Phase 1 (this repo today):** CLI, `blank` + `token` templates, Hardhat
  config, basic frontend starter.
- **Phase 2 (this repo today):** `rwa` (real-world-asset tokenization),
  `defi` (staking + vesting), `demo` (NFT + MST SDK), `certificate`
  (on-chain credential verification), `insurance` (parametric automation),
  and `supplychain` (custody/provenance tracking) use-case templates.
  `marketplace` still to come, plus a plugin system for community
  templates.
- **Phase 3:** Official `hardhat-mst` plugin with MST-specific helpers.
- **Phase 4:** A web-based scaffolder alongside the CLI.
