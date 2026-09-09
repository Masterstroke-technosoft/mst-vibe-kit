"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import type { Address } from "viem";

import { useInsurance } from "@/hooks/useInsurance";

export default function AdminPanel() {
  const { address, isConnected } = useAccount();

  const {
    owner,
    isDeployed,
    fundPool,
    withdrawPool,
    setOracle,
    setPremiumRateBps,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
  } = useInsurance();

  const [fundAmount, setFundAmount] = useState("1");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [newOracle, setNewOracle] = useState("");
  const [newRate, setNewRate] = useState("");

  const isOwner =
    isConnected && typeof owner === "string" && address?.toLowerCase() === owner.toLowerCase();

  const busy = isWritePending || isConfirming;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Pool Admin</h2>
        <p className="hint">Owner-only controls for keeping the payout pool solvent.</p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No ParametricInsurance deployment found for this network. Run{" "}
          <code>npm run deploy:testnet</code> first.
        </p>
      ) : !isOwner ? (
        <p className="hint">
          Connect the contract owner{owner ? " " : ""}
          {owner ? <code className="mono">{owner.toString()}</code> : null} to manage the pool.
        </p>
      ) : (
        <div className="form-stack">
          <div className="field">
            <label htmlFor="fund-amount">Fund pool (MST)</label>
            <div className="wallet">
              <input
                id="fund-amount"
                type="number"
                min="0"
                step="0.01"
                value={fundAmount}
                onChange={(event) => setFundAmount(event.target.value)}
              />
              <button
                type="button"
                onClick={() => fundAmount.trim() && fundPool(parseEther(fundAmount))}
                disabled={busy || !fundAmount.trim()}
              >
                Fund
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="withdraw-amount">Withdraw from pool (MST)</label>
            <div className="wallet">
              <input
                id="withdraw-amount"
                type="number"
                min="0"
                step="0.01"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => withdrawAmount.trim() && withdrawPool(parseEther(withdrawAmount))}
                disabled={busy || !withdrawAmount.trim()}
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="new-oracle">Set oracle address</label>
            <div className="wallet">
              <input
                id="new-oracle"
                type="text"
                value={newOracle}
                onChange={(event) => setNewOracle(event.target.value)}
                placeholder="0x..."
                className="mono"
              />
              <button
                type="button"
                onClick={() => newOracle.trim() && setOracle(newOracle.trim() as Address)}
                disabled={busy || !newOracle.trim()}
              >
                Update
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="new-rate">Set premium rate (basis points, 100 = 1%)</label>
            <div className="wallet">
              <input
                id="new-rate"
                type="number"
                min="0"
                max="10000"
                value={newRate}
                onChange={(event) => setNewRate(event.target.value)}
                placeholder="500"
              />
              <button
                type="button"
                onClick={() => newRate.trim() && setPremiumRateBps(BigInt(newRate))}
                disabled={busy || !newRate.trim()}
              >
                Update
              </button>
            </div>
          </div>

          {isConfirmed && <p className="status-success">Transaction confirmed.</p>}
          {writeError && <p className="network-warning">{writeError.message}</p>}
        </div>
      )}
    </div>
  );
}
