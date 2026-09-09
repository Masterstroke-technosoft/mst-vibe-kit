"use client";

import WalletPanel from "@/components/WalletPanel";
import PoolStats from "@/components/PoolStats";
import PurchasePolicyPanel from "@/components/PurchasePolicyPanel";
import PolicyLookupPanel from "@/components/PolicyLookupPanel";
import OraclePanel from "@/components/OraclePanel";
import AdminPanel from "@/components/AdminPanel";

export default function Page() {
  return (
    <main>
      <div className="page-header">
        <h1>Insurance Automation</h1>
        <p className="hint">
          Parametric insurance with self-executing payouts — define a trigger condition once, and
          coverage pays out the moment an oracle reports it met. No claim forms, no adjusters.
        </p>
      </div>

      <WalletPanel />
      <PoolStats />
      <PurchasePolicyPanel />
      <PolicyLookupPanel />
      <OraclePanel />
      <AdminPanel />
    </main>
  );
}
