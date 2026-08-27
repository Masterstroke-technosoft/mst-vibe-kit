# RWA Contract Architecture

## Overview
The Real World Asset (RWA) tokenization platform is built with a modular contract architecture, each contract handling specific responsibilities.

## Contract Structure

### 1. **RWAToken** 🪙
Core ERC20 token contract handling token operations.

**Responsibilities:**
- Minting new tokens
- Burning tokens
- Transfer management
- Pausable functionality

**Key Functions:**
- `mint(address to, uint256 amount)` - Mint new tokens (MINTER_ROLE)
- `burn(address from, uint256 amount)` - Burn tokens (BURNER_ROLE)
- `pause()` - Pause token transfers (PAUSER_ROLE)
- `unpause()` - Resume token transfers (PAUSER_ROLE)
- `totalSupply()` - Get total token supply

**Events:**
- `TokenMinted(address indexed to, uint256 amount)`
- `TokenBurned(address indexed from, uint256 amount)`

---

### 2. **RWAAssetManager** 🏢
Manages real-world asset information, valuation, and pricing.

**Responsibilities:**
- Store asset metadata (ID, type, valuation)
- Manage custodian information
- Track documentation hash
- Manage price per share (oracle updates)

**Key Functions:**
- `setValuation(uint256 newValuation)` - Update asset valuation (ASSET_MANAGER_ROLE)
- `setPricePerShare(uint256 newPrice)` - Update price (ORACLE_ROLE)
- `setCustodian(address newCustodian)` - Update custodian (ASSET_MANAGER_ROLE)
- `setDocumentationHash(bytes32 hash)` - Update docs hash (ASSET_MANAGER_ROLE)

**Data Structure:**
```solidity
struct Asset {
    string assetId;
    string assetType;
    uint256 valuation;
    address custodian;
    bytes32 documentationHash;
    uint256 createdAt;
    bool active;
}
```

---

### 3. **RWACompliance** ✅
Manages KYC verification, whitelist, and blacklist.

**Responsibilities:**
- Maintain whitelist/blacklist
- Verify KYC for addresses
- Enforce transaction limits
- Manage compliance levels

**Key Functions:**
- `addToWhitelist(address account)` - Whitelist address (COMPLIANCE_ROLE)
- `removeFromWhitelist(address account)` - Remove from whitelist
- `addToBlacklist(address account)` - Blacklist address
- `verifyKYC(address account, string kycLevel, uint256 maxAmount)` - Verify KYC (KYC_APPROVER_ROLE)
- `revokeKYC(address account)` - Revoke KYC
- `canTransact(address from, address to, uint256 amount)` - Check transaction eligibility
- `getKYCStatus(address account)` - Get KYC details

**Data Structure:**
```solidity
struct KYCInfo {
    bool verified;
    uint256 verificationDate;
    string kycLevel;
    uint256 maxTransactionAmount;
}
```

---

### 4. **RWAAssetLifecycle** 🔄
Manages asset lifecycle and redemption requests.

**Responsibilities:**
- Track asset status (PENDING, ACTIVE, PAUSED, REDEEMED, TERMINATED)
- Manage redemption requests
- Handle asset activation/pause/resume
- Process redemptions

**Key Functions:**
- `activateAsset()` - Activate asset (LIFECYCLE_MANAGER_ROLE)
- `pauseAsset()` - Pause asset
- `resumeAsset()` - Resume asset
- `requestRedemption(address holder, uint256 shares)` - Create redemption request
- `processRedemption(uint256 requestId)` - Process redemption
- `terminateAsset()` - Terminate asset
- `getAssetStatus()` - Get current status
- `getRedemptionRequest(uint256 requestId)` - Get redemption details
- `getUserRedemptions(address user)` - Get user's redemption history

**Data Structures:**
```solidity
enum AssetStatus { PENDING, ACTIVE, PAUSED, REDEEMED, TERMINATED }

struct RedemptionRequest {
    address holder;
    uint256 shares;
    uint256 requestTime;
    uint256 processedTime;
    bool processed;
    string status;
}
```

