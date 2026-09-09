"use client";

import { ConnectButton } from "@/components/ConnectButton";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { NetworkWarning } from "@/components/NetworkWarning";

export default function WalletPanel() {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Wallet</h2>
        <p className="hint">Connect a wallet to buy a policy, report oracle data, or manage the pool.</p>
      </div>

      <ConnectButton />
      <NetworkSwitcher />
      <NetworkWarning />
    </div>
  );
}
