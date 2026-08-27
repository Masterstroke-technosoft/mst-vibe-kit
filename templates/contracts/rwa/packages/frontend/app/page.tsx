"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { ConnectButton } from "@/components/ConnectButton";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { NetworkWarning } from "@/components/NetworkWarning";
import { useTokenInfo, useAssetInfo, useComplianceInfo, useLifecycleInfo } from "@/hooks/useRWAContracts";
import { useShareBalance } from "@/hooks/useShareBalance";
import { useRedeemShares } from "@/hooks/useRedemption";

export default function Home() {
  const { name, symbol, totalSupply } = useTokenInfo();
  const { assetInfo, pricePerShare } = useAssetInfo();
  const { isWhitelisted, isBlacklisted, kycStatus } = useComplianceInfo();
  const { assetStatus } = useLifecycleInfo();
  const { data: balance, refetch } = useShareBalance();
  const { redeem, isPending } = useRedeemShares();
  const [shares, setShares] = useState("");

  const formatPrice = (price: any) => {
    if (price === undefined) return "…";
    const num = Number(price);
    return `$${(num / 100).toFixed(2)}`;
  };

  const asset = assetInfo as any;
  const kyc = kycStatus as any;

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
        main { padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 50px; color: white; }
        .header h1 { font-size: 3em; font-weight: 700; margin-bottom: 10px; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
        .header p { font-size: 1.1em; opacity: 0.95; margin-bottom: 20px; }
        .controls { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 40px; }
        .controls > * { flex-shrink: 0; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; max-width: 1400px; margin: 0 auto; }
        .card { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); transition: transform 0.3s, box-shadow 0.3s; }
        .card:hover { transform: translateY(-5px); box-shadow: 0 15px 50px rgba(0,0,0,0.3); }
        .card h3 { color: #333; font-size: 1.3em; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #667eea; }
        .stat { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
        .stat:last-child { border-bottom: none; }
        .stat-label { color: #666; font-size: 0.95em; font-weight: 500; }
        .stat-value { color: #667eea; font-size: 1.2em; font-weight: 700; }
        .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 600; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        .input-group { display: flex; gap: 10px; margin-top: 15px; }
        input { flex: 1; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1em; transition: border-color 0.3s; }
        input:focus { outline: none; border-color: #667eea; }
        button { padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 1em; font-weight: 600; cursor: pointer; transition: background 0.3s, transform 0.1s; }
        button:hover { background: #764ba2; }
        button:active { transform: scale(0.98); }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 4px; color: #856404; margin: 15px 0; }
        .icon { font-size: 2em; margin-bottom: 10px; }
        .empty-state { text-align: center; color: #999; padding: 40px 20px; }
        .grid-full { grid-column: 1 / -1; }
        .compliance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px; }
        .compliance-item { padding: 12px; background: #f8f9fa; border-radius: 8px; text-align: center; }
        .compliance-label { font-size: 0.85em; color: #666; margin-bottom: 6px; }
        .compliance-status { font-weight: 700; color: #667eea; }
      `}</style>

      <div className="header">
        <h1>{"{{PROJECT_NAME}}"}</h1>
        <p>Real World Asset Trading Platform</p>
        <p style={{ fontSize: "0.95em", opacity: 0.9 }}>Tokenized fractional ownership with compliance</p>
      </div>

      <div className="controls">
        <ConnectButton />
        <NetworkSwitcher />
        <NetworkWarning />
      </div>

      <div className="dashboard">
        {/* Token Overview Card */}
        <div className="card">
          <div className="icon">🪙</div>
          <h3>Token Overview</h3>
          {name && symbol ? (
            <>
              <div className="stat">
                <span className="stat-label">Token Name</span>
                <span className="stat-value" style={{ fontSize: "1em", color: "#333" }}>{name}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Symbol</span>
                <span className="stat-value" style={{ fontSize: "1em", color: "#333" }}>{symbol}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Supply</span>
                <span className="stat-value">{totalSupply ? formatEther(totalSupply as bigint) : "…"}</span>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Deploy contracts with npm run deploy:testnet</p>
            </div>
          )}
        </div>

        {/* Asset Information Card */}
        <div className="card">
          <div className="icon">🏢</div>
          <h3>Asset Information</h3>
          {asset ? (
            <>
              <div className="stat">
                <span className="stat-label">Asset ID</span>
                <span className="stat-value" style={{ fontSize: "0.95em", color: "#333" }}>{asset.assetId || "…"}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Asset Type</span>
                <span className="stat-value" style={{ fontSize: "0.95em", color: "#333" }}>{asset.assetType || "…"}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Valuation</span>
                <span className="stat-value">${asset.valuation ? (Number(asset.valuation) / 1e18).toLocaleString() : "…"}</span>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Loading asset details…</p>
            </div>
          )}
        </div>

        {/* Pricing Card */}
        <div className="card">
          <div className="icon">💰</div>
          <h3>Pricing</h3>
          <div className="stat">
            <span className="stat-label">Price Per Share</span>
            <span className="stat-value">{formatPrice(pricePerShare)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Price Update Status</span>
            <span className="badge badge-success">Live</span>
          </div>
        </div>

        {/* Asset Status Card */}
        <div className="card">
          <div className="icon">📊</div>
          <h3>Asset Status</h3>
          <div className="stat">
            <span className="stat-label">Current Status</span>
            <span className="badge" style={{
              background: assetStatus === "ACTIVE" ? "#d4edda" : assetStatus === "PAUSED" ? "#fff3cd" : "#f8d7da",
              color: assetStatus === "ACTIVE" ? "#155724" : assetStatus === "PAUSED" ? "#856404" : "#721c24"
            }}>
              {assetStatus || "…"}
            </span>
          </div>
        </div>

        {/* User Balance Card */}
        <div className="card">
          <div className="icon">👛</div>
          <h3>Your Portfolio</h3>
          {balance !== undefined ? (
            <div className="stat">
              <span className="stat-label">Share Balance</span>
              <span className="stat-value">{formatEther(balance as bigint)}</span>
            </div>
          ) : (
            <div className="empty-state">
              <p>Connect wallet to view balance</p>
            </div>
          )}
        </div>

        {/* Compliance Card */}
        <div className="card">
          <div className="icon">✅</div>
          <h3>Compliance Status</h3>
          {isWhitelisted !== undefined ? (
            <>
              <div className="compliance-grid">
                <div className="compliance-item">
                  <div className="compliance-label">Whitelisted</div>
                  <div className="compliance-status">
                    {isWhitelisted ? (
                      <span className="badge badge-success">Yes</span>
                    ) : (
                      <span className="badge badge-warning">No</span>
                    )}
                  </div>
                </div>
                <div className="compliance-item">
                  <div className="compliance-label">Blacklisted</div>
                  <div className="compliance-status">
                    {isBlacklisted ? (
                      <span className="badge badge-danger">Yes</span>
                    ) : (
                      <span className="badge badge-success">No</span>
                    )}
                  </div>
                </div>
              </div>
              {kyc && kyc[0] && (
                <div style={{ marginTop: "15px", padding: "12px", background: "#f8f9fa", borderRadius: "8px" }}>
                  <div className="compliance-label">KYC Level</div>
                  <div className="compliance-status">{kyc[1] || "Not Verified"}</div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>Connect wallet to view compliance</p>
            </div>
          )}
        </div>

        {/* Redemption Card - Full Width */}
        <div className="card grid-full">
          <div className="icon">🔄</div>
          <h3>Request Redemption</h3>
          {isWhitelisted === true && balance && Number(balance) > 0 ? (
            <>
              <p style={{ color: "#666", marginBottom: "15px" }}>
                Request to redeem your shares. Once approved, you&apos;ll receive funds equivalent to your share value.
              </p>
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Shares to redeem"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  step="0.01"
                  min="0"
                />
                <button
                  disabled={isPending || !shares}
                  onClick={() => {
                    redeem(shares);
                    setShares("");
                    setTimeout(refetch, 3000);
                  }}
                  style={{ minWidth: "180px" }}
                >
                  {isPending ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </>
          ) : isWhitelisted === false ? (
            <div className="warning">
              ⚠️ Your wallet isn&apos;t whitelisted yet. Contact the compliance team to enable trading.
            </div>
          ) : (
            <div className="empty-state">
              <p>Connect wallet to request redemption</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
