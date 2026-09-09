"use client";

import { formatEther } from "viem";
import { useInsurance } from "@/hooks/useInsurance";

export default function PoolStats() {
  const {
    isDeployed,
    poolBalance,
    totalPolicies,
    premiumRateBps,
    oracle,
    isPoolBalanceLoading,
    isTotalPoliciesLoading,
    isPremiumRateLoading,
    isOracleLoading,
  } = useInsurance();

  return (
    <div className="card">
      <div className="card-header">
        <h2>Insurance Pool</h2>
        <p className="hint">The pool that funds automatic payouts, and the oracle authorized to trigger them.</p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No ParametricInsurance deployment found for this network. Run{" "}
          <code>npm run deploy:testnet</code> first.
        </p>
      ) : (
        <div className="grid grid-3">
          <div className="stat">
            <p className="hint">Pool balance</p>
            <p className="stat-value">
              {isPoolBalanceLoading ? "Loading…" : `${formatEther((poolBalance as bigint) ?? BigInt(0))} MST`}
            </p>
          </div>
          <div className="stat">
            <p className="hint">Policies issued</p>
            <p className="stat-value">
              {isTotalPoliciesLoading ? "Loading…" : totalPolicies?.toString() || "0"}
            </p>
          </div>
          <div className="stat">
            <p className="hint">Premium rate</p>
            <p className="stat-value">
              {isPremiumRateLoading
                ? "Loading…"
                : `${(Number(premiumRateBps ?? 0) / 100).toString()}%`}
            </p>
          </div>
          <div className="stat stat-wide">
            <p className="hint">Oracle address</p>
            <p className="mono break">{isOracleLoading ? "Loading…" : (oracle as string) || "-"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
