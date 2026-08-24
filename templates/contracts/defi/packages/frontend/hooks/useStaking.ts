"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { deployments } from "shared";
import { mstMainnet } from "@/lib/chains";
import { useProjectToken } from "./useProjectToken";

function useStakingContract() {
  const { chainId } = useAccount();
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  const entry = (deployments as Record<string, any>)[network]?.Staking as
    | { address: `0x${string}`; abi: any }
    | undefined;
  return { address: entry?.address, abi: entry?.abi };
}

export function useStaking() {
  const { address: account } = useAccount();
  const { address, abi } = useStakingContract();
  const { address: tokenAddress, abi: tokenAbi } = useProjectToken();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: staked, refetch: refetchStaked } = useReadContract({
    address,
    abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(address && account) },
  });

  const { data: earned, refetch: refetchEarned } = useReadContract({
    address,
    abi,
    functionName: "earned",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(address && account) },
  });

  async function stake(amount: bigint) {
    if (!address || !tokenAddress) return;
    await writeContractAsync({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: "approve",
      args: [address, amount],
    });
    await writeContractAsync({ address, abi, functionName: "stake", args: [amount] });
    refetchStaked();
    refetchEarned();
  }

  async function unstake(amount: bigint) {
    if (!address) return;
    await writeContractAsync({ address, abi, functionName: "unstake", args: [amount] });
    refetchStaked();
    refetchEarned();
  }

  async function claim() {
    if (!address) return;
    await writeContractAsync({ address, abi, functionName: "claimReward" });
    refetchEarned();
  }

  return { address, staked, earned, stake, unstake, claim, isPending };
}
