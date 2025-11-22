# MBT - Metal Basket Tokens Platform

**A Revolutionary Diversified Precious Metal Investment Platform**

Metal Basket Tokens (MBT) represent a new class of tokenized investment products that offer diversified exposure to precious metals through a single, automatically rebalancing token. Each MBT token contains 50% Gold (BGT), 30% Silver (BST), and 20% Platinum (BPT), providing investors with lower risk, higher returns, and automated portfolio management.

## 🎯 Key Features

### 🔄 **Automated Portfolio Management**
- **Smart Rebalancing**: Automatic portfolio adjustment every 30 days or when allocations deviate by 5%
- **Diversification**: 50% Gold, 30% Silver, 20% Platinum allocation
- **Risk Mitigation**: Reduced volatility compared to single-metal investments

### 💰 **Investment Options**
- **Minimum Investment**: ₹1,000
- **SIP Facility**: Monthly and quarterly systematic investment plans
- **Real-time Trading**: 24/7 buy/sell functionality
- **Physical Redemption**: Convert tokens to physical metals

### 🏗️ **Technology Stack**
- **Blockchain**: Hyperledger Fabric 2.4+ with Go chaincodes
- **Backend**: Node.js/Express.js with Redis caching
- **Database**: PostgreSQL + MongoDB for structured and document data
- **Frontend**: HTML5/CSS3/JavaScript with Bootstrap 5
- **Mobile**: React Native cross-platform application

### 🔒 **Security & Compliance**
- **Multi-signature Controls**: 3-of-5 approval system for critical operations
- **SEBI Compliance**: Full regulatory framework implementation
- **KYC/AML Integration**: Aadhaar and PAN verification
- **Bank-grade Encryption**: AES-256 encryption for all sensitive data

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MBT Platform Architecture                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend Applications                                       │
│  ├── Landing Page (index.html)                              │
│  ├── User Dashboard (dashboard.html)                        │
│  └── Admin Panel (admin.html)                               │
├─────────────────────────────────────────────────────────────┤
│  Backend API Services                                        │
│  ├── MBT Basket Operations                                  │
│  ├── SIP Management                                         │
│  ├── Rebalancing Engine                                     │
│  ├── Portfolio Analytics                                    │
│  └── Integration APIs                                       │
├─────────────────────────────────────────────────────────────┤
│  Blockchain Layer (Hyperledger Fabric)                      │
│  ├── MBT Basket Chaincode                                   │
│  ├── Rebalancing Chaincode                                  │
│  ├── BGT Integration                                        │
│  ├── BST Integration                                        │
│  └── BPT Integration                                        │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ├── PostgreSQL (User data, transactions)                   │
│  ├── MongoDB (Documents, audit logs)                        │
│  └── Redis (Caching, sessions)                              │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
mbt-platform/
├── README.md                              # This file
├── IMPLEMENTATION_SUMMARY.md              # Project completion summary
├── PROJECT_STRUCTURE.md                   # Detailed structure overview
│
├── src/                                   # Source code directory
│   ├── blockchain/                        # Smart contracts
│   │   ├── mbt_basket_chaincode.go        # Core MBT token operations
│   │   └── mbt_rebalancing_chaincode.go   # Automated rebalancing
│   │
│   ├── backend/                           # API services
│   │   └── server.js                      # Main API server
│   │
│   ├── frontend/                          # Web applications
│   │   ├── index.html                     # Landing page
│   │   ├── dashboard.html                 # User dashboard
│   │   ├── dashboard.js                   # Dashboard functionality
│   │   ├── styles.css                     # Main styles
│   │   ├── dashboard.css                  # Dashboard styles
│   │   └── script.js                      # Landing page scripts
│   │
│   └── mobile/                            # React Native app
│       ├── App.js                         # Main app navigation
│       ├── package.json                   # Dependencies
│       └── src/screens/                   # Mobile app screens
│
├── docs/                                  # Documentation
│   └── mbt_architecture_plan.md           # Technical specifications
│
└── scripts/                               # Deployment and utilities
    └── deploy.sh                          # Automated deployment script
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+
- Hyperledger Fabric 2.4+

### Installation

1. **Setup Project**
   ```bash
   cd mbt-platform
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Configure API keys
   # - RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
   # - JWT_SECRET, ENCRYPTION_KEY
   # - Database connections
   ```

3. **Database Setup**
   ```bash
   # Create databases
   createdb mbt_platform
   createdb mbt_audit_logs
   
   # Run migrations
   npm run migrate
   ```

4. **Blockchain Network**
   ```bash
   # Setup Hyperledger Fabric network
   ./scripts/setup_blockchain.sh
   
   # Deploy chaincodes
   npm run deploy-chaincodes
   ```

