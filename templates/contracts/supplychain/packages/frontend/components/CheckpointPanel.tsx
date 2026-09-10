"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

import { useSupplyChain, EVENT_TYPES } from "@/hooks/useSupplyChain";

const CHECKPOINT_TYPES = EVENT_TYPES.filter(
  (name) => name === "Inspected" || name === "Certified" || name === "Delivered",
);

export default function CheckpointPanel() {
  const { isConnected } = useAccount();

  const {
    isDeployed,
    isConnectedWalletParticipant,
    recordCheckpoint,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
  } = useSupplyChain();

  const [productId, setProductId] = useState("");
  const [eventTypeName, setEventTypeName] = useState<string>(CHECKPOINT_TYPES[0]);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const canSubmit =
    isConnected && isConnectedWalletParticipant === true && productId.trim() !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    const eventType = EVENT_TYPES.indexOf(eventTypeName as (typeof EVENT_TYPES)[number]);
    recordCheckpoint(BigInt(productId), eventType, location.trim(), note.trim());
  };

  const busy = isWritePending || isConfirming;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Record Checkpoint</h2>
        <p className="hint">
          Logs an inspection, certification, or delivery against a product without changing who
          holds it — e.g. a third-party inspector signing off.
        </p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No SupplyChain deployment found for this network. Run <code>npm run deploy:testnet</code>{" "}
          first.
        </p>
      ) : (
        <div className="form-stack">
          <div className="field">
            <label htmlFor="checkpoint-product-id">Product ID</label>
            <input
              id="checkpoint-product-id"
              type="number"
              min="0"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              placeholder="1"
            />
          </div>

          <div className="field">
            <label htmlFor="checkpoint-type">Checkpoint type</label>
            <select
              id="checkpoint-type"
              value={eventTypeName}
              onChange={(event) => setEventTypeName(event.target.value)}
            >
              {CHECKPOINT_TYPES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="checkpoint-location">Location</label>
            <input
              id="checkpoint-location"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Port of Rotterdam"
            />
          </div>

          <div className="field">
            <label htmlFor="checkpoint-note">Note (optional)</label>
            <input
              id="checkpoint-note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Passed customs inspection"
            />
          </div>

          <div className="wallet">
            <button type="button" onClick={handleSubmit} disabled={!canSubmit || busy}>
              {isWritePending ? "Confirm in wallet…" : isConfirming ? "Recording…" : "Record checkpoint"}
            </button>
          </div>

          {!isConnected && <p className="hint">Connect your wallet first.</p>}
          {isConfirmed && <p className="status-success">Checkpoint recorded.</p>}
          {writeError && <p className="network-warning">{writeError.message}</p>}
        </div>
      )}
    </div>
  );
}
