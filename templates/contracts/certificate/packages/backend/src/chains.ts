import { defineChain } from "viem";

// Mirrors packages/frontend/lib/chains.ts — duplicated here since the
// backend is a separate package and doesn't depend on the frontend.
export const mstTestnet = defineChain({
  id: 91562037,
  name: "MST Testnet",
  nativeCurrency: { name: "MST", symbol: "MST", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnetrpc.mstblockchain.com"] },
  },
  blockExplorers: {
    default: { name: "MSTScan", url: "https://testnet.mstscan.com" },
  },
  testnet: true,
});

export const mstMainnet = defineChain({
  id: 4646,
  name: "MST Mainnet",
  nativeCurrency: { name: "MST", symbol: "MST", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mariorpc.mstblockchain.com"] },
  },
  blockExplorers: {
    default: { name: "MSTScan", url: "https://mstscan.com" },
  },
});
