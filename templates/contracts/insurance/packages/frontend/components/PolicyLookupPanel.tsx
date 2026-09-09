"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

import { useInsurance, POLICY_STATUS } from "@/hooks/useInsurance";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function statusBadgeClass(status: number) {
  if (status === 1) return "badge badge-valid"; // PaidOut
  if (status === 2) return "badge badge-revoked"; // Expired
  return "badge badge-active"; // Active
}

export default function PolicyLookupPanel() {
  const { isConnected } = useAccount();
  const [policyIdInput, setPolicyIdInput] = useState("1");

  const parsedPolicyId = policyIdInput.trim() === "" ? undefined : BigInt(policyIdInput);

  const {
    policy,
    isPolicyLoading,
    isDeployed,
    expirePolicy,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    refetchPolicy,
  } = useInsurance(parsedPolicyId);

  const notFound = policy && policy.holder === ZERO_ADDRESS;
  const isExpirable = policy && policy.status === 0 && Date.now() / 1000 > Number(policy.expiresAt);

  const handleExpire = () => {
    if (parsedPolicyId === undefined) return;
    expirePolicy(parsedPolicyId);
  };

  useEffect(() => {
    if (isConfirmed) refetchPolicy();
  }, [isConfirmed, refetchPolicy]);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Track a Policy</h2>
        <p className="hint">Look up any policy&apos;s coverage, trigger condition, and current status.</p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No ParametricInsurance deployment found for this network. Run{" "}
          <code>npm run deploy:testnet</code> first.
        </p>
      ) : (
        <div className="form-stack">
          <div className="field">
            <label htmlFor="policy-id">Policy ID</label>
            <input
              id="policy-id"
              type="number"
              min="0"
              value={policyIdInput}
              onChange={(event) => setPolicyIdInput(event.target.value)}
              placeholder="1"
            />
          </div>

          {isPolicyLoading ? (
            <p className="hint">Loading…</p>
          ) : !policy || notFound ? (
            <p className="status-error">No policy found for this ID.</p>
          ) : (
            <>
              <p>
                <span className={statusBadgeClass(policy.status)}>{POLICY_STATUS[policy.status]}</span>
              </p>

              <div className="grid grid-3">
                <div className="stat">
                  <p className="hint">Coverage</p>
                  <p className="stat-value">{formatEther(policy.coverageAmount)} MST</p>
                </div>
                <div className="stat">
                  <p className="hint">Premium paid</p>
                  <p className="stat-value">{formatEther(policy.premiumPaid)} MST</p>
                </div>
                <div className="stat">
                  <p className="hint">Trigger threshold</p>
                  <p className="stat-value">{policy.triggerThreshold.toString()}</p>
                </div>
              </div>

              <div className="field">
                <p className="hint">Metric</p>
                <p>{policy.metricType}</p>
              </div>
              <div className="field">
                <p className="hint">Holder</p>
                <p className="mono break">{policy.holder}</p>
              </div>
              <div className="field">
                <p className="hint">Coverage expires</p>
                <p>{new Date(Number(policy.expiresAt) * 1000).toLocaleString()}</p>
              </div>

              {isExpirable && (
                <div className="wallet">
                  <button
                    type="button"
                    onClick={handleExpire}
                    disabled={!isConnected || isWritePending || isConfirming}
                  >
                    {isWritePending ? "Confirm in wallet…" : isConfirming ? "Expiring…" : "Expire policy"}
                  </button>
                </div>
              )}
            </>
          )}

          {isConfirmed && <p className="status-success">Policy updated.</p>}
          {writeError && <p className="network-warning">{writeError.message}</p>}
        </div>
      )}
    </div>
  );
}
