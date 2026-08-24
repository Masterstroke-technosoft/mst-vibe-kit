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
npx create-mst-app my-app --template token --pm pnpm --git --yes
```

| Flag | Values |
|---|---|
| `--template <name>` | `blank`, `token` |
| `--pm <manager>` | `pnpm` (default), `npm`, `yarn` |
| `--git` / `--no-git` | initialize a git repo |
| `--skip-install` | skip dependency installation |
| `-y`, `--yes` | accept defaults, skip prompts |

## Templates

| Template | Standard | Includes |
|---|---|---|
| `blank` | — | Empty Hardhat config + `Hello.sol` example |
| `token` | MEP-20 | Fungible token with mint/burn roles, full test suite |

Both use OpenZeppelin base contracts and are non-upgradeable by default.
`nft`, `staking`, and `marketplace` templates are on the roadmap (see below).

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
- **Phase 2:** `nft`, `staking`, `marketplace` templates. Plugin system for
  community templates.
- **Phase 3:** Official `hardhat-mst` plugin with MST-specific helpers.
- **Phase 4:** A web-based scaffolder alongside the CLI.
