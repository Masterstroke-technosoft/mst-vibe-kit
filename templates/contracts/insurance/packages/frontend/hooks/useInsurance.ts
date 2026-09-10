"use client";

import { useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import type { Address } from "viem";
import { deployments } from "{{PROJECT_NAME}}-shared";
import { mstMainnet } from "@/lib/chains";

/**
 * Logs a failed read with enough context to tell a bad deployment/ABI
 * apart from a network problem — e.g. "Failed to fetch" / "NetworkError"
 * almost always means the RPC request itself never got a response (wrong
 * network, RPC down, or blocked by CORS), not a contract-level revert.
 */
function useLogReadError(
  label: string,
  error: Error | null,
  contractAddress: Address | undefined,
  network: string,
) {
  useEffect(() => {
    if (!error) return;
    const looksLikeNetworkFailure = /failed to fetch|networkerror|cors/i.test(error.message);
    console.error(
      `[useInsurance] ${label} read failed${looksLikeNetworkFailure ? " (looks like a network/CORS issue, not a contract error — check the Network tab for a blocked/failed request)" : ""}:`,
      error,
      { contractAddress, network },
    );
  }, [label, error, contractAddress, network]);
}

// `abi` is typed loosely (not as a const-asserted literal) since it comes
// from the JSON written by the deploy script — wagmi's payable/non-payable
// overload resolution needs a literal ABI type to pick the `value` overload,
// so payable calls below (purchasePolicy, fundPool) are written against
// `any` rather than fighting that inference.
type DeployedContract = { address: Address; abi: readonly unknown[] };

export const POLICY_STATUS = ["Active", "PaidOut", "Expired"] as const;
export type PolicyStatus = (typeof POLICY_STATUS)[number];

export type Policy = {
  holder: Address;
  coverageAmount: bigint;
  premiumPaid: bigint;
  triggerThreshold: bigint;
  expiresAt: bigint;
  metricType: string;
  status: number;
};

function useInsuranceContract(): DeployedContract | undefined {
  const { chainId } = useAccount();
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  return (deployments as Record<string, any>)[network]?.ParametricInsurance as
    | DeployedContract
    | undefined;
}

export function useInsurance(policyId?: bigint, previewCoverageAmount?: bigint) {
  const { chainId } = useAccount();
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  const contract = useInsuranceContract();
  const enabled = Boolean(contract);
  const base = contract
    ? { address: contract.address, abi: contract.abi }
    : { address: undefined, abi: undefined };

  const {
    data: oracle,
    isLoading: isOracleLoading,
    isError: isOracleError,
    error: oracleError,
    refetch: refetchOracle,
  } = useReadContract({ ...base, functionName: "oracle", query: { enabled } });
  useLogReadError("oracle()", oracleError, contract?.address, network);

  const {
    data: owner,
    isLoading: isOwnerLoading,
    isError: isOwnerError,
    error: ownerError,
  } = useReadContract({ ...base, functionName: "owner", query: { enabled } });
  useLogReadError("owner()", ownerError, contract?.address, network);

  const {
    data: premiumRateBps,
    isLoading: isPremiumRateLoading,
    refetch: refetchPremiumRate,
  } = useReadContract({ ...base, functionName: "premiumRateBps", query: { enabled } });

  const {
    data: poolBalance,
    isLoading: isPoolBalanceLoading,
    isError: isPoolBalanceError,
    error: poolBalanceError,
    refetch: refetchPoolBalance,
  } = useReadContract({ ...base, functionName: "poolBalance", query: { enabled } });
  useLogReadError("poolBalance()", poolBalanceError, contract?.address, network);

  const {
    data: totalPolicies,
    isLoading: isTotalPoliciesLoading,
    refetch: refetchTotalPolicies,
  } = useReadContract({ ...base, functionName: "totalPolicies", query: { enabled } });

  const {
    data: policyData,
    isLoading: isPolicyLoading,
    refetch: refetchPolicy,
  } = useReadContract({
    ...base,
    functionName: "getPolicy",
    args: policyId !== undefined ? [policyId] : undefined,
    query: { enabled: enabled && policyId !== undefined },
  });

  const policy = policyData as Policy | undefined;

  const {
    data: premiumPreview,
    isLoading: isPremiumPreviewLoading,
    isError: isPremiumPreviewError,
    error: premiumPreviewError,
  } = useReadContract({
    ...base,
    functionName: "calculatePremium",
    args: previewCoverageAmount !== undefined ? [previewCoverageAmount] : undefined,
    query: { enabled: enabled && previewCoverageAmount !== undefined },
  });
  useLogReadError("calculatePremium()", premiumPreviewError, contract?.address, network);

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

  const purchasePolicy = (
    coverageAmount: bigint,
    triggerThreshold: bigint,
    durationSeconds: bigint,
    metricType: string,
    premium: bigint,
  ) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "purchasePolicy",
      args: [coverageAmount, triggerThreshold, durationSeconds, metricType],
      value: premium,
    } as any);
  };

  const submitOracleData = (targetPolicyId: bigint, observedValue: bigint) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "submitOracleData",
      args: [targetPolicyId, observedValue],
    });
  };

  const expirePolicy = (targetPolicyId: bigint) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "expirePolicy",
      args: [targetPolicyId],
    });
  };

  const setOracle = (newOracle: Address) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "setOracle",
      args: [newOracle],
    });
  };

  const setPremiumRateBps = (bps: bigint) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "setPremiumRateBps",
      args: [bps],
    });
  };

  const fundPool = (amount: bigint) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "fundPool",
      value: amount,
    } as any);
  };

  const withdrawPool = (amount: bigint) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "withdrawPool",
      args: [amount],
    });
  };

  return {
    address: contract?.address,
    isDeployed: enabled,

    oracle,
    owner,
    premiumRateBps,
    poolBalance,
    totalPolicies,
    policy,
    premiumPreview,

    isOracleLoading,
    isOracleError,
    isOwnerLoading,
    isOwnerError,
    isPremiumRateLoading,
    isPoolBalanceLoading,
    isPoolBalanceError,
    isTotalPoliciesLoading,
    isPolicyLoading,
    isPremiumPreviewLoading,
    isPremiumPreviewError,

    purchasePolicy,
    submitOracleData,
    expirePolicy,
    setOracle,
    setPremiumRateBps,
    fundPool,
    withdrawPool,

    writeData,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,

    refetchOracle,
    refetchPremiumRate,
    refetchPoolBalance,
    refetchTotalPolicies,
    refetchPolicy,
  };
}
