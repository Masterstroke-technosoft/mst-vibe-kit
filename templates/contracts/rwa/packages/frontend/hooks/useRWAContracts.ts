"use client";

import { useAccount, useReadContract } from "wagmi";
import { deployments } from "{{PROJECT_NAME}}-shared";
import { mstMainnet } from "@/lib/chains";

export function useRWAContracts() {
  const { chainId } = useAccount();
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  const deploymentData = (deployments as Record<string, any>)[network] || {};

  const contracts = {
    token: deploymentData?.RWAToken as { address: `0x${string}`; abi: any } | undefined,
    assetManager: deploymentData?.RWAAssetManager as { address: `0x${string}`; abi: any } | undefined,
    compliance: deploymentData?.RWACompliance as { address: `0x${string}`; abi: any } | undefined,
    lifecycle: deploymentData?.RWAAssetLifecycle as { address: `0x${string}`; abi: any } | undefined,
    distribution: deploymentData?.RWADistribution as { address: `0x${string}`; abi: any } | undefined,
  };

  return contracts;
}

export function useTokenInfo() {
  const { token } = useRWAContracts();

  const { data: name } = useReadContract({
    address: token?.address,
    abi: token?.abi,
    functionName: "name",
    query: { enabled: Boolean(token) },
  });

  const { data: symbol } = useReadContract({
    address: token?.address,
    abi: token?.abi,
    functionName: "symbol",
    query: { enabled: Boolean(token) },
  });

  const { data: totalSupply } = useReadContract({
    address: token?.address,
    abi: token?.abi,
    functionName: "totalSupply",
    query: { enabled: Boolean(token) },
  });

  return { name, symbol, totalSupply, tokenAddress: token?.address };
}

export function useAssetInfo() {
  const { assetManager } = useRWAContracts();

  const { data: valuation } = useReadContract({
    address: assetManager?.address,
    abi: assetManager?.abi,
    functionName: "assetDetails",
    query: { enabled: Boolean(assetManager) },
  });

  const { data: pricePerShare } = useReadContract({
    address: assetManager?.address,
    abi: assetManager?.abi,
    functionName: "pricePerShare",
    query: { enabled: Boolean(assetManager) },
  });

  return { assetInfo: valuation, pricePerShare, assetManagerAddress: assetManager?.address };
}

export function useComplianceInfo() {
  const { address: account } = useAccount();
  const { compliance } = useRWAContracts();

  const { data: isWhitelisted } = useReadContract({
    address: compliance?.address,
    abi: compliance?.abi,
    functionName: "isWhitelisted",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(compliance && account) },
  });

  const { data: isBlacklisted } = useReadContract({
    address: compliance?.address,
    abi: compliance?.abi,
    functionName: "isBlacklisted",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(compliance && account) },
  });

  const { data: kycStatus } = useReadContract({
    address: compliance?.address,
    abi: compliance?.abi,
    functionName: "getKYCStatus",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(compliance && account) },
  });

  return { isWhitelisted, isBlacklisted, kycStatus, complianceAddress: compliance?.address };
}

export function useLifecycleInfo() {
  const { lifecycle } = useRWAContracts();

  const { data: assetStatus } = useReadContract({
    address: lifecycle?.address,
    abi: lifecycle?.abi,
    functionName: "getAssetStatus",
    query: { enabled: Boolean(lifecycle) },
  });

  return { assetStatus, lifecycleAddress: lifecycle?.address };
}
