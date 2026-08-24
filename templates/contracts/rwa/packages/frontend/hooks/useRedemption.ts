"use client";

import { useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { useRWAToken } from "./useRWAToken";

export function useRedeemShares() {
  const { address, abi } = useRWAToken();
  const { writeContract, isPending, data: hash } = useWriteContract();

  function redeem(shares: string) {
    if (!address) return;
    writeContract({
      address,
      abi,
      functionName: "requestRedemption",
      args: [parseEther(shares)],
    });
  }

  return { redeem, isPending, hash };
}
