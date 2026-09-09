
"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function WalletPanel() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    const connector = connectors[0];

    if (!connector) {
      return;
    }

    connect({ connector });
  };

  return (
    <div className="rounded-xl border p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Wallet</h2>
        <p className="text-sm text-gray-500">
          Connect your wallet to interact with DemoNFT.
        </p>
      </div>

      {!isConnected ? (
        <button
          type="button"
          onClick={handleConnect}
          disabled={isPending || connectors.length === 0}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Connected Address</p>
            <p className="break-all font-mono text-sm">
              {address}
            </p>
          </div>

          {chain && (
            <div>
              <p className="text-sm text-gray-500">Network</p>
              <p className="font-medium">
                {chain.name}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => disconnect()}
            className="rounded-lg border px-4 py-2"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
