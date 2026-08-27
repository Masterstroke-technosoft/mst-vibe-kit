# RWA Frontend Integration Guide

## Overview
The frontend is built with React, Next.js, and Wagmi for blockchain interaction. It provides a comprehensive UI for managing RWA investments.

## Project Structure

```
packages/frontend/
├── app/
│   ├── page.tsx          # Main dashboard
│   └── layout.tsx        # Root layout
├── components/
│   ├── ConnectButton.tsx
│   ├── NetworkSwitcher.tsx
│   └── NetworkWarning.tsx
├── hooks/
│   ├── useRWAContracts.ts      # Unified contract imports
│   ├── useRWAToken.ts          # Legacy (kept for compatibility)
│   ├── useShareBalance.ts
│   ├── useWhitelist.ts
│   ├── useRedemption.ts
│   ├── useDistribution.ts      # NEW: Distribution claims
│   └── useAssetLifecycle.ts    # NEW: Lifecycle management
├── lib/
│   └── chains.ts               # Network configuration
└── types/
    └── index.ts                # TypeScript definitions
```

## Key Hooks

### `useTokenInfo()`
Get core token information.

```typescript
const { name, symbol, totalSupply, tokenAddress } = useTokenInfo();
```

**Returns:**
- `name` - Token name
- `symbol` - Token symbol
- `totalSupply` - Total supply in wei
- `tokenAddress` - Contract address

### `useAssetInfo()`
Get real-world asset details.

```typescript
const { assetInfo, pricePerShare, assetManagerAddress } = useAssetInfo();
```

**Returns:**
- `assetInfo` - Full asset details
  - `assetId` - Asset identifier
  - `assetType` - Type of asset
  - `valuation` - Current valuation
  - `custodian` - Custodian address
  - `documentationHash` - IPFS/Hash reference
  - `createdAt` - Timestamp
  - `active` - Active status
- `pricePerShare` - Current price in cents USD
- `assetManagerAddress` - Contract address

### `useComplianceInfo()`
Check user's compliance status.

```typescript
const { isWhitelisted, isBlacklisted, kycStatus, complianceAddress } = useComplianceInfo();
```

**Returns:**
- `isWhitelisted` - Boolean whitelist status
- `isBlacklisted` - Boolean blacklist status
- `kycStatus` - Tuple of `[verified, kycLevel, verificationDate]`
- `complianceAddress` - Contract address

### `useLifecycleInfo()`
Get current asset lifecycle status.

```typescript
const { assetStatus, lifecycleAddress } = useLifecycleInfo();
```

**Returns:**
- `assetStatus` - One of: PENDING, ACTIVE, PAUSED, REDEEMED, TERMINATED
- `lifecycleAddress` - Contract address

### `useShareBalance()`
Get user's share balance.

```typescript
const { data: balance, refetch } = useShareBalance();
```

**Returns:**
- `data` - Balance in wei
- `refetch` - Function to refresh balance

### `useRedeemShares()`
Request share redemption.

```typescript
const { redeem, isPending, hash } = useRedeemShares();

// Usage
redeem("100.5");
```

### `useClaimDistribution()`
Claim distribution/dividend.

```typescript
const { claim, isPending, hash } = useClaimDistribution();

// Usage
claim(holderAddress, distributionId, shareAmount, totalShares);
```

### `useAssetLifecycleActions()`
Manage asset lifecycle (admin only).

```typescript
const { activateAsset, pauseAsset, resumeAsset, terminateAsset, isPending } = useAssetLifecycleActions();

// Usage
await activateAsset();
await pauseAsset();
```

## UI Components

### Dashboard Page (`app/page.tsx`)

The main dashboard displays:

1. **Token Overview Card**
   - Token name and symbol
   - Total supply

2. **Asset Information Card**
   - Asset ID
   - Asset type
   - Valuation

3. **Pricing Card**
   - Price per share (formatted as USD)
   - Price update status

4. **Asset Status Card**
   - Current lifecycle status with color coding
   - Status badge (Active, Paused, etc.)

5. **Your Portfolio Card**
   - User's share balance
   - Connected wallet info

