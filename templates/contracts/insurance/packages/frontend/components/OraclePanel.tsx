"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

import { useInsurance } from "@/hooks/useInsurance";

export default function OraclePanel() {
  const { address, isConnected } = useAccount();

  const {
    oracle,
    isOracleLoading,
    isOracleError,
    isDeployed,
    submitOracleData,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
  } = useInsurance();

  const [policyId, setPolicyId] = useState("1");
  const [observedValue, setObservedValue] = useState("");

  const isOracle =
    isConnected && typeof oracle === "string" && address?.toLowerCase() === oracle.toLowerCase();

  const canSubmit = isOracle && policyId.trim() !== "" && observedValue.trim() !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    submitOracleData(BigInt(policyId), BigInt(observedValue));
  };

  const busy = isWritePending || isConfirming;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Oracle Report</h2>
        <p className="hint">
          Reports the real-world observed value for a policy. If it meets or exceeds the trigger
          threshold, the payout fires in this same transaction — this is the entire claim.
        </p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No ParametricInsurance deployment found for this network. Run{" "}
          <code>npm run deploy:testnet</code> first.
        </p>
      ) : (
        <div className="form-stack">
          <div className="field">
            <label htmlFor="oracle-policy-id">Policy ID</label>
            <input
              id="oracle-policy-id"
              type="number"
              min="0"
              value={policyId}
              onChange={(event) => setPolicyId(event.target.value)}
              placeholder="1"
            />
          </div>

          <div className="field">
            <label htmlFor="observed-value">Observed value</label>
            <input
              id="observed-value"
              type="number"
              min="0"
              value={observedValue}
              onChange={(event) => setObservedValue(event.target.value)}
              placeholder="150"
            />
            <p className="hint">e.g. minutes of flight delay, or mm of rainfall — whatever the policy&apos;s metric is.</p>
          </div>

          <div className="wallet">
            <button type="button" onClick={handleSubmit} disabled={!canSubmit || busy}>
              {isWritePending ? "Confirm in wallet…" : isConfirming ? "Submitting…" : "Submit oracle data"}
            </button>
          </div>

          {!isConnected && <p className="hint">Connect your wallet first.</p>}
          {isConnected && isOracleError && (
            <p className="network-warning">
              Couldn&apos;t read the oracle address from the deployed contract — check the browser
              console for the underlying error. Common causes: a stale deployment (run{" "}
              <code>npm run deploy:testnet</code> and reload), or the RPC request was blocked by
              CORS / failed outright (a &quot;Failed to fetch&quot; error in the console).
            </p>
          )}
          {isConnected && !isOracleError && !isOracleLoading && !isOracle && (
            <p className="hint">
              Connected wallet is not the oracle address. Only{" "}
              <code className="mono">{oracle?.toString()}</code> can submit data.
            </p>
          )}
          {isConfirmed && <p className="status-success">Oracle data submitted.</p>}
          {writeError && <p className="network-warning">{writeError.message}</p>}
        </div>
      )}
    </div>
  );
}
