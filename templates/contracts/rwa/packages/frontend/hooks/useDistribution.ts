"use client";

import { useWriteContract, useReadContract } from "wagmi";
import { useRWAContracts } from "./useRWAContracts";

export function useClaimDistribution() {
  const { distribution } = useRWAContracts();
  const { writeContract, isPending, data: hash } = useWriteContract();

  function claim(holder: string, distributionId: bigint, shareAmount: bigint, totalShares: bigint) {
    if (!distribution?.address) return;
    writeContract({
      address: distribution.address,
      abi: distribution.abi,
      functionName: "claimDistribution",
      args: [holder, distributionId, shareAmount, totalShares],
    });
  }

  return { claim, isPending, hash };
}

export function useDistributionHistory() {
  const { distribution } = useRWAContracts();
  const { address: account } = useReadContract({
    address: distribution?.address,
    abi: distribution?.abi,
    functionName: "getHolderClaims",
    query: { enabled: false },
  });

  return { account };
}
