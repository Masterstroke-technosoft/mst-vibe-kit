
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";

import { useDemoNFT } from "../hooks/useDemoNFT";

export default function TransferPanel() {
  const { address, isConnected } = useAccount();

  const {
    transfer,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
  } = useDemoNFT();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tokenId, setTokenId] = useState("");

  const handleTransfer = () => {
    if (!isConnected || !address) {
      return;
    }

    const sender = from.trim() || address;
    const recipient = to.trim();

    if (!recipient || tokenId.trim() === "") {
      return;
    }

    transfer(
      sender as Address,
      recipient as Address,
      BigInt(tokenId),
    );
  };

  return (
    <div className="rounded-xl border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Transfer NFT
        </h2>

        <p className="text-sm text-gray-500">
          Transfer a DemoNFT from one wallet to another.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="transfer-from"
            className="mb-2 block text-sm font-medium"
          >
            From Address
          </label>

          <input
            id="transfer-from"
            type="text"
            value={from}
            onChange={(event) =>
              setFrom(event.target.value)
            }
            placeholder={address ?? "0x..."}
            className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
          />

          <p className="mt-1 text-xs text-gray-500">
            Leave empty to use the connected wallet.
          </p>
        </div>

        <div>
          <label
            htmlFor="transfer-to"
            className="mb-2 block text-sm font-medium"
          >
            To Address
          </label>

          <input
            id="transfer-to"
            type="text"
            value={to}
            onChange={(event) =>
              setTo(event.target.value)
            }
            placeholder="0x..."
            className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="transfer-token-id"
            className="mb-2 block text-sm font-medium"
          >
            Token ID
          </label>

          <input
            id="transfer-token-id"
            type="number"
            min="0"
            value={tokenId}
            onChange={(event) =>
              setTokenId(event.target.value)
            }
            placeholder="0"
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <button
          type="button"
          onClick={handleTransfer}
          disabled={
            !isConnected ||
            !to.trim() ||
            !tokenId.trim() ||
            isWritePending ||
            isConfirming
          }
          className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isWritePending
            ? "Confirm in wallet..."
            : isConfirming
              ? "Transferring..."
              : "Transfer NFT"}
        </button>

        {!isConnected && (
          <p className="text-sm text-gray-500">
            Connect your wallet first.
          </p>
        )}

        {isConfirmed && (
          <p className="text-sm text-green-600">
            NFT transferred successfully.
          </p>
        )}

        {writeError && (
          <p className="break-words text-sm text-red-600">
            Transaction failed: {writeError.message}
          </p>
        )}
      </div>
    </div>
  );
}
