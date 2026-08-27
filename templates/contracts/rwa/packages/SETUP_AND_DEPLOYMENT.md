# RWA Platform - Setup and Deployment Guide

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- A wallet (MetaMask recommended)
- Testnet funds (for deployment testing)

### Installation

1. **Install dependencies**
```bash
cd packages/contracts
npm install

cd ../frontend
npm install
```

2. **Create environment files**

**contracts/.env**
```env
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_key
TESTNET_RPC_URL=https://your-testnet-rpc
MAINNET_RPC_URL=https://your-mainnet-rpc
```

**frontend/.env.local**
```env
NEXT_PUBLIC_NETWORK_ID=your_chain_id
NEXT_PUBLIC_TESTNET_RPC=https://your-testnet-rpc
NEXT_PUBLIC_MAINNET_RPC=https://your-mainnet-rpc
```

## Contract Deployment

### Step 1: Deploy to Testnet

```bash
cd packages/contracts
npm run deploy:testnet
```

This will:
1. Compile all contracts
2. Deploy all 5 contract modules
3. Output deployment addresses to `deployments/testnet.json`

**Expected Output:**
```
RWAToken deployed: 0x1234...
RWAAssetManager deployed: 0x5678...
RWACompliance deployed: 0x9abc...
RWAAssetLifecycle deployed: 0xdef0...
RWADistribution deployed: 0x1111...
```

### Step 2: Verify Contract Configuration

Check `packages/contracts/deployments/testnet.json`:

```json
{
  "RWAToken": {
    "address": "0x...",
    "constructorArguments": ["Main Street Property Shares", "MSPS"]
  },
  "RWAAssetManager": {
    "address": "0x...",
    "constructorArguments": [...]
  },
  // ... other contracts
}
```

### Step 3: Share Deployment Info with Frontend

Copy deployment addresses to the shared package:

**packages/shared/deployments.ts**
```typescript
export const deployments = {
  testnet: {
    RWAToken: {
      address: "0x...",
      abi: RWATokenABI
    },
    RWAAssetManager: {
      address: "0x...",
      abi: RWAAssetManagerABI
    },
    RWACompliance: {
      address: "0x...",
      abi: RWAComplianceABI
    },
    RWAAssetLifecycle: {
      address: "0x...",
      abi: RWAAssetLifecycleABI
    },
    RWADistribution: {
      address: "0x...",
      abi: RWADistributionABI
    }
  },
  mainnet: {
    // Mainnet addresses here
  }
};
```

## Contract Setup (Admin Tasks)

After deployment, run these setup steps:

### 1. Activate Asset
```bash
# Via contract interaction tool or script
lifecycle.activateAsset()
```

### 2. Whitelist Initial Users
```bash
# For each user address
compliance.verifyKYC(userAddress, "LEVEL_1", maxTransactionAmount)
```

### 3. Mint Initial Supply
```bash
# Mint shares to team/initial holders
token.mint(recipientAddress, shareAmount)
```

### 4. Set Custodian
```bash
assetManager.setCustodian(custodianAddress)
```

### 5. Set Documentation Hash
```bash
# Upload docs to IPFS and set hash
assetManager.setDocumentationHash("0x...")
```

## Frontend Setup

### Step 1: Install Dependencies
```bash
cd packages/frontend
npm install
```

### Step 2: Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_NETWORK_ID=97  # BSC Testnet
NEXT_PUBLIC_TESTNET_RPC=https://data-seed-prebsc-1-e.binance.org:8545
NEXT_PUBLIC_CONTRACT_ADDRESSES={"testnet": {"RWAToken": {"address": "0x..."}}}
```

### Step 3: Run Development Server
```bash
npm run dev
```

Open `http://localhost:3000`

### Step 4: Test the Application

1. **Connect Wallet**
   - Click "Connect"
   - Select your wallet
   - Accept permissions

2. **Verify Data Display**
   - See token name and symbol
   - Check asset information
   - View price per share

3. **Test Compliance Check**
   - If not whitelisted, you should see a warning
   - Ask admin to whitelist your address

4. **Test Redemption** (if whitelisted)
   - Enter number of shares
   - Click "Submit Request"
   - Confirm transaction

## Testing

### Contract Tests

Run the test suite:
```bash
cd packages/contracts
npm run test
```

