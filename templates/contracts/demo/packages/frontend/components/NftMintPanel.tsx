
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";

import { useDemoNFT } from "../hooks/useDemoNFT";

export default function NftMintPanel() {
  const { address, isConnected } = useAccount();

  const {
    mint,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
  } = useDemoNFT();

  const [recipient, setRecipient] = useState("");

  const handleMint = () => {
    if (!isConnected) {
      return;
    }

    const mintTo = recipient.trim() || address;

    if (!mintTo) {
      return;
    }

    mint(mintTo as Address);
  };

  return (
    <div className="rounded-xl border p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Mint NFT</h2>

        <p className="text-sm text-gray-500">
          Mint a new DemoNFT to a wallet address.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="nft-recipient"
            className="mb-2 block text-sm font-medium"
          >
            Recipient Address
          </label>

          <input
            id="nft-recipient"
            type="text"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder={
              address ?? "0x..."
            }
            className="w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none"
          />

          <p className="mt-1 text-xs text-gray-500">
            Leave empty to mint to the connected wallet.
          </p>
        </div>

        <button
          type="button"
          onClick={handleMint}
          disabled={
            !isConnected ||
            isWritePending ||
            isConfirming
          }
          className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isWritePending
            ? "Confirm in wallet..."
            : isConfirming
              ? "Minting..."
              : "Mint NFT"}
        </button>

        {!isConnected && (
          <p className="text-sm text-gray-500">
            Connect your wallet first.
          </p>
        )}

        {isConfirmed && (
          <p className="text-sm text-green-600">
            NFT minted successfully.
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