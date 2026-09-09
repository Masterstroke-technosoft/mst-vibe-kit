# Insurance Automation — Startup Guide

This project was scaffolded with the **insurance** template: a
`ParametricInsurance` contract that pays coverage out automatically when a
trusted oracle reports a condition met, plus a Next.js frontend for buying
policies, reporting oracle data, tracking a policy's status, and managing
the payout pool. See `QUICKSTART.md` for the general install/deploy/test
flow — this file covers what's specific to this template.

## 1. Install dependencies

```
pnpm install
```

## 2. Configure environment variables

Copy `.env.example` to `.env.local` at the project root and set `PRIVATE_KEY`
to a funded testnet account — this is the account that deploys the
contract, becomes its owner, **and** becomes the initial oracle (reassign
the oracle later with `setOracle` once a real data-reporting address is
ready). **Never commit `.env.local`.**

## 3. Start the local stack

```
npm run dev
```

This starts a local Hardhat node and the Next.js frontend on
http://localhost:3000.

## 4. Deploy the contract

```
npm run deploy:testnet
```

The contract address and ABI are written to `packages/shared/src/contracts.ts`
automatically — refresh the frontend and it picks up the deployment.

## 5. Try it out

1. Open http://localhost:3000 and connect the wallet you deployed with (it's
   both the owner and, initially, the oracle).
2. Under **Pool Admin**, fund the pool with enough MST to cover the
   payouts you're about to test — premiums alone won't be enough for a
   quick demo.
3. Under **Buy a Policy**, pick a coverage amount, a trigger metric (e.g.
   flight delay in minutes), a threshold, and a coverage window, then buy
   it — the exact premium is computed and charged automatically.
4. Under **Track a Policy**, enter the policy ID to see its coverage,
   threshold, and status.
5. Under **Oracle Report**, submit an observed value for that policy ID. If
   it's at or above the threshold, the payout fires in that same
   transaction — that's the entire "claim". Check the policyholder's
   balance or the policy's status to see it settle.
6. If a policy's coverage window passes without ever triggering, anyone can
   call **Expire policy** from the lookup panel — the premium stays with
   the pool.

## How the automation actually works

`submitOracleData(policyId, observedValue)` is the whole claims process:
one call, restricted to the oracle address, that checks the observed value
against the policy's stored threshold and — if it's met — transfers the
coverage amount to the holder in the same transaction. There's no separate
"file a claim" step because the trigger condition and the payout are the
same on-chain event.

## Troubleshooting

- **"No ParametricInsurance deployment found for this network"** — you
  haven't run `npm run deploy:testnet` yet, or your wallet is on a
  different network than the one you deployed to.
- **Oracle submission reverts with "pool underfunded"** — fund the pool
  from the Pool Admin panel before triggering a payout larger than its
  current balance.
- **Oracle submission reverts with "caller is not the oracle"** — connect
  the wallet currently set as `oracle` (shown in the Insurance Pool card),
  or have the owner call `setOracle` to reassign it.
