"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";

import { useDemoNFT } from "@/hooks/useDemoNFT";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function NftMintPanel() {
  const { address, isConnected } = useAccount();

  const { mint, isDeployed, isWritePending, isConfirming, isConfirmed, writeError } =
    useDemoNFT();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipient, setRecipient] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setUploadError(null);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  };

  const handleMint = async () => {
    if (!isConnected || !file) return;

    const mintTo = (recipient.trim() || address) as Address | undefined;
    if (!mintTo) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const form = new FormData();
      form.append("image", file);
      form.append("name", name.trim() || "Untitled DemoNFT");
      form.append("description", description.trim());

      const response = await fetch(`${BACKEND_URL}/api/mint-metadata`, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Upload failed (${response.status})`);
      }

      const { tokenURI } = (await response.json()) as { tokenURI: string };

      mint(mintTo, tokenURI);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setRecipient("");
    setName("");
    setDescription("");
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const busy = isUploading || isWritePending || isConfirming;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Mint NFT</h2>
        <p className="hint">
          Upload an image — it&apos;s pinned to IPFS via Pinata, then minted as a DemoNFT.
        </p>
      </div>

      {!isDeployed ? (
        <p className="hint">
          No DemoNFT deployment found for this network. Run{" "}
          <code>npm run deploy:testnet</code> first.
        </p>
      ) : (
        <div className="form-stack">
          <label className="dropzone" htmlFor="nft-image">
            {preview ? (
              <img src={preview} alt="Selected NFT artwork" className="dropzone-preview" />
            ) : (
              <span className="hint">Click to choose an image</span>
            )}
          </label>
          <input
            ref={fileInputRef}
            id="nft-image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="visually-hidden"
          />

          <div className="field">
            <label htmlFor="nft-name">Name</label>
            <input
              id="nft-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="My DemoNFT #1"
            />
          </div>

          <div className="field">
            <label htmlFor="nft-description">Description</label>
            <input
              id="nft-description"
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="field">
            <label htmlFor="nft-recipient">Recipient address</label>
            <input
              id="nft-recipient"
              type="text"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder={address ?? "0x..."}
              className="mono"
            />
            <p className="hint">Leave empty to mint to the connected wallet.</p>
          </div>

          <div className="wallet">
            <button type="button" onClick={handleMint} disabled={!isConnected || !file || busy}>
              {isUploading
                ? "Uploading to IPFS…"
                : isWritePending
                  ? "Confirm in wallet…"
                  : isConfirming
                    ? "Minting…"
                    : "Mint NFT"}
            </button>
            {(preview || name || description) && (
              <button type="button" onClick={resetForm} disabled={busy}>
                Reset
              </button>
            )}
          </div>

          {!isConnected && <p className="hint">Connect your wallet first.</p>}
          {isConfirmed && <p className="status-success">NFT minted successfully.</p>}
          {(uploadError || writeError) && (
            <p className="network-warning">{uploadError || writeError?.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
