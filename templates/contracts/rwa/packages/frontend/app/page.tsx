"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { ConnectButton } from "@/components/ConnectButton";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { NetworkWarning } from "@/components/NetworkWarning";
import { useRWAToken } from "@/hooks/useRWAToken";
import { useShareBalance } from "@/hooks/useShareBalance";
import { useIsWhitelisted } from "@/hooks/useWhitelist";
import { useRedeemShares } from "@/hooks/useRedemption";

export default function Home() {
  const { address, name, symbol, pricePerShare } = useRWAToken();
  const { data: balance, refetch } = useShareBalance();
  const { data: whitelisted } = useIsWhitelisted();
  const { redeem, isPending } = useRedeemShares();
  const [shares, setShares] = useState("");

  return (
    <main>
      <h1>{"{{PROJECT_NAME}}"}</h1>
      <p>Scaffolded with create-mst-app — rwa template (permissioned share token).</p>

      <ConnectButton />
      <NetworkSwitcher />
      <NetworkWarning />

      <div className="card">
        <h2>
          {typeof name === "string" ? name : "RWAShareToken"} (
          {typeof symbol === "string" ? symbol : "SHARE"})
        </h2>
        {address ? (
          <>
            <p>
              NAV:{" "}
              <strong>
                {pricePerShare !== undefined
                  ? `$${(Number(pricePerShare) / 100).toFixed(2)} / share`
                  : "…"}
              </strong>
            </p>
            <p>
              Your shares:{" "}
              <strong>{balance !== undefined ? formatEther(balance as bigint) : "…"}</strong>
            </p>
            {whitelisted === false && (
              <p className="network-warning">
                Your wallet isn&apos;t whitelisted yet — ask the compliance role to call
                setWhitelisted before you can hold or transfer shares.
              </p>
            )}
            <div className="wallet">
              <input
                placeholder="Shares to redeem"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
              <button
                disabled={isPending || !shares || whitelisted !== true}
                onClick={() => {
                  redeem(shares);
                  setShares("");
                  setTimeout(refetch, 3000);
                }}
              >
                {isPending ? "Submitting…" : "Request redemption"}
              </button>
            </div>
          </>
        ) : (
          <p>
            Deploy the contract with <code>npm run deploy:testnet</code> to see it here.
          </p>
        )}
      </div>
    </main>
  );
}
