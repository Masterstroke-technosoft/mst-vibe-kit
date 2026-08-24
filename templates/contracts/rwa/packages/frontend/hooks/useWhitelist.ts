"use client";

import { useAccount, useReadContract } from "wagmi";
import { useRWAToken } from "./useRWAToken";

export function useIsWhitelisted() {
  const { address: account } = useAccount();
  const { address, abi } = useRWAToken();

  return useReadContract({
    address,
    abi,
    functionName: "isWhitelisted",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(address && account) },
  });
}
