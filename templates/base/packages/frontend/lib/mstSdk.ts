import { Client } from "@mstblockchain/mst-sdk";
import { mstTestnet } from "./chains";

// The SDK talks to the chain over plain JSON-RPC, so it works for
// read-only calls (balances, gas estimates, receipts) without ever
// needing a private key. `createMstClient` optionally accepts one for
// flows that sign and send (see hooks/useMstWallet.ts).
export const  MST_RPC_URL = mstTestnet.rpcUrls.default.http[0];

export function createMstClient(privateKey?: string): InstanceType<typeof Client> {
  return privateKey ? new Client(MST_RPC_URL, privateKey) : Client.createRandom(MST_RPC_URL);
}
