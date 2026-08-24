"use client";

import { useAccount } from "wagmi";
import { deployments } from "shared";
import { mstMainnet } from "@/lib/chains";

export function useProjectToken() {
  const { chainId } = useAccount();
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  const entry = (deployments as Record<string, any>)[network]?.ProjectToken as
    | { address: `0x${string}`; abi: any }
    | undefined;

  return { address: entry?.address, abi: entry?.abi };
}
