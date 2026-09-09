"use client";

import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import type { Address } from "viem";
import { deployments } from "{{PROJECT_NAME}}-shared";
import { mstMainnet } from "@/lib/chains";

type DeployedContract = { address: Address; abi: readonly unknown[] };

function useDemoNFTContract(): DeployedContract | undefined {
  const { chainId } = useAccount();
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  return (deployments as Record<string, any>)[network]?.DemoNFT as
    | DeployedContract
    | undefined;
}

export function useDemoNFT(tokenId?: bigint) {
  const contract = useDemoNFTContract();
  const enabled = Boolean(contract);
  const base = contract
    ? { address: contract.address, abi: contract.abi }
    : { address: undefined, abi: undefined };

  const {
    data: name,
    isLoading: isNameLoading,
    refetch: refetchName,
  } = useReadContract({
    ...base,
    functionName: "name",
    query: { enabled },
  });

  const {
    data: symbol,
    isLoading: isSymbolLoading,
    refetch: refetchSymbol,
  } = useReadContract({
    ...base,
    functionName: "symbol",
    query: { enabled },
  });

  const {
    data: totalSupply,
    isLoading: isTotalSupplyLoading,
    refetch: refetchTotalSupply,
  } = useReadContract({
    ...base,
    functionName: "totalSupply",
    query: { enabled },
  });

  const {
    data: contractOwner,
    isLoading: isOwnerLoading,
    refetch: refetchOwner,
  } = useReadContract({
    ...base,
    functionName: "owner",
    query: { enabled },
  });

  const {
    data: isPaused,
    isLoading: isPausedLoading,
    refetch: refetchPaused,
  } = useReadContract({
    ...base,
    functionName: "paused",
    query: { enabled },
  });

  const {
    data: tokenOwner,
    isLoading: isTokenOwnerLoading,
    isError: isTokenOwnerError,
    refetch: refetchTokenOwner,
  } = useReadContract({
    ...base,
    functionName: "ownerOf",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: enabled && tokenId !== undefined },
  });

  const {
    data: tokenURI,
    isLoading: isTokenURILoading,
    isError: isTokenURIError,
    refetch: refetchTokenURI,
  } = useReadContract({
    ...base,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: enabled && tokenId !== undefined },
  });

  const {
    data: writeData,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTransactionError,
  } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  const mint = (to: Address, tokenURI_: string) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "mint",
      args: [to, tokenURI_],
    });
  };

  const transfer = (from: Address, to: Address, tokenIdToTransfer: bigint) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "transferFrom",
      args: [from, to, tokenIdToTransfer],
    });
  };

  const pause = () => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "pause",
    });
  };

  const unpause = () => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "unpause",
    });
  };

  return {
    address: contract?.address,
    isDeployed: enabled,

    name,
    symbol,
    totalSupply,
    contractOwner,
    isPaused,

    tokenOwner,
    tokenURI,

    isNameLoading,
    isSymbolLoading,
    isTotalSupplyLoading,
    isOwnerLoading,
    isPausedLoading,
    isTokenOwnerLoading,
    isTokenURILoading,

    isTokenOwnerError,
    isTokenURIError,

    mint,
    transfer,
    pause,
    unpause,

    writeData,
    isWritePending,
    isConfirming,
    isConfirmed,
    isTransactionError,
    writeError,
    resetWrite,

    refetchName,
    refetchSymbol,
    refetchTotalSupply,
    refetchOwner,
    refetchPaused,
    refetchTokenOwner,
    refetchTokenURI,
  };
}