---

### 5. **RWADistribution** 💰
Manages income distribution to token holders.

**Responsibilities:**
- Create distributions
- Process distributions
- Track claims
- Manage dividend payouts

**Key Functions:**
- `createDistribution(uint256 amount, string description, uint256 totalShares)` - Create distribution (DISTRIBUTOR_ROLE)
- `processDistribution(uint256 distributionId)` - Process and fund distribution
- `createAndClaimDistribution(address holder, uint256 amount, string description)` - Create and claim immediately
- `claimDistribution(address holder, uint256 distributionId, uint256 shareAmount, uint256 totalShares)` - Claim distribution
- `getDistribution(uint256 distributionId)` - Get distribution info
- `getHolderClaims(address holder)` - Get holder's claims
- `getAvailableDistributions(uint256[] distributionIds, address holder)` - Get available claims

**Data Structures:**
```solidity
struct Distribution {
    uint256 amount;
    uint256 timestamp;
    string description;
    uint256 totalShares;
    bool processed;
}

struct Claim {
    address holder;
    uint256 distributionId;
    uint256 amount;
    bool claimed;
    uint256 claimTime;
}
```

---

## Role Hierarchy

| Role | Contract | Purpose |
|------|----------|---------|
| `DEFAULT_ADMIN_ROLE` | All | Administrative access |
| `MINTER_ROLE` | RWAToken | Issue new shares |
| `BURNER_ROLE` | RWAToken | Burn shares |
| `PAUSER_ROLE` | RWAToken | Pause/unpause transfers |
| `ASSET_MANAGER_ROLE` | RWAAssetManager | Manage asset info |
| `ORACLE_ROLE` | RWAAssetManager | Update prices |
| `COMPLIANCE_ROLE` | RWACompliance | Manage whitelist/blacklist |
| `KYC_APPROVER_ROLE` | RWACompliance | Verify KYC |
| `LIFECYCLE_MANAGER_ROLE` | RWAAssetLifecycle | Manage asset lifecycle |
| `DISTRIBUTOR_ROLE` | RWADistribution | Create distributions |

---

## Deployment Flow

1. Deploy **RWAToken** with name and symbol
2. Deploy **RWAAssetManager** with asset details and initial price
3. Deploy **RWACompliance** for compliance management
4. Deploy **RWAAssetLifecycle** for lifecycle management
5. Deploy **RWADistribution** with token address

## Integration Example

```typescript
// Frontend integration
const contracts = {
  token: RWAToken,
  assetManager: RWAAssetManager,
  compliance: RWACompliance,
  lifecycle: RWAAssetLifecycle,
  distribution: RWADistribution
};

// User Flow
1. Connect wallet
2. Check whitelist status (compliance)
3. View asset info (assetManager)
4. View share balance (token)
5. Check asset status (lifecycle)
6. Request redemption (lifecycle)
7. Check distributions (distribution)
```

---

## Security Considerations

✅ **Implemented:**
- Access Control with granular roles
- Reentrancy protection (ReentrancyGuard)
- Pausable token transfers
- Whitelist/blacklist enforcement
- KYC verification with transaction limits

⚠️ **Recommendations:**
- Implement TimeLocker for critical functions
- Add withdrawal delay for redemptions
- Implement rate limiting for distributions
- Regular security audits before mainnet deployment

---

## Frontend Hooks

The frontend includes hooks for easy contract interaction:

- `useTokenInfo()` - Get token name, symbol, total supply
- `useAssetInfo()` - Get asset details and valuation
- `useComplianceInfo()` - Get KYC and whitelist status
- `useLifecycleInfo()` - Get asset status
- `useClaimDistribution()` - Claim dividends
- `useAssetLifecycleActions()` - Manage asset lifecycle

---

## Contract Addresses (Example)

Once deployed, contracts will be available at:
```json
{
  "RWAToken": "0x...",
  "RWAAssetManager": "0x...",
  "RWACompliance": "0x...",
  "RWAAssetLifecycle": "0x...",
  "RWADistribution": "0x..."
}
```
