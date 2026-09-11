# Real World Asset (RWA) Tokenization Platform

A comprehensive, production-ready platform for tokenizing real-world assets with full compliance, lifecycle management, and income distribution features.

![RWA Architecture](./docs/architecture.png)

## 🚀 Features

### Core Token Management
- **ERC20 Token** - Standard-compliant token with minting and burning
- **Pausable Transfers** - Freeze trading when needed
- **Ownership Tracking** - Full transaction history

### Real-World Asset Management
- **Asset Information** - Store asset details, valuation, and documentation
- **Price Oracle** - Automatic price updates
- **Custodian Management** - Track asset custodian details
- **Valuation Tracking** - Monitor asset value over time

### Compliance & KYC
- **Whitelist/Blacklist** - Control who can hold and trade
- **KYC Verification** - Multi-level verification system
- **Transaction Limits** - Per-user transaction amount limits
- **Compliance Monitoring** - Automatic rule enforcement

### Asset Lifecycle
- **Status Management** - Track asset through lifecycle (PENDING → ACTIVE → PAUSED → REDEEMED → TERMINATED)
- **Redemption Requests** - Structured redemption workflow
- **Asset Activation** - Control when asset becomes tradeable
- **Pause/Resume** - Halt and resume asset operations

### Income Distribution
- **Dividend Management** - Create and distribute income
- **Automated Claims** - Holders claim their share
- **Distribution Tracking** - Full audit trail
- **Multiple Distributions** - Handle recurring and one-time payouts

## 📦 Project Structure

```
rwa/
├── packages/
│   ├── contracts/           # Smart contracts
│   │   ├── contracts/
│   │   │   ├── RWAToken.sol                 # Core token
│   │   │   ├── RWAAssetManager.sol          # Asset management
│   │   │   ├── RWACompliance.sol            # Compliance & KYC
│   │   │   ├── RWAAssetLifecycle.sol        # Lifecycle management
│   │   │   └── RWADistribution.sol          # Income distribution
│   │   ├── test/
│   │   │   └── RWAContracts.test.ts         # Comprehensive test suite
│   │   ├── deploy.config.ts                 # Deployment configuration
│   │   └── RWA_ARCHITECTURE.md              # Contract documentation
│   │
│   ├── frontend/            # React web application
│   │   ├── app/
│   │   │   └── page.tsx                     # Main dashboard
│   │   ├── hooks/
│   │   │   ├── useRWAContracts.ts           # Contract bindings
│   │   │   ├── useShareBalance.ts
│   │   │   ├── useRedemption.ts
│   │   │   ├── useWhitelist.ts
│   │   │   ├── useDistribution.ts           # NEW: Distribution
│   │   │   └── useAssetLifecycle.ts         # NEW: Lifecycle
│   │   ├── components/                      # UI components
│   │   └── FRONTEND_GUIDE.md                # Frontend documentation
│   │
│   └── shared/              # Shared types and deployments
│
├── SETUP_AND_DEPLOYMENT.md  # Complete setup guide
├── README.md                # This file
└── LICENSE
```

## 🎯 Use Cases

1. **Real Estate Tokenization** 🏢
   - Fractional ownership of properties
   - KYC-compliant investor access
   - Regular dividend distribution

2. **Commodity Investment** 🌾
   - Tokenized precious metals, art, etc.
   - Price tracking and updates
   - Redemption for physical assets

3. **Infrastructure Funds** 🏗️
   - Long-term stable assets
   - Structured investment vehicles
   - Predictable income distribution

4. **Private Equity** 💼
   - Controlled share distribution
   - Multi-tier investor management
   - Automated dividend payments

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity 0.8.20** - Latest stable version
- **OpenZeppelin Contracts** - Battle-tested libraries
- **Hardhat** - Ethereum development environment

### Frontend
- **Next.js 14** - React framework
- **Wagmi** - Blockchain hooks
- **Viem** - Ethereum utilities
- **TypeScript** - Type-safe development

### Network Support
- Ethereum
- Polygon
- BSC (Binance Smart Chain)
- Arbitrum
- Other EVM chains

## 📋 Quick Start

### 1. Clone and Install
```bash
# Clone repository
git clone https://github.com/your-repo/rwa-platform.git
cd rwa-platform

# Install dependencies
npm install

# Install contract dependencies
cd packages/contracts && npm install
cd ../frontend && npm install
```

### 2. Deploy Contracts
```bash
cd packages/contracts

If you picked `pnpm` or `yarn` and don't have it yet, install it globally
first, then re-run the install:

```
npm install -g pnpm   # or: npm install -g yarn
pnpm install           # or: yarn install

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet (requires proper setup)
npm run deploy:mainnet
```

### 3. Run Frontend
```bash
cd packages/frontend

# Development server
npm run dev

# Production build
npm run build
npm run start
```

### 4. Run Tests
```bash
cd packages/contracts

# Run contract tests
npm run test