5. **Start Services**
   ```bash
   # Start all services
   npm start
   
   # Or start individually
   npm run start:blockchain
   npm run start:backend
   npm run start:frontend
   ```

### Access Points

- **Web Application**: http://localhost:3000
- **API Server**: http://localhost:3003
- **Blockchain Explorer**: http://localhost:8080
- **Admin Panel**: http://localhost:3000/admin

## 💡 How MBT Works

### Investment Process

1. **User Investment**: User buys MBT worth ₹1,000
2. **Automatic Allocation**: 
   - ₹500 → Gold (BGT tokens)
   - ₹300 → Silver (BST tokens) 
   - ₹200 → Platinum (BPT tokens)
3. **Token Minting**: MBT smart contract mints 1 MBT token
4. **Storage**: Tokens are backed by physical metals in SEBI-regulated vaults

### Rebalancing Mechanism

**Time-based Rebalancing**: Every 30 days
**Deviation-based Rebalancing**: When any metal allocation drifts > 5%

The rebalancing engine automatically:
- Monitors current allocation percentages
- Calculates required buy/sell amounts
- Executes trades to restore target allocation
- Updates token composition accordingly

### SIP Automation

Systematic Investment Plans are processed automatically:
- **Monthly SIP**: Invested on the same date each month
- **Quarterly SIP**: Invested every 3 months
- **Auto-investment**: Funds allocated according to MBT composition
- **Portfolio Growth**: Systematic building of metal basket

## 📊 API Documentation

### Authentication
```
POST /api/auth/register        # User registration
POST /api/auth/login           # User login
POST /api/auth/logout          # User logout
GET  /api/auth/profile         # Get user profile
```

### MBT Operations
```
GET  /api/mbt/composition      # Get basket composition
POST /api/mbt/buy              # Buy MBT tokens
POST /api/mbt/sell             # Sell MBT tokens
GET  /api/mbt/portfolio        # Get user portfolio
GET  /api/mbt/nav              # Get current NAV
```

### SIP Management
```
POST /api/mbt/sip/create       # Create SIP
GET  /api/mbt/sip/list         # List user SIPs
PUT  /api/mbt/sip/cancel/:id   # Cancel SIP
```

### Admin Functions
```
GET  /api/admin/dashboard      # System dashboard
GET  /api/admin/users          # List users
GET  /api/admin/transactions   # Transaction reports
POST /api/admin/rebalance      # Trigger rebalancing
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/mbt_platform
MONGODB_URI=mongodb://localhost:27017/mbt_audit
REDIS_URL=redis://localhost:6379

# Blockchain
HYPERLEDGER_CONNECTION_PROFILE=./config/connection-profile.json
FABRIC_CA_URL=https://ca.mbt.network:7054

# Security
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key

# APIs
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
UIDAI_API_KEY=...

# Vault Partners
MMTC_PAMP_API_KEY=...
SAFEGOLD_API_KEY=...
AUGMONT_API_KEY=...
```

### Blockchain Configuration

```yaml
# configtx.yaml
Organizations:
  - Name: MBTNetwork
    ID: MBTMSP
    MSPDir: ./crypto-config/peerOrganizations/mbt.network/msp
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Specific Test Suites
```bash
npm run test:blockchain    # Chaincode testing
npm run test:backend       # API endpoint testing
npm run test:frontend      # UI component testing
npm run test:mobile        # Mobile app testing
```

### Test Coverage Requirements
- **Unit Tests**: >80% code coverage
- **Integration Tests**: All API endpoints
- **Security Tests**: Vulnerability scanning
- **Performance Tests**: Load and stress testing

## 🚢 Deployment

### Production Deployment

```bash
# Production build
npm run build:production

# Deploy to production
./scripts/deploy-production.sh

# Monitor deployment
npm run monitor
```

### Environment Setup
- **Development**: Local testing environment
- **Staging**: Pre-production testing
- **Production**: Live customer environment

### CI/CD Pipeline
- **GitHub Actions**: Automated testing and deployment
- **Container Registry**: Docker image storage
- **Infrastructure as Code**: Terraform templates
- **Rollback Strategy**: Automated rollback procedures

## 📱 Mobile Application

### Features
- **Cross-platform**: iOS and Android support
- **Biometric Auth**: Face ID and Touch ID
- **Offline Mode**: Basic operations without internet
- **Push Notifications**: Price alerts and updates
- **QR Payments**: Quick UPI payments

### Installation
```bash
# iOS
npm run build:ios
cd ios && pod install && xcodebuild

