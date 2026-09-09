"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";

import { useInsurance } from "@/hooks/useInsurance";

const METRIC_PRESETS = [
  { value: "flight_delay_minutes", label: "Flight delay (minutes)" },
  { value: "rainfall_mm", label: "Rainfall (mm)" },
  { value: "wind_speed_kmh", label: "Wind speed (km/h)" },
  { value: "custom", label: "Custom metric" },
];

export default function PurchasePolicyPanel() {
  const { isConnected } = useAccount();

  const [coverage, setCoverage] = useState("10");
  const [threshold, setThreshold] = useState("120");
  const [durationDays, setDurationDays] = useState("7");
  const [metricType, setMetricType] = useState(METRIC_PRESETS[0].value);
  const [customMetric, setCustomMetric] = useState("");
  const [purchasedPolicyId, setPurchasedPolicyId] = useState<bigint | null>(null);

  const coverageAmount = coverage.trim() === "" ? undefined : parseEther(coverage);

  const {
    isDeployed,
    premiumPreview,
    isPremiumPreviewLoading,
    purchasePolicy,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    refetchTotalPolicies,
  } = useInsurance(undefined, coverageAmount);

  const resolvedMetric = metricType === "custom" ? customMetric.trim() : metricType;

  const canSubmit =
    isConnected &&
    coverageAmount !== undefined &&
    coverageAmount > BigInt(0) &&
    threshold.trim() !== "" &&
    durationDays.trim() !== "" &&
    resolvedMetric !== "" &&
    premiumPreview !== undefined;

  const handlePurchase = () => {
    if (!canSubmit || coverageAmount === undefined || premiumPreview === undefined) return;

    setPurchasedPolicyId(null);
    purchasePolicy(
      coverageAmount,
      BigInt(threshold),
      BigInt(Number(durationDays) * 24 * 60 * 60),
      resolvedMetric,
      premiumPreview as bigint,
    );
  };

  useEffect(() => {
    if (!isConfirmed || purchasedPolicyId !== null) return;

    let cancelled = false;
    refetchTotalPolicies().then(({ data }) => {
      if (!cancelled && typeof data === "bigint") setPurchasedPolicyId(data);
    });

    return () => {
      cancelled = true;
    };
  }, [isConfirmed, purchasedPolicyId, refetchTotalPolicies]);

  const busy = isWritePending || isConfirming;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Buy a Policy</h2>
        <p className="hint">
          Define the trigger condition up front — coverage pays out automatically the moment the
          oracle reports it met.
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
            <label htmlFor="coverage">Coverage amount (MST)</label>
            <input
              id="coverage"
              type="number"
              min="0"
              step="0.01"
              value={coverage}
              onChange={(event) => setCoverage(event.target.value)}
              placeholder="10"
            />
          </div>

          <div className="field">
            <label htmlFor="metric-type">Trigger metric</label>
            <select
              id="metric-type"
              value={metricType}
              onChange={(event) => setMetricType(event.target.value)}
            >
              {METRIC_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
            {metricType === "custom" && (
              <input
                type="text"
                value={customMetric}
                onChange={(event) => setCustomMetric(event.target.value)}
                placeholder="e.g. earthquake_magnitude"
                style={{ marginTop: "0.5rem" }}
              />
            )}
          </div>

          <div className="field">
            <label htmlFor="threshold">Trigger threshold</label>
            <input
              id="threshold"
              type="number"
              min="0"
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
              placeholder="120"
            />
            <p className="hint">Payout fires when the oracle reports a value at or above this.</p>
          </div>

          <div className="field">
            <label htmlFor="duration">Coverage window (days)</label>
            <input
              id="duration"
              type="number"
              min="1"
              value={durationDays}
              onChange={(event) => setDurationDays(event.target.value)}
              placeholder="7"
            />
          </div>

          <div className="stat">
            <p className="hint">Premium due</p>
            <p className="stat-value">
              {coverageAmount === undefined
                ? "-"
                : isPremiumPreviewLoading || premiumPreview === undefined
                  ? "Calculating…"
                  : `${formatEther(premiumPreview as bigint)} MST`}
            </p>
          </div>

          <div className="wallet">
            <button type="button" onClick={handlePurchase} disabled={!canSubmit || busy}>
              {isWritePending ? "Confirm in wallet…" : isConfirming ? "Purchasing…" : "Buy policy"}
            </button>
          </div>

          {!isConnected && <p className="hint">Connect your wallet first.</p>}
          {isConfirmed && (
            <p className="status-success">
              Policy purchased
              {purchasedPolicyId !== null ? ` — likely policy ID ${purchasedPolicyId.toString()}.` : "."}
            </p>
          )}
          {writeError && <p className="network-warning">{writeError.message}</p>}
        </div>
      )}
    </div>
  );
}
