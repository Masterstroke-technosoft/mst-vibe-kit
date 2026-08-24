"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { ConnectButton } from "@/components/ConnectButton";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { NetworkWarning } from "@/components/NetworkWarning";
import { useToken } from "@/hooks/useToken";
import { useTokenBalance } from "@/hooks/useBalance";
import { useTransfer } from "@/hooks/useTransfer";

export default function Home() {
  const { address, name, symbol } = useToken();
  const { data: balance, refetch } = useTokenBalance();
  const { transfer, isPending } = useTransfer();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <main>
      <h1>{"{{PROJECT_NAME}}"}</h1>
      <p>Scaffolded with create-mst-app — token template (MEP-20).</p>

      <ConnectButton />
      <NetworkSwitcher />
      <NetworkWarning />

      <div className="card">
        <h2>
          {typeof name === "string" ? name : "MyToken"} (
          {typeof symbol === "string" ? symbol : "MTK"})
        </h2>
        {address ? (
          <>
            <p>
              Your balance:{" "}
              <strong>{balance !== undefined ? formatEther(balance as bigint) : "…"}</strong>
            </p>
            <div className="wallet">
              <input placeholder="Recipient 0x…" value={to} onChange={(e) => setTo(e.target.value)} />
              <input
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                disabled={isPending || !to || !amount}
                onClick={() => {
                  transfer(to as `0x${string}`, amount);
                  setTimeout(refetch, 3000);
                }}
              >
                {isPending ? "Sending…" : "Transfer"}
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
