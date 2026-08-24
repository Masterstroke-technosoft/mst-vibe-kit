"use client";

import { useAccount, useReadContract } from "wagmi";
import { deployments } from "shared";
import { mstMainnet } from "@/lib/chains";

export function useRWAToken() {
  const { chainId } = useAccount();
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  const entry = (deployments as Record<string, any>)[network]?.RWAShareToken as
    | { address: `0x${string}`; abi: any }
    | undefined;

  const { data: name } = useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "name",
    query: { enabled: Boolean(entry) },
  });

  const { data: symbol } = useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "symbol",
    query: { enabled: Boolean(entry) },
  });

  const { data: pricePerShare, refetch: refetchPrice } = useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "pricePerShare",
    query: { enabled: Boolean(entry) },
  });

  return { address: entry?.address, abi: entry?.abi, name, symbol, pricePerShare, refetchPrice };
}
