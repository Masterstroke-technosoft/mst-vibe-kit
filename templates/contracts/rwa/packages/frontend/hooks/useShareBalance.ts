"use client";

import { useAccount, useReadContract } from "wagmi";
import { useRWAToken } from "./useRWAToken";

export function useShareBalance() {
  const { address: account } = useAccount();
  const { address, abi } = useRWAToken();

  return useReadContract({
    address,
    abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(address && account) },
  });
}
