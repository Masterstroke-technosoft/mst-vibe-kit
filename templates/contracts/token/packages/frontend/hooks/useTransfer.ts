"use client";

import { useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { useToken } from "./useToken";

export function useTransfer() {
  const { address, abi } = useToken();
  const { writeContract, isPending, data: hash } = useWriteContract();

  function transfer(to: `0x${string}`, amount: string) {
    if (!address) return;
    writeContract({
      address,
      abi,
      functionName: "transfer",
      args: [to, parseEther(amount)],
    });
  }

  return { transfer, isPending, hash };
}