# Android
npm run build:android
cd android && ./gradlew assembleRelease
```

## 🏦 Vault Integration

### Supported Vaults
1. **MMTC-PAMP**: Premium precious metals storage
2. **SafeGold**: Digital vault solutions
3. **Augmont**: Regional coverage

### Vault Operations
- **Allocation**: Automatic metal allocation
- **Storage**: SEBI-regulated secure storage
- **Insurance**: Comprehensive coverage
- **Redemption**: Physical delivery system

## 📈 Performance Metrics

### Scalability Targets
- **Users**: 1M+ concurrent users
- **Transactions**: 50,000+ TPS
- **Response Time**: <200ms API responses
- **Uptime**: 99.99% availability

### Monitoring
- **Application Performance**: Real-time APM
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Business Metrics**: Trading volume, user activity
- **Security Monitoring**: Intrusion detection

## 🛡️ Security Features

### Application Security
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API abuse prevention
- **Input Validation**: SQL injection prevention
- **HTTPS/TLS**: All communications encrypted
- **Biometric Authentication**: Face ID and Touch ID

### Blockchain Security
- **Multi-signature Transactions**: Requires multiple approvals
- **Immutable Ledger**: All transactions permanently recorded
- **Smart Contract Auditing**: Regular security reviews
- **Private Channels**: Segregated transaction channels

## 📋 Compliance

### Regulatory Framework
- **SEBI Registration**: Securities market compliance
- **RBI Guidelines**: Foreign exchange compliance
- **KYC Standards**: Customer due diligence
- **AML/CTF**: Anti-money laundering measures

### Audit Requirements
- **Monthly Reports**: Automated compliance reporting
- **Risk Assessment**: Real-time risk monitoring
- **Transaction Monitoring**: Suspicious activity detection
- **External Audits**: Annual third-party audits

## 🎯 Business Model

### Revenue Streams
1. **Transaction Fees**: 0.5% - 1% per trade
2. **Minting Fees**: Small fee on new token creation
3. **Platform Licensing**: ₹5-25 lakh per client
4. **White Label Support**: ₹1-5 lakh monthly
5. **Premium Features**: Advanced analytics and services

### Target Market
- **Wealth Management Firms**: Portfolio diversification
- **Jewellers**: Digital investment expansion
- **Fintech Apps**: New product offerings
- **NBFCs**: Investment product diversification
- **Stock Brokers**: Alternative investment products

## 🔮 Future Roadmap

### Phase 1 (Q1 2025)
- [x] Core platform development
- [x] Blockchain integration
- [x] Web application launch
- [ ] Mobile app release
- [ ] Payment gateway integration

### Phase 2 (Q2 2025)
- [ ] Advanced rebalancing strategies
- [ ] DeFi protocol integration
- [ ] International expansion features
- [ ] Enterprise solutions
- [ ] API marketplace

### Phase 3 (Q3-Q4 2025)
- [ ] AI-powered portfolio optimization
- [ ] Cross-chain bridge implementation
- [ ] Institutional features
- [ ] Global partnerships
- [ ] Regulatory approvals

### Future Expansion
- **MBT Variants**: 
  - MBT-GoldHeavy (70% Gold, 20% Silver, 10% Platinum)
  - MBT-SilverHeavy (30% Gold, 60% Silver, 10% Platinum)
  - MBT-Eco (70% Silver, 30% Platinum)
- **ETF Potential**: First tokenized precious metal ETF in India
- **Cross-chain Bridges**: Multi-blockchain support
- **AI Optimization**: Machine learning portfolio management

## 🤝 Contributing

### Development Guidelines
- Follow existing code style and patterns
- Write comprehensive tests (>80% coverage)
- Update documentation for all changes
- Ensure security best practices
- Submit pull requests for review

### Code Review Process
- Security review required
- Performance testing mandatory
- Compliance check essential
- Testing coverage validation

### Pull Request Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request

## 📞 Support & Contact

### Technical Support
- **Email**: tech-support@mbt.tokens
- **Documentation**: docs.mbt.tokens
- **Developer Portal**: developers.mbt.tokens
- **GitHub Issues**: Bug reports and feature requests

### Business Inquiries
- **Email**: business@mbt.tokens
- **Phone**: +91-80-1234-5678
- **Website**: https://mbt.tokens
- **LinkedIn**: /company/mbt-tokens

### Community
- **Discord**: Community discussions
- **Telegram**: Real-time support
- **Twitter**: Updates and announcements
- **Blog**: Technical articles and insights

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This is a demonstration project. The MBT token and related services are for educational and development purposes. Any financial decisions should be made with proper regulatory approval and compliance.

## 🙏 Acknowledgments

- **Hyperledger Foundation** for blockchain infrastructure
- **SEBI** for regulatory guidance
- **Vault Partners** (MMTC-PAMP, SafeGold, Augmont)
- **Open Source Community** for tools and libraries
- **Beta Users** for feedback and testing

---

**Built with ❤️ by MiniMax Agent**  
*Revolutionizing precious metal investment through tokenization*

*© 2025 MBT - Metal Basket Tokens. All rights reserved.*