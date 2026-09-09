
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";

import { useDemoNFT } from "../hooks/useDemoNFT";

export default function NftGallery() {
  const { address, isConnected } = useAccount();

 const {
  name,
  symbol,
  totalSupply,
  tokenOwner,
  tokenURI,
  isTokenOwnerLoading,
  isTokenURILoading,
  isTokenOwnerError,
  isTokenURIError,
} = useDemoNFT(parsedTokenId);

  const [tokenId, setTokenId] = useState("0");

  const parsedTokenId =
    tokenId.trim() === "" ? 0n : BigInt(tokenId);

  const ownerQuery = isConnected
    ? getOwnerOf(parsedTokenId)
    : undefined;

  const tokenURIQuery = isConnected
    ? getTokenURI(parsedTokenId)
    : undefined;

  return (
    <div className="rounded-xl border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          NFT Gallery
        </h2>

        <p className="text-sm text-gray-500">
          View DemoNFT collection and token information.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-500">Collection</p>
          <p className="font-medium">
            {name?.toString() || "-"}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-500">Symbol</p>
          <p className="font-medium">
            {symbol?.toString() || "-"}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-500">
            Total Supply
          </p>
          <p className="font-medium">
            {totalSupply?.toString() || "0"}
          </p>
        </div>
      </div>

      {!isConnected ? (
        <p className="text-sm text-gray-500">
          Connect your wallet to view token details.
        </p>
      ) : (
        <div className="space-y-5">
          <div>
            <label
              htmlFor="token-id"
              className="mb-2 block text-sm font-medium"
            >
              Token ID
            </label>

            <input
              id="token-id"
              type="number"
              min="0"
              value={tokenId}
              onChange={(event) =>
                setTokenId(event.target.value)
              }
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="rounded-lg border p-4">
            <p className="mb-1 text-sm text-gray-500">
              Token Owner
            </p>

            {ownerQuery?.isLoading ? (
              <p className="text-sm">
                Loading...
              </p>
            ) : ownerQuery?.error ? (
              <p className="text-sm text-red-600">
                Token does not exist or could not be read.
              </p>
            ) : (
              <p className="break-all font-mono text-sm">
                {ownerQuery?.data?.toString() || "-"}
              </p>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <p className="mb-1 text-sm text-gray-500">
              Token URI
            </p>

            {tokenURIQuery?.isLoading ? (
              <p className="text-sm">
                Loading...
              </p>
            ) : tokenURIQuery?.error ? (
              <p className="text-sm text-red-600">
                Token URI could not be read.
              </p>
            ) : (
              <p className="break-all text-sm">
                {tokenURIQuery?.data?.toString() || "-"}
              </p>
            )}
          </div>

          {address && (
            <p className="break-all text-xs text-gray-500">
              Connected wallet: {address as Address}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
