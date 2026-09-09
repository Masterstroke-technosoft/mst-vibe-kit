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

export type VerifyResult = {
  isValid: boolean;
  holder: Address;
  certHash: `0x${string}`;
  issuedAt: bigint;
  revoked: boolean;
};

function useCertificateContract(): DeployedContract | undefined {
  const { chainId } = useAccount();
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  return (deployments as Record<string, any>)[network]?.Certificate as
    | DeployedContract
    | undefined;
}

/**
 * Reads/writes for the Certificate registry. `tokenId` is optional — pass it
 * to also resolve that certificate's owner, URI, and verification status
 * (used by the public /verify/[tokenId] page, which works without a
 * connected wallet since these are all plain contract reads).
 */
export function useCertificate(tokenId?: bigint) {
  const contract = useCertificateContract();
  const enabled = Boolean(contract);
  const base = contract
    ? { address: contract.address, abi: contract.abi }
    : { address: undefined, abi: undefined };

  const {
    data: name,
    isLoading: isNameLoading,
  } = useReadContract({ ...base, functionName: "name", query: { enabled } });

  const {
    data: symbol,
    isLoading: isSymbolLoading,
  } = useReadContract({ ...base, functionName: "symbol", query: { enabled } });

  const {
    data: totalSupply,
    isLoading: isTotalSupplyLoading,
    refetch: refetchTotalSupply,
  } = useReadContract({ ...base, functionName: "totalSupply", query: { enabled } });

  const {
    data: tokenURI,
    isLoading: isTokenURILoading,
    isError: isTokenURIError,
  } = useReadContract({
    ...base,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: enabled && tokenId !== undefined },
  });

  const {
    data: verifyData,
    isLoading: isVerifyLoading,
    isError: isVerifyError,
    refetch: refetchVerify,
  } = useReadContract({
    ...base,
    functionName: "verify",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: enabled && tokenId !== undefined },
  });

  const verifyResult: VerifyResult | undefined = verifyData
    ? {
        isValid: (verifyData as any)[0],
        holder: (verifyData as any)[1],
        certHash: (verifyData as any)[2],
        issuedAt: (verifyData as any)[3],
        revoked: (verifyData as any)[4],
      }
    : undefined;

  const {
    data: writeData,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash: writeData });

  const issue = (to: Address, certHash: `0x${string}`, tokenURI_: string) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "issue",
      args: [to, certHash, tokenURI_],
    });
  };

  const batchIssue = (
    to: Address[],
    certHashes: `0x${string}`[],
    tokenURIs: string[],
  ) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "batchIssue",
      args: [to, certHashes, tokenURIs],
    });
  };

  const revoke = (tokenIdToRevoke: bigint) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "revoke",
      args: [tokenIdToRevoke],
    });
  };

  return {
    address: contract?.address,
    isDeployed: enabled,

    name,
    symbol,
    totalSupply,
    tokenURI,
    verifyResult,

    isNameLoading,
    isSymbolLoading,
    isTotalSupplyLoading,
    isTokenURILoading,
    isTokenURIError,
    isVerifyLoading,
    isVerifyError,

    issue,
    batchIssue,
    revoke,

    writeData,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,

    refetchTotalSupply,
    refetchVerify,
  };
}