Tests cover:
- ✅ Token minting and burning
- ✅ Compliance checks
- ✅ Asset lifecycle
- ✅ Redemption flows
- ✅ Distribution management

### Frontend Tests

```bash
cd packages/frontend
npm run test
```

## Deployment to Mainnet

### Pre-Mainnet Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] All contracts verified on block explorer
- [ ] Team members have appropriate roles
- [ ] Initial whitelisted users approved
- [ ] Asset documentation prepared and hashed
- [ ] Insurance/legal review completed

### Mainnet Deployment Steps

1. **Update Environment**
```bash
# Use mainnet RPC in .env
MAINNET_RPC_URL=https://your-mainnet-rpc
```

2. **Deploy to Mainnet**
```bash
npm run deploy:mainnet
```

3. **Verify Contracts on Block Explorer**
```bash
# For each contract
npx hardhat verify --network mainnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

4. **Update Frontend Configuration**
```typescript
// packages/shared/deployments.ts
export const deployments = {
  mainnet: {
    // Mainnet contract addresses
  },
  testnet: {
    // Testnet contract addresses
  }
};
```

5. **Deploy Frontend**
```bash
cd packages/frontend
npm run build
npm run deploy  # Using Vercel or your hosting
```

## Contract Roles and Permissions

Setup roles after deployment:

```typescript
// Grant roles to team members
const MINTER_ROLE = await token.MINTER_ROLE();
await token.grantRole(MINTER_ROLE, minerAddress);

const COMPLIANCE_ROLE = await compliance.COMPLIANCE_ROLE();
await compliance.grantRole(COMPLIANCE_ROLE, complianceOfficerAddress);

// And so on for other roles...
```

## Monitoring and Maintenance

### Daily Checks
- [ ] Monitor asset status
- [ ] Check for failed redemptions
- [ ] Review whitelisting requests

### Weekly Tasks
- [ ] Update asset valuation if needed
- [ ] Process pending distributions
- [ ] Review compliance events

### Monthly Tasks
- [ ] Generate reports
- [ ] Analyze user activity
- [ ] Plan distributions

## Troubleshooting

### Contract Deployment Issues

**Error: Insufficient funds**
- Ensure account has testnet/mainnet funds
- Request testnet faucet tokens

**Error: Nonce mismatch**
- Reset account nonce in MetaMask
- Wait for pending transactions

**Error: Contract not verified**
- Check constructor arguments match exactly
- Use multi-file verification if needed

### Frontend Issues

**Contracts not showing**
- Verify deployment addresses in config
- Check network is correct
- Inspect browser console for errors

**Whitelist errors**
- Ask admin to call `addToWhitelist()` or `verifyKYC()`
- Wait a few blocks for confirmation
- Refresh page

**Balance not updating**
- Call `refetch()` function
- Wait for block confirmation
- Check wallet address is correct

### Transaction Failures

**Revert: not whitelisted**
- Need KYC verification first
- Ask compliance team

**Revert: amount exceeds limit**
- Check KYC transaction limit
- Break into smaller transactions

**Revert: asset not active**
- Asset must be activated by admin
- Ask to run `activateAsset()`

## Security Best Practices

1. **Private Key Management**
   - Never commit `.env` files
   - Use hardware wallet for mainnet
   - Rotate keys periodically

2. **Access Control**
   - Limit role holders
   - Regular audit of permissions
   - Remove inactive accounts

3. **Asset Management**
   - Keep documentation updated
   - Regular valuation reviews
   - Quarterly audit reconciliation

4. **Operational Security**
   - Monitor for unusual activity
   - Set up alerts for major events
   - Maintain incident response plan

## Support and Documentation

- **Smart Contracts:** See [RWA_ARCHITECTURE.md](./contracts/RWA_ARCHITECTURE.md)
- **Frontend:** See [FRONTEND_GUIDE.md](./frontend/FRONTEND_GUIDE.md)
- **API Reference:** Check contract ABIs in `packages/contracts/artifacts/`

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial modular RWA architecture |
| - | - | Separate token, compliance, and lifecycle contracts |
| - | - | Income distribution system |
| - | - | Comprehensive React frontend |

## License

MIT License - See LICENSE file

## Contact and Support

For questions or issues:
- GitHub Issues: [your-repo/issues](https://github.com)
- Email: support@example.com
- Discord: [Join Community](https://discord.gg)

---

**Last Updated:** 2024-08-26
**Maintainer:** MST Development Team
