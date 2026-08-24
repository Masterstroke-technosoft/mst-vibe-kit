"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { deployments } from "{{PROJECT_NAME}}-shared";
import { mstMainnet } from "@/lib/chains";

export function useVesting() {
  const { address: account, chainId } = useAccount();
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  const entry = (deployments as Record<string, any>)[network]?.Vesting as
    | { address: `0x${string}`; abi: any }
    | undefined;
  const { writeContract, isPending } = useWriteContract();

  // `schedules` is a public struct getter — viem decodes it positionally:
  // [totalAmount, released, start, cliff, duration, revocable, revoked]
  const { data: schedule, refetch: refetchSchedule } = useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "schedules",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(entry && account) },
  });

  const { data: releasable, refetch: refetchReleasable } = useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "releasableAmount",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(entry && account) },
  });

  function release() {
    if (!entry?.address) return;
    writeContract(
      { address: entry.address, abi: entry.abi, functionName: "release" },
      {
        onSuccess: () => {
          refetchSchedule();
          refetchReleasable();
        },
      }
    );
  }

  return {
    address: entry?.address,
    schedule: schedule as readonly [bigint, bigint, number, number, number, boolean, boolean] | undefined,
    releasable,
    release,
    isPending,
  };
}
