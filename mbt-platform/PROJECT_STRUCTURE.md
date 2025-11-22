# MBT Platform - Project Structure

## Overview
Metal Basket Tokens (MBT) is a diversified precious metal investment platform that combines 50% Gold (BGT), 30% Silver (BST), and 20% Platinum (BPT) into a single tokenized index.

## Directory Structure

```
mbt-platform/
├── README.md                          # Main project documentation
├── IMPLEMENTATION_SUMMARY.md          # Project completion summary
├── PROJECT_STRUCTURE.md               # This file - structure overview
│
├── src/                               # Source code directory
│   ├── blockchain/                    # Smart contracts (Hyperledger Fabric)
│   │   ├── mbt_basket_chaincode.go    # Core basket token operations
│   │   └── mbt_rebalancing_chaincode.go # Automated portfolio rebalancing
│   │
│   ├── backend/                       # Node.js API server
│   │   └── server.js                  # Main API with portfolio management
│   │
│   ├── frontend/                      # Web interface
│   │   ├── index.html                 # Marketing landing page
│   │   ├── dashboard.html             # User portfolio dashboard
│   │   ├── dashboard.js               # Dashboard functionality
│   │   ├── styles.css                 # Main styles
│   │   ├── dashboard.css              # Dashboard styles
│   │   └── script.js                  # Landing page scripts
│   │
│   └── mobile/                        # React Native mobile app
│       ├── App.js                     # Main app navigation
│       ├── package.json               # Dependencies
│       └── src/
│           └── screens/               # Mobile app screens
│
├── docs/                              # Documentation
│   └── mbt_architecture_plan.md       # Technical architecture specification
│
└── scripts/                           # Deployment and utility scripts
    └── deploy.sh                      # Automated deployment script
```

## Key Features Implemented

### 🔗 Blockchain Layer
- **Smart Contracts**: Go-based chaincode for Hyperledger Fabric
- **Token Operations**: Buy, sell, transfer MBT tokens
- **Auto-Rebalancing**: 30-day schedule or 5% deviation trigger
- **Multi-signature Security**: 3-of-5 approval mechanism

### 🔧 Backend API
- **RESTful Services**: Complete trading, portfolio, SIP endpoints
- **Integration**: Works with existing BGT/BST/BPT APIs
- **Database**: MongoDB with Redis caching
- **Authentication**: JWT-based user management

### 💻 Frontend
- **Marketing Site**: Landing page with investment calculator
- **User Dashboard**: Portfolio overview, trading interface
- **Real-time Data**: Live NAV, price feeds, performance charts
- **Responsive Design**: Mobile-optimized interface

### 📱 Mobile App
- **React Native**: Cross-platform iOS/Android
- **Biometric Auth**: Secure user authentication
- **Offline Support**: Local data caching
- **Push Notifications**: Trade confirmations, price alerts

### 📚 Business Logic
- **Composition**: 50% BGT, 30% BST, 20% BPT
- **Minimum Investment**: ₹1,000
- **SIP Support**: Automated recurring investments
- **Physical Redemption**: Vault integration with MMTC-PAMP, SafeGold, Augmont

### 🚀 Deployment
- **Containerized**: Docker and Kubernetes ready
- **Monitoring**: Prometheus + Grafana integration
- **Scalability**: Supports 1M+ users, 50,000+ TPS
- **Security**: Encrypted communications, secure vault storage

## Quick Start

1. **Installation**: 
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh install
   ```

2. **Development**: 
   ```bash
   cd src/backend && npm install && npm start
   ```

3. **Frontend**: 
   Open `src/frontend/index.html` in browser

4. **Mobile**: 
   ```bash
   cd src/mobile && npm install && react-native run-android
   ```

## Revenue Model
- Transaction fees: 0.5-1%
- Platform licensing: ₹5-25 lakh per client
- White label support: ₹1-5 lakh monthly

## Target Market
- Wealth management firms
- Jewellers with digital investment apps
- Fintech platforms
- NBFCs and stock brokers
- Crypto exchanges

---
*MBT Platform - India's First Tokenized Precious Metal Index Fund*