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
    isPoolBalanceError,
    isTotalPoliciesLoading,
    isPremiumRateLoading,
    isOracleLoading,
    isOracleError,
  } = useInsurance();

  const hasReadError = isPoolBalanceError || isOracleError;

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
        <>
          {hasReadError && (
            <p className="network-warning">
              Couldn&apos;t read pool data from the deployed contract — check the browser console
              for the underlying error. Common causes: a stale deployment (run{" "}
              <code>npm run deploy:testnet</code> and reload), or the RPC request was blocked by
              CORS / failed outright (a &quot;Failed to fetch&quot; error in the console).
            </p>
          )}
          <div className="grid grid-3">
            <div className="stat">
              <p className="hint">Pool balance</p>
              <p className="stat-value">
                {isPoolBalanceError
                  ? "Error"
                  : isPoolBalanceLoading
                    ? "Loading…"
                    : `${formatEther((poolBalance as bigint) ?? BigInt(0))} MST`}
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
              <p className="mono break">
                {isOracleError ? "Error" : isOracleLoading ? "Loading…" : (oracle as string) || "-"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