# Generate coverage report
npm run test:coverage
```

## 📚 Documentation

### For Developers
- [Smart Contract Architecture](./packages/contracts/RWA_ARCHITECTURE.md) - Detailed contract documentation
- [Frontend Integration Guide](./packages/frontend/FRONTEND_GUIDE.md) - React hooks and components
- [Setup and Deployment](./SETUP_AND_DEPLOYMENT.md) - Complete deployment instructions

### Quick References
- [Contract Functions](#contract-functions)
- [User Roles](#user-roles)
- [Deployment Checklist](#deployment-checklist)

## 🔑 Key Contracts

### RWAToken
Core ERC20 token for share representation.
- Mint new shares
- Burn shares
- Pause/unpause transfers
- Standard transfer functionality

### RWAAssetManager
Manages real-world asset information.
- Store asset metadata
- Track valuation
- Manage custodian
- Store documentation hash
- Oracle price updates

### RWACompliance
Enforces compliance rules and KYC.
- Whitelist/blacklist management
- KYC verification with levels
- Transaction limit enforcement
- Compliance status tracking

### RWAAssetLifecycle
Manages asset state and redemptions.
- Asset activation/pause/resume
- Redemption request tracking
- Status management
- Lifecycle events

### RWADistribution
Handles income distribution and dividends.
- Create distributions
- Process payments
- Track claims
- Holder distribution history

## 👥 User Roles

| Role | Capabilities | Contracts |
|------|--------------|-----------|
| **Owner/Admin** | Full access, grant roles | All |
| **Asset Manager** | Update valuations, set custodian | RWAAssetManager |
| **Minter** | Issue new shares | RWAToken |
| **Compliance Officer** | Manage KYC, whitelist/blacklist | RWACompliance |
| **Oracle Operator** | Update prices | RWAAssetManager |
| **Distributor** | Create and process distributions | RWADistribution |
| **Lifecycle Manager** | Activate, pause, redeem assets | RWAAssetLifecycle |
| **Holder/Investor** | Hold shares, request redemption | RWAToken, RWAAssetLifecycle |

## 🔒 Security Features

✅ **Implemented**
- Role-based access control (RBAC)
- Reentrancy protection
- Pausable token functionality
- Whitelist/blacklist enforcement
- KYC verification gates
- Transaction limits per user
- Comprehensive event logging

⚠️ **Recommendations**
- Security audit before mainnet
- Multi-sig wallet for admin functions
- Time locks on critical operations
- Regular security reviews

## 📊 Dashboard Features

The frontend dashboard provides:

1. **Token Overview**
   - Name, symbol, total supply
   - Real-time update status

2. **Asset Information**
   - Asset ID and type
   - Current valuation
   - Custodian details

3. **Pricing**
   - Price per share in USD
   - Valuation history

4. **Asset Status**
   - Current lifecycle status
   - Status-based color coding

5. **User Portfolio**
   - Share balance
   - Holdings value

6. **Compliance Status**
   - Whitelist/blacklist status
   - KYC level and verification date
   - Eligibility for operations

7. **Redemption Interface**
   - Request share redemption
   - Input validation
   - Transaction tracking

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- test/RWAContracts.test.ts

# Generate coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

Test coverage includes:
- ✅ Token operations (mint, burn, transfer)
- ✅ Compliance checks (whitelist, KYC)
- ✅ Asset management (valuation, price)
- ✅ Lifecycle management (activate, pause, redeem)
- ✅ Distribution (create, claim, track)

## 🚢 Deployment Checklist

Before going to mainnet:

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Contracts verified on block explorer
- [ ] Team roles assigned and tested
- [ ] Initial users whitelisted
- [ ] Asset documentation prepared
- [ ] Price oracle configured
- [ ] Custodian confirmed
- [ ] Legal review completed
- [ ] Insurance coverage arranged
- [ ] Monitoring and alerting setup
- [ ] Incident response plan ready

## 🔄 Workflow Example

```
1. Asset Owner → Tokenize asset
   └─ Deploy contracts
   └─ Set asset details
   └─ Activate asset

2. Compliance Team → Onboard investors
   └─ Verify KYC
   └─ Add to whitelist
   └─ Set transaction limits

3. Investors → Purchase shares
   └─ Connect wallet
   └─ Buy shares (via separate purchasing logic)
   └─ View portfolio

4. Asset Management → Distribute income
   └─ Create distribution
   └─ Process payment
   └─ Investors claim their portion

5. Investors → Redeem shares
   └─ Request redemption
   └─ Custodian processes
   └─ Receive funds
```

## 💡 Best Practices

### For Administrators
- Keep role assignments minimal
- Regularly audit permissions
- Use multi-sig wallets for sensitive functions
- Monitor all events and transactions
- Maintain documented procedures

### For Integrators
- Always check user compliance status
- Validate inputs before transactions
- Handle edge cases (pause states, limits)
- Implement retry logic for failed transactions
- Monitor event logs

### For Users
- Verify whitelisting before trading
- Check asset status before operations
- Keep seed phrases secure
- Understand transaction limits
- Save redemption confirmations

## 📈 Scalability

The platform supports:
- **Unlimited assets** - Deploy new contracts for each asset
- **Thousands of holders** - Efficient batch operations
- **High frequency trading** - Layer 2 compatible
- **Cross-chain operation** - Bridge contracts available

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Add tests for changes
4. Submit pull request
5. Request code review

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

## 🆘 Support

- **Documentation:** Read the guides in `/docs`
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** support@example.com

## 🙏 Acknowledgments

Built with:
- OpenZeppelin Contracts
- Hardhat
- Wagmi
- Next.js
- And the Ethereum community

## 📞 Contact

- **Website:** https://example.com
- **Email:** info@example.com
- **Twitter:** @example
- **Discord:** [Join Server](https://discord.gg/example)

---

**Last Updated:** August 26, 2024

**Status:** ✅ Production Ready (After Security Audit)

**Current Version:** 1.0.0
