"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { ConnectButton } from "@/components/ConnectButton";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { NetworkWarning } from "@/components/NetworkWarning";
import { useStaking } from "@/hooks/useStaking";
import { useVesting } from "@/hooks/useVesting";

export default function Home() {
  const {
    address: stakingAddress,
    staked,
    earned,
    stake,
    unstake,
    claim,
    isPending: stakingPending,
  } = useStaking();
  const {
    address: vestingAddress,
    schedule,
    releasable,
    release,
    isPending: vestingPending,
  } = useVesting();
  const [amount, setAmount] = useState("");

  const totalVested = schedule?.[0];
  const released = schedule?.[1];

  return (
    <main>
      <h1>{"{{PROJECT_NAME}}"}</h1>
      <p>Scaffolded with create-mst-app — defi template (staking + vesting).</p>

      <ConnectButton />
      <NetworkSwitcher />
      <NetworkWarning />

      <div className="card">
        <h2>Staking</h2>
        {stakingAddress ? (
          <>
            <p>
              Staked: <strong>{staked !== undefined ? formatEther(staked as bigint) : "…"}</strong>{" "}
              · Earned: <strong>{earned !== undefined ? formatEther(earned as bigint) : "…"}</strong>
            </p>
            <div className="wallet">
              <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <button
                disabled={stakingPending || !amount}
                onClick={() => stake(parseEther(amount))}
              >
                Stake
              </button>
              <button
                disabled={stakingPending || !amount}
                onClick={() => unstake(parseEther(amount))}
              >
                Unstake
              </button>
              <button disabled={stakingPending} onClick={() => claim()}>
                Claim reward
              </button>
            </div>
          </>
        ) : (
          <p>
            Deploy contracts with <code>npm run deploy:testnet</code> to see this here.
          </p>
        )}
      </div>

      <div className="card">
        <h2>Vesting</h2>
        {vestingAddress ? (
          totalVested && totalVested > 0n ? (
            <>
              <p>
                Total: <strong>{formatEther(totalVested)}</strong> · Released:{" "}
                <strong>{released !== undefined ? formatEther(released) : "0"}</strong> ·
                Releasable now:{" "}
                <strong>{releasable !== undefined ? formatEther(releasable as bigint) : "…"}</strong>
              </p>
              <button disabled={vestingPending || !releasable} onClick={() => release()}>
                Release vested tokens
              </button>
            </>
          ) : (
            <p>No vesting schedule for the connected wallet.</p>
          )
        ) : (
          <p>
            Deploy contracts with <code>npm run deploy:testnet</code> to see this here.
          </p>
        )}
      </div>
    </main>
  );
}
