"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { useDemoNFT } from "@/hooks/useDemoNFT";

const PUBLIC_IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

function toGatewayUrl(uri: string): string {
  return uri.startsWith("ipfs://")
    ? PUBLIC_IPFS_GATEWAY + uri.slice("ipfs://".length)
    : uri;
}

type NftMetadata = { name?: string; description?: string; image?: string };

function useTokenMetadata(tokenURI: unknown) {
  const [metadata, setMetadata] = useState<NftMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const uri = typeof tokenURI === "string" ? tokenURI : undefined;
    setMetadata(null);

    if (!uri) return;

    let cancelled = false;
    setIsLoading(true);

    fetch(toGatewayUrl(uri))
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad response"))))
      .then((data: NftMetadata) => {
        if (!cancelled) setMetadata(data);
      })
      .catch(() => {
        if (!cancelled) setMetadata(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tokenURI]);

  return { metadata, isLoading };
}

export default function NftGallery() {
  const { address, isConnected } = useAccount();

  const [tokenId, setTokenId] = useState("1");

  const parsedTokenId = tokenId.trim() === "" ? undefined : BigInt(tokenId);

  const {
    name,
    symbol,
    totalSupply,
    tokenOwner,
    tokenURI,
    isDeployed,

    isNameLoading,
    isSymbolLoading,
    isTotalSupplyLoading,

    isTokenOwnerLoading,
    isTokenURILoading,

    isTokenOwnerError,
    isTokenURIError,
  } = useDemoNFT(parsedTokenId);

  const { metadata, isLoading: isMetadataLoading } = useTokenMetadata(tokenURI);

  return (
    <div className="card">
      <div className="card-header">
        <h2>NFT Gallery</h2>
        <p className="hint">View the DemoNFT collection and individual token details.</p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No DemoNFT deployment found for this network. Run{" "}
          <code>npm run deploy:testnet</code> first.
        </p>
      ) : (
        <>
          <div className="grid grid-3">
            <div className="stat">
              <p className="hint">Collection</p>
              <p className="stat-value">
                {isNameLoading ? "Loading…" : name?.toString() || "-"}
              </p>
            </div>
            <div className="stat">
              <p className="hint">Symbol</p>
              <p className="stat-value">
                {isSymbolLoading ? "Loading…" : symbol?.toString() || "-"}
              </p>
            </div>
            <div className="stat">
              <p className="hint">Total supply</p>
              <p className="stat-value">
                {isTotalSupplyLoading ? "Loading…" : totalSupply?.toString() || "0"}
              </p>
            </div>
          </div>

          {!isConnected ? (
            <p className="hint">Connect your wallet to view individual NFT details.</p>
          ) : (
            <div className="form-stack">
              <div className="field">
                <label htmlFor="token-id">Token ID</label>
                <input
                  id="token-id"
                  type="number"
                  min="0"
                  value={tokenId}
                  onChange={(event) => setTokenId(event.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="nft-preview">
                <div className="nft-image-frame">
                  {isMetadataLoading || isTokenURILoading ? (
                    <span className="hint">Loading…</span>
                  ) : metadata?.image ? (
                    <img
                      src={toGatewayUrl(metadata.image)}
                      alt={metadata.name || "NFT artwork"}
                      className="nft-image"
                    />
                  ) : (
                    <span className="hint">No image</span>
                  )}
                </div>

                <div className="nft-details">
                  <p className="stat-value">{metadata?.name || `Token #${tokenId}`}</p>
                  {metadata?.description && <p className="hint">{metadata.description}</p>}

                  <div className="field">
                    <p className="hint">Owner</p>
                    {tokenId.trim() === "" ? (
                      <p className="hint">Enter a token ID.</p>
                    ) : isTokenOwnerLoading ? (
                      <p>Loading…</p>
                    ) : isTokenOwnerError ? (
                      <p className="status-error">Token does not exist.</p>
                    ) : (
                      <p className="mono">{tokenOwner?.toString() || "-"}</p>
                    )}
                  </div>

                  <div className="field">
                    <p className="hint">Token URI</p>
                    {tokenId.trim() === "" ? (
                      <p className="hint">Enter a token ID.</p>
                    ) : isTokenURIError ? (
                      <p className="status-error">Token URI could not be read.</p>
                    ) : (
                      <p className="mono break">{tokenURI?.toString() || "-"}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="field">
                <p className="hint">Connected wallet</p>
                <p className="mono">{address}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
