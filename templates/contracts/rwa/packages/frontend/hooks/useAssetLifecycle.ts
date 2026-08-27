"use client";

import { useWriteContract, useReadContract } from "wagmi";
import { useRWAContracts } from "./useRWAContracts";

export function useAssetLifecycleActions() {
  const { lifecycle } = useRWAContracts();
  const { writeContract, isPending, data: hash } = useWriteContract();

  function activateAsset() {
    if (!lifecycle?.address) return;
    writeContract({
      address: lifecycle.address,
      abi: lifecycle.abi,
      functionName: "activateAsset",
    });
  }

  function pauseAsset() {
    if (!lifecycle?.address) return;
    writeContract({
      address: lifecycle.address,
      abi: lifecycle.abi,
      functionName: "pauseAsset",
    });
  }

  function resumeAsset() {
    if (!lifecycle?.address) return;
    writeContract({
      address: lifecycle.address,
      abi: lifecycle.abi,
      functionName: "resumeAsset",
    });
  }

  function terminateAsset() {
    if (!lifecycle?.address) return;
    writeContract({
      address: lifecycle.address,
      abi: lifecycle.abi,
      functionName: "terminateAsset",
    });
  }

  return { activateAsset, pauseAsset, resumeAsset, terminateAsset, isPending, hash };
}

export function useRedemptionRequests(userAddress?: `0x${string}`) {
  const { lifecycle } = useRWAContracts();

  const { data: redemptions } = useReadContract({
    address: lifecycle?.address,
    abi: lifecycle?.abi,
    functionName: "getUserRedemptions",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: Boolean(lifecycle && userAddress) },
  });

  return { redemptions };
}
