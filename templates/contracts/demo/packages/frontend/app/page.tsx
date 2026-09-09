"use client";

import WalletPanel from "@/components/WalletPanel";
import { SdkWalletPanel } from "@/components/SdkWalletPanel";
import NftMintPanel from "@/components/NftMintPanel";
import NftGallery from "@/components/NftGallery";
import TransferPanel from "@/components/TransferPanel";

export default function Page() {
  return (
    <main>
      <div className="page-header">
        <h1>DemoNFT</h1>
        <p className="hint">Mint, view, and transfer DemoNFT tokens — images pinned to IPFS.</p>
      </div>

      <WalletPanel />
      <NftGallery />
      <NftMintPanel />
      <TransferPanel />
      <SdkWalletPanel />
    </main>
  );
}
