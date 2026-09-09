
"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseAbi, type Address } from "viem";

const DEMO_NFT_ADDRESS = process.env
  .NEXT_PUBLIC_DEMO_NFT_ADDRESS as Address;

const demoNFTAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function owner() view returns (address)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function mint(address to)",
  "function transferFrom(address from, address to, uint256 tokenId)",
]);

export function useDemoNFT(tokenId?: bigint) {
  /*
   * Collection information
   */

  const {
    data: name,
    isLoading: isNameLoading,
    refetch: refetchName,
  } = useReadContract({
    address: DEMO_NFT_ADDRESS,
    abi: demoNFTAbi,
    functionName: "name",
  });

  const {
    data: symbol,
    isLoading: isSymbolLoading,
    refetch: refetchSymbol,
  } = useReadContract({
    address: DEMO_NFT_ADDRESS,
    abi: demoNFTAbi,
    functionName: "symbol",
  });

  const {
    data: totalSupply,
    isLoading: isTotalSupplyLoading,
    refetch: refetchTotalSupply,
  } = useReadContract({
    address: DEMO_NFT_ADDRESS,
    abi: demoNFTAbi,
    functionName: "totalSupply",
  });

  const {
    data: contractOwner,
    isLoading: isOwnerLoading,
    refetch: refetchOwner,
  } = useReadContract({
    address: DEMO_NFT_ADDRESS,
    abi: demoNFTAbi,
    functionName: "owner",
  });

  /*
   * Individual NFT information
   */

  const {
    data: tokenOwner,
    isLoading: isTokenOwnerLoading,
    isError: isTokenOwnerError,
    refetch: refetchTokenOwner,
  } = useReadContract({
    address: DEMO_NFT_ADDRESS,
    abi: demoNFTAbi,
    functionName: "ownerOf",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });

  const {
    data: tokenURI,
    isLoading: isTokenURILoading,
    isError: isTokenURIError,
    refetch: refetchTokenURI,
  } = useReadContract({
    address: DEMO_NFT_ADDRESS,
    abi: demoNFTAbi,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });

  /*
   * Write operations
   */

  const {
    data: writeData,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  /*
   * Transaction confirmation
   */

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTransactionError,
  } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  /*
   * Mint NFT
   */

  const mint = (to: Address) => {
    writeContract({
      address: DEMO_NFT_ADDRESS,
      abi: demoNFTAbi,
      functionName: "mint",
      args: [to],
    });
  };

  /*
   * Transfer NFT
   */

  const transfer = (
    from: Address,
    to: Address,
    tokenIdToTransfer: bigint,
  ) => {
    writeContract({
      address: DEMO_NFT_ADDRESS,
      abi: demoNFTAbi,
      functionName: "transferFrom",
      args: [
        from,
        to,
        tokenIdToTransfer,
      ],
    });
  };

  return {
    /*
     * Contract information
     */
    name,
    symbol,
    totalSupply,
    contractOwner,

    /*
     * Selected NFT information
     */
    tokenOwner,
    tokenURI,

    /*
     * Loading states
     */
    isNameLoading,
    isSymbolLoading,
    isTotalSupplyLoading,
    isOwnerLoading,
    isTokenOwnerLoading,
    isTokenURILoading,

    /*
     * NFT read errors
     */
    isTokenOwnerError,
    isTokenURIError,

    /*
     * Write operations
     */
    mint,
    transfer,

    /*
     * Transaction states
     */
    writeData,
    isWritePending,
    isConfirming,
    isConfirmed,
    isTransactionError,
    writeError,

    /*
     * Refetch collection data
     */
    refetchName,
    refetchSymbol,
    refetchTotalSupply,
    refetchOwner,

    /*
     * Refetch NFT data
     */
    refetchTokenOwner,
    refetchTokenURI,
  };
}
