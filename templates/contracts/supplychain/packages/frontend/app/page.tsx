"use client";

import WalletPanel from "@/components/WalletPanel";
import SupplyChainStats from "@/components/SupplyChainStats";
import RegisterProductPanel from "@/components/RegisterProductPanel";
import TransferCustodyPanel from "@/components/TransferCustodyPanel";
import CheckpointPanel from "@/components/CheckpointPanel";
import TrackProductPanel from "@/components/TrackProductPanel";
import ParticipantAdminPanel from "@/components/ParticipantAdminPanel";

export default function Page() {
  return (
    <main>
      <div className="page-header">
        <h1>Supply Chain Transparency</h1>
        <p className="hint">
          Every registration, handoff, and checkpoint is an immutable on-chain event — the same
          ledger every participant and customer reads from, with instant traceability by product
          ID or QR code.
        </p>
      </div>

      <WalletPanel />
      <SupplyChainStats />
      <RegisterProductPanel />
      <TransferCustodyPanel />
      <CheckpointPanel />
      <TrackProductPanel />
      <ParticipantAdminPanel />
    </main>
  );
}
