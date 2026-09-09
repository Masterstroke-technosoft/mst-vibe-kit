"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";

import { useDemoNFT } from "@/hooks/useDemoNFT";

export default function TransferPanel() {
  const { address, isConnected } = useAccount();

  const { transfer, isDeployed, isWritePending, isConfirming, isConfirmed, writeError } =
    useDemoNFT();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tokenId, setTokenId] = useState("");

  const handleTransfer = () => {
    if (!isConnected || !address) return;

    const sender = from.trim() || address;
    const recipient = to.trim();

    if (!recipient || tokenId.trim() === "") return;

    transfer(sender as Address, recipient as Address, BigInt(tokenId));
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Transfer NFT</h2>
        <p className="hint">Transfer a DemoNFT from one wallet to another.</p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No DemoNFT deployment found for this network. Run{" "}
          <code>npm run deploy:testnet</code> first.
        </p>
      ) : (
        <div className="form-stack">
          <div className="field">
            <label htmlFor="transfer-from">From address</label>
            <input
              id="transfer-from"
              type="text"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              placeholder={address ?? "0x..."}
              className="mono"
            />
            <p className="hint">Leave empty to use the connected wallet.</p>
          </div>

          <div className="field">
            <label htmlFor="transfer-to">To address</label>
            <input
              id="transfer-to"
              type="text"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="0x..."
              className="mono"
            />
          </div>

          <div className="field">
            <label htmlFor="transfer-token-id">Token ID</label>
            <input
              id="transfer-token-id"
              type="number"
              min="0"
              value={tokenId}
              onChange={(event) => setTokenId(event.target.value)}
              placeholder="0"
            />
          </div>

          <div className="wallet">
            <button
              type="button"
              onClick={handleTransfer}
              disabled={!isConnected || !to.trim() || !tokenId.trim() || isWritePending || isConfirming}
            >
              {isWritePending
                ? "Confirm in wallet…"
                : isConfirming
                  ? "Transferring…"
                  : "Transfer NFT"}
            </button>
          </div>

          {!isConnected && <p className="hint">Connect your wallet first.</p>}
          {isConfirmed && <p className="status-success">NFT transferred successfully.</p>}
          {writeError && <p className="network-warning">{writeError.message}</p>}
        </div>
      )}
    </div>
  );
}
