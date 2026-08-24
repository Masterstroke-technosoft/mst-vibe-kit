"use client";

import { useAccount, useReadContract } from "wagmi";
import { useToken } from "./useToken";

export function useTokenBalance() {
  const { address: account } = useAccount();
  const { address, abi } = useToken();

  return useReadContract({
    address,
    abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(address && account) },
  });
}