6. **Compliance Status Card**
   - Whitelist status
   - Blacklist status
   - KYC level and verification date

7. **Redemption Card**
   - Input for shares to redeem
   - Submit redemption request button
   - Compliance warnings if not whitelisted

## Styling

The UI uses inline CSS with:

- **Color Scheme:**
  - Primary: `#667eea` (purple)
  - Secondary: `#764ba2` (dark purple)
  - Success: `#155724` (green)
  - Danger: `#721c24` (red)
  - Warning: `#856404` (orange)

- **Layout:**
  - Responsive grid layout
  - Cards with hover effects
  - Smooth transitions

- **Typography:**
  - System font stack
  - Large, readable text
  - Clear hierarchy

## Network Support

The frontend supports multiple networks:

```typescript
// From lib/chains.ts
export const mstMainnet = {
  id: 1, // Your mainnet ID
  name: "MST Mainnet",
  // ...
};
```

Contracts are deployed to both testnet and mainnet, with automatic network detection.

## Usage Examples

### Example 1: Display Asset Valuation

```typescript
function AssetCard() {
  const { assetInfo } = useAssetInfo();
  
  if (!assetInfo) return <div>Loading...</div>;
  
  return (
    <div>
      <h3>{assetInfo.assetId}</h3>
      <p>Type: {assetInfo.assetType}</p>
      <p>Value: ${(Number(assetInfo.valuation) / 1e18).toLocaleString()}</p>
    </div>
  );
}
```

### Example 2: Compliance Check

```typescript
function ComplianceWarning() {
  const { isWhitelisted, kycStatus } = useComplianceInfo();
  
  if (isWhitelisted === false) {
    return <Alert>You need to be whitelisted to trade</Alert>;
  }
  
  if (kycStatus && !kycStatus[0]) {
    return <Alert>Your KYC verification is pending</Alert>;
  }
  
  return <Success>Your account is compliant</Success>;
}
```

### Example 3: Redemption Flow

```typescript
function RedeemWidget() {
  const [amount, setAmount] = useState("");
  const { redeem, isPending } = useRedeemShares();
  const { balance } = useShareBalance();
  
  const handleRedeem = () => {
    if (amount && Number(amount) <= Number(balance)) {
      redeem(amount);
    }
  };
  
  return (
    <div>
      <input 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Shares to redeem"
      />
      <button onClick={handleRedeem} disabled={isPending}>
        {isPending ? "Processing..." : "Redeem"}
      </button>
    </div>
  );
}
```

## Best Practices

1. **Always check connection status before operations**
   ```typescript
   const { address } = useAccount();
   if (!address) return <ConnectButton />;
   ```

2. **Handle loading states**
   ```typescript
   if (data === undefined) return <Spinner />;
   ```

3. **Refetch after transactions**
   ```typescript
   await redeem(shares);
   refetch(); // Re-fetch balance after redemption
   ```

4. **Validate inputs**
   ```typescript
   const isValid = amount && Number(amount) > 0 && Number(amount) <= balance;
   ```

5. **Format numbers for display**
   ```typescript
   const formatted = (Number(price) / 100).toFixed(2); // $X.XX
   ```

## Environment Setup

1. Create `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESSES={"testnet": {...}, "mainnet": {...}}
NEXT_PUBLIC_NETWORK_ID=1
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Open `http://localhost:3000`

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Vercel or your hosting:
```bash
vercel deploy
```

## Troubleshooting

**Problem:** Contracts not found
- **Solution:** Ensure contracts are deployed and addresses are in deployments config

**Problem:** Whitelist errors
- **Solution:** Ask compliance admin to call `addToWhitelist()` or `verifyKYC()`

**Problem:** Balance not updating
- **Solution:** Call `refetch()` after transaction confirmation

**Problem:** Network mismatch
- **Solution:** Check your wallet is connected to correct network

## Additional Resources

- [Wagmi Documentation](https://wagmi.sh)
- [Next.js Documentation](https://nextjs.org)
- [Viem Documentation](https://viem.sh)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
