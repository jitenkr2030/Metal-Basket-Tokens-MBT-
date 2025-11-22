# MBT Architecture Plan - Technical Specifications

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Blockchain Layer](#blockchain-layer)
4. [Backend Services](#backend-services)
5. [Database Design](#database-design)
6. [Frontend Applications](#frontend-applications)
7. [Mobile Application](#mobile-application)
8. [Security Architecture](#security-architecture)
9. [Integration Architecture](#integration-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Performance & Scalability](#performance--scalability)
12. [Monitoring & Analytics](#monitoring--analytics)

---

## Executive Summary

### Project Vision
Metal Basket Tokens (MBT) represents a revolutionary approach to precious metal investment through tokenization. The platform provides diversified exposure to Gold (50%), Silver (30%), and Platinum (20%) in a single, automatically rebalancing token.

### Key Technical Objectives
- **Scalability**: Support 1M+ concurrent users with 50,000+ TPS
- **Security**: Bank-grade security with multi-signature controls
- **Compliance**: Full SEBI/RBI regulatory compliance
- **Automation**: Autonomous rebalancing and SIP processing
- **Integration**: Seamless integration with existing metal token ecosystems

### Technology Stack Rationale
- **Hyperledger Fabric**: Enterprise-grade permissioned blockchain
- **Node.js/Express**: Proven scalability and ecosystem support
- **PostgreSQL/MongoDB**: Hybrid data model for complex queries
- **React Native**: Cross-platform mobile development
- **Redis**: High-performance caching and session management

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MBT Platform Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│  Client Layer                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Web App     │  │ Mobile App  │  │ Admin Panel │              │
│  │ (React/JS)  │  │(React Native│  │ (Dashboard) │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  API Gateway Layer                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Load Balancer (Nginx)                     ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  Application Layer                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ MBT API     │  │ Rebalance   │  │ Portfolio   │              │
│  │ Server      │  │ Engine      │  │ Analytics   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  Blockchain Layer                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ MBT Basket  │  │ Rebalancing │  │ Integration │              │
│  │ Chaincode   │  │ Chaincode   │  │ Layer       │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ PostgreSQL  │  │ MongoDB     │  │ Redis       │              │
│  │ (User Data) │  │ (Documents) │  │ (Cache)     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
Client Request → Load Balancer → API Gateway → Business Logic → Blockchain
     ↓                ↓             ↓             ↓              ↓
   Frontend      Nginx        Express.js    Smart Contract   Fabric Network
   Mobile App                 Node.js       Chaincode        Consensus
   Admin Panel                REST API      Go Chaincode     Validation
```

---

## Blockchain Layer

### Hyperledger Fabric Configuration

#### Network Topology
```yaml
Network: MBT_Fabric_Network
Channels: 
  - mbt-channel (Main trading channel)
  - rebalance-channel (Rebalancing operations)
  - audit-channel (Compliance and auditing)

Organizations:
  MBT_ORG:
    MSP: MBTMSP
    Peers: [peer0.mbt.org, peer1.mbt.org]
    CA: ca.mbt.org
  
  BGT_ORG:
    MSP: BGTMSP
    Peers: [peer0.bgt.org]
    CA: ca.bgt.org
  
  BST_ORG:
    MSP: BSTMSP
    Peers: [peer0.bst.org]
    CA: ca.bst.org
  
  BPT_ORG:
    MSP: BPTMSP
    Peers: [peer0.bpt.org]
    CA: ca.bpt.org

Orderers:
  - orderer0.mbt.org (Raft consensus)

Consensus:
  Type: Raft
  SnapshotInterval: 100KB
  MaxInflightBlocks: 5
```

#### Smart Contract Architecture

##### MBT Basket Chaincode (`mbt_basket_chaincode.go`)

**Core Functions:**
- `MintMBT()`: Create new MBT tokens with metal allocation
- `RedeemMBT()`: Redeem tokens for underlying metals
- `GetMBTToken()`: Retrieve token information
- `CalculateNAV()`: Compute Net Asset Value
- `UpdateBasketHoldings()`: Maintain aggregate holdings
- `RebalanceBasket()`: Execute portfolio rebalancing

**State Management:**
```go
// Key-Value Store Design
Key Format: "MBT_TOKEN_" + tokenID → Token JSON
Key Format: "BASKET_HOLDINGS" → Holdings JSON
Key Format: "USER_TOKENS_" + userID → Token Array JSON
Key Format: "TRANSACTION_" + txID → Transaction JSON
```

##### Rebalancing Chaincode (`mbt_rebalancing_chaincode.go`)

**Core Functions:**
- `EvaluateRebalanceNeed()`: Assess rebalancing requirements
- `CreateRebalanceRequest()`: Generate rebalancing operations
- `ExecuteRebalance()`: Perform portfolio adjustments
- `GetRebalanceOperations()`: Query pending operations

**Rebalancing Logic:**
```go
func (c *MBTRebalancingContract) EvaluateRebalanceNeed() error {
    // 1. Calculate current allocations
    currentAlloc := calculateCurrentAllocations()
    
    // 2. Compare with target allocations
    deviations := compareWithTargetAllocations(currentAlloc)
    
    // 3. Check deviation threshold (5%)
    maxDeviation := getMaxDeviation(deviations)
    if maxDeviation > REBALANCE_THRESHOLD {
        return createRebalanceRequest()
    }
    
    // 4. Check time-based rebalancing (30 days)
    daysSinceRebalance := getDaysSinceLastRebalance()
    if daysSinceRebalance >= REBALANCE_INTERVAL_DAYS {
        return createRebalanceRequest()
    }
    
    return nil // No rebalancing needed
}
```

### Chaincode Dependencies

```go
// Import requirements for MBT Basket Chaincode
import (
    "encoding/json"
    "fmt"
    "log"
    "time"
    "math"
    
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// Required dependencies in go.mod
require (
    github.com/hyperledger/fabric-contract-api-go v1.4.5
    github.com/hyperledger/fabric-protos-go v2.0.0
)
```

---

## Backend Services

### API Architecture

#### RESTful API Design

```
API Structure:
/api/v1/
├── auth/              # Authentication endpoints
├── mbt/               # MBT operations
│   ├── buy            # Purchase MBT tokens
│   ├── sell           # Sell MBT tokens
│   ├── portfolio      # Portfolio management
│   ├── nav            # Net Asset Value
│   └── composition    # Basket composition
├── sip/               # SIP management
│   ├── create         # Create SIP
│   ├── list           # List SIPs
│   └── cancel         # Cancel SIP
├── admin/             # Administrative functions
│   ├── dashboard      # System metrics
│   ├── users          # User management
│   └── reports        # Analytics reports
└── rebalance/         # Rebalancing operations
    ├── trigger        # Manual rebalance trigger
    ├── status         # Rebalance status
    └── history        # Rebalance history
```

#### Backend Service Architecture

```javascript
// Express.js Application Structure
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Core Services
const MBTService = require('./services/mbt-service');
const RebalanceService = require('./services/rebalance-service');
const PortfolioService = require('./services/portfolio-service');
const SIPService = require('./services/sip-service');

// Integration Services
const BGTIntegration = require('./integrations/bgt-integration');
const BSTIntegration = require('./integrations/bst-integration');
const BPTIntegration = require('./integrations/bpt-integration');

// External Integrations
const PaymentGateway = require('./integrations/payment-gateway');
const VaultIntegration = require('./integrations/vault-integration');
const PriceFeedService = require('./integrations/price-feed');

// Utility Services
const AuthService = require('./services/auth-service');
const NotificationService = require('./services/notification-service');
const AuditService = require('./services/audit-service');
```

#### Service Layer Design

##### MBT Service (`services/mbt-service.js`)
```javascript
class MBTService {
    async buyTokens(userId, amount, paymentMethod) {
        // 1. Validate user and amount
        await this.validatePurchaseRequest(userId, amount);
        
        // 2. Process payment
        const paymentResult = await this.processPayment(amount, paymentMethod);
        
        // 3. Calculate metal allocations
        const allocations = this.calculateAllocations(amount);
        
        // 4. Mint MBT tokens via blockchain
        const mintResult = await this.mintTokens(userId, amount, allocations);
        
        // 5. Update portfolio
        await this.updatePortfolio(userId, mintResult);
        
        // 6. Send notifications
        await this.sendConfirmationNotifications(userId, mintResult);
        
        return mintResult;
    }
    
    async calculateAllocations(amount) {
        return {
            gold: amount * 0.50,      // 50% Gold
            silver: amount * 0.30,    // 30% Silver
            platinum: amount * 0.20   // 20% Platinum
        };
    }
}
```

##### Rebalancing Service (`services/rebalance-service.js`)
```javascript
class RebalanceService {
    async evaluateRebalanceNeed() {
        // 1. Get current basket holdings
        const holdings = await this.getBasketHoldings();
        
        // 2. Calculate current allocations
        const currentAlloc = this.calculateAllocations(holdings);
        
        // 3. Compare with target allocations
        const deviations = this.calculateDeviations(currentAlloc);
        
        // 4. Check rebalancing triggers
        const triggers = this.checkRebalanceTriggers(deviations, holdings);
        
        return {
            needsRebalancing: triggers.needed,
            reason: triggers.reason,
            deviations: deviations,
            proposedActions: this.generateRebalanceActions(deviations)
        };
    }
    
    async executeRebalancing(request) {
        // 1. Validate rebalancing request
        await this.validateRebalanceRequest(request);
        
        // 2. Calculate required trades
        const trades = this.calculateRebalanceTrades(request);
        
        // 3. Execute trades via blockchain
        const executionResults = await this.executeTrades(trades);
        
        // 4. Update basket composition
        await this.updateBasketComposition(executionResults);
        
        // 5. Log rebalancing event
        await this.logRebalancingEvent(request, executionResults);
        
        return executionResults;
    }
}
```

---

## Database Design

### PostgreSQL Schema

#### User Management
```sql
-- Users table
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    kyc_status VARCHAR(20) DEFAULT 'pending',
    wallet_address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255)
);

-- User profiles
CREATE TABLE user_profiles (
    profile_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(user_id),
    date_of_birth DATE,
    gender VARCHAR(10),
    occupation VARCHAR(100),
    annual_income DECIMAL(15,2),
    risk_profile VARCHAR(20),
    investment_experience VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Transaction Management
```sql
-- MBT transactions
CREATE TABLE mbt_transactions (
    transaction_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(user_id),
    transaction_type VARCHAR(20) NOT NULL, -- BUY, SELL, SIP_INVESTMENT
    mbt_amount DECIMAL(15,6) NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    bgt_allocation DECIMAL(15,2) NOT NULL,
    bst_allocation DECIMAL(15,2) NOT NULL,
    bpt_allocation DECIMAL(15,2) NOT NULL,
    nav_at_transaction DECIMAL(15,2),
    blockchain_tx_id VARCHAR(255),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- SIP plans
CREATE TABLE sip_plans (
    sip_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(user_id),
    amount DECIMAL(15,2) NOT NULL,
    frequency VARCHAR(20) NOT NULL, -- MONTHLY, QUARTERLY
    next_investment_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    total_invested DECIMAL(15,2) DEFAULT 0,
    total_tokens_minted DECIMAL(15,6) DEFAULT 0,
    last_investment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Portfolio Management
```sql
-- User portfolios
CREATE TABLE portfolios (
    portfolio_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(user_id),
    total_invested DECIMAL(15,2) DEFAULT 0,
    current_value DECIMAL(15,2) DEFAULT 0,
    total_gain_loss DECIMAL(15,2) DEFAULT 0,
    gain_loss_percentage DECIMAL(8,4) DEFAULT 0,
    mbt_tokens DECIMAL(15,6) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio compositions
CREATE TABLE portfolio_compositions (
    composition_id VARCHAR(36) PRIMARY KEY,
    portfolio_id VARCHAR(36) REFERENCES portfolios(portfolio_id),
    metal_type VARCHAR(10) NOT NULL, -- BGT, BST, BPT
    allocation_percentage DECIMAL(5,2) NOT NULL,
    current_value DECIMAL(15,2) NOT NULL,
    total_tokens DECIMAL(15,6) NOT NULL,
    last_rebalanced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### MongoDB Collections

#### Audit Logs
```javascript
// audit_logs collection
{
  _id: ObjectId,
  timestamp: ISODate,
  userId: String,
  action: String, // "LOGIN", "BUY", "SELL", "SIP_CREATE"
  resource: String, // "API", "BLOCKCHAIN", "DATABASE"
  details: {
    ip: String,
    userAgent: String,
    endpoint: String,
    method: String,
    parameters: Object,
    result: String
  },
  riskScore: Number, // 0-100
  flagged: Boolean,
  createdAt: ISODate
}
```

#### Rebalancing Events
```javascript
// rebalancing_events collection
{
  _id: ObjectId,
  eventId: String,
  triggerType: String, // "TIME", "DEVIATION", "MANUAL"
  triggerReason: String,
  currentAllocations: {
    gold: Number,
    silver: Number,
    platinum: Number
  },
  targetAllocations: {
    gold: 0.50,
    silver: 0.30,
    platinum: 0.20
  },
  deviations: {
    gold: Number,
    silver: Number,
    platinum: Number
  },
  proposedTrades: [{
    metalType: String,
    operationType: String, // "BUY", "SELL"
    amount: Number,
    estimatedCost: Number
  }],
  status: String, // "PENDING", "APPROVED", "EXECUTED", "FAILED"
  createdAt: ISODate,
  executedAt: ISODate,
  approvedBy: String,
  executedBy: String
}
```

#### System Metrics
```javascript
// system_metrics collection
{
  _id: ObjectId,
  timestamp: ISODate,
  metrics: {
    totalUsers: Number,
    totalTransactions: Number,
    totalMBTSupply: Number,
    averageNAV: Number,
    systemLoad: Number,
    memoryUsage: Number,
    cpuUsage: Number,
    responseTime: Number
  },
  marketData: {
    goldPrice: Number,
    silverPrice: Number,
    platinumPrice: Number
  },
  blockchainMetrics: {
    blockHeight: Number,
    transactionRate: Number,
    networkLatency: Number
  }
}
```

### Redis Cache Strategy

#### Cache Keys Design
```javascript
// User session management
const SESSION_PREFIX = "session:";
const USER_PREFIX = "user:";
const PORTFOLIO_PREFIX = "portfolio:";
const NAV_PREFIX = "nav:";
const PRICE_PREFIX = "price:";

// Cache key examples
"SESSION:abc123" → {userId, expiry, permissions}
"USER:user456" → {profile, kycStatus, preferences}
"PORTFOLIO:user789" → {holdings, transactions, nav}
"NAV:latest" → {value, timestamp, metalPrices}
"PRICE:BGT" → {price, timestamp, source}
```

#### Cache Invalidation Strategy
```javascript
// Real-time cache updates
async updateCacheOnTransaction(transaction) {
  // Invalidate user portfolio cache
  await redis.del(`PORTFOLIO:${transaction.userId}`);
  
  // Update latest NAV
  const newNAV = await calculateNewNAV();
  await redis.setex(`NAV:latest`, 300, JSON.stringify({
    value: newNAV,
    timestamp: new Date().toISOString()
  }));
  
  // Update market prices cache
  const prices = await fetchMarketPrices();
  await redis.setex(`PRICE:BGT`, 60, prices.gold);
  await redis.setex(`PRICE:BST`, 60, prices.silver);
  await redis.setex(`PRICE:BPT`, 60, prices.platinum);
}
```

---

## Frontend Applications

### Web Application Architecture

#### Component Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   └── Loading.jsx
│   ├── dashboard/
│   │   ├── Overview.jsx
│   │   ├── Portfolio.jsx
│   │   ├── Transactions.jsx
│   │   └── Charts.jsx
│   ├── investment/
│   │   ├── BuyMBT.jsx
│   │   ├── SellMBT.jsx
│   │   ├── AllocationPreview.jsx
│   │   └── PaymentForm.jsx
│   ├── sip/
│   │   ├── CreateSIP.jsx
│   │   ├── SIPList.jsx
│   │   └── SIPPerformance.jsx
│   └── admin/
│       ├── Dashboard.jsx
│       ├── UserManagement.jsx
│       └── SystemReports.jsx
├── pages/
│   ├── Landing.jsx
│   ├── Dashboard.jsx
│   ├── Investment.jsx
│   ├── SIP.jsx
│   └── Profile.jsx
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── mbt.js
│   └── notifications.js
├── utils/
│   ├── formatters.js
│   ├── validators.js
│   └── constants.js
└── styles/
    ├── global.css
    ├── components.css
    └── themes.css
```

#### State Management (Redux)

```javascript
// Store structure
const store = {
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false
  },
  portfolio: {
    holdings: [],
    transactions: [],
    nav: 0,
    totalValue: 0,
    loading: false
  },
  mbt: {
    composition: { gold: 50, silver: 30, platinum: 20 },
    currentNAV: 0,
    priceHistory: [],
    rebalancingStatus: {}
  },
  sip: {
    plans: [],
    activeCount: 0,
    totalInvested: 0,
    performance: {}
  },
  ui: {
    theme: 'light',
    sidebarCollapsed: false,
    notifications: [],
    loading: false
  }
};
```

#### Responsive Design System

```css
/* Breakpoint system */
:root {
  --breakpoint-xs: 0;
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
  --breakpoint-xxl: 1400px;
}

/* Grid system */
.container {
  width: 100%;
  padding-right: 0.75rem;
  padding-left: 0.75rem;
  margin-right: auto;
  margin-left: auto;
}

@media (min-width: 576px) {
  .container { max-width: 540px; }
}
@media (min-width: 768px) {
  .container { max-width: 720px; }
}
@media (min-width: 992px) {
  .container { max-width: 960px; }
}
@media (min-width: 1200px) {
  .container { max-width: 1140px; }
}
@media (min-width: 1400px) {
  .container { max-width: 1320px; }
}
```

---

## Mobile Application

### React Native Architecture

#### App Structure
```
App.js                    # Main app component
src/
├── screens/
│   ├── Auth/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   └── BiometricSetup.js
│   ├── Dashboard/
│   │   ├── HomeScreen.js
│   │   ├── PortfolioScreen.js
│   │   └── ChartsScreen.js
│   ├── Investment/
│   │   ├── BuyScreen.js
│   │   ├── SellScreen.js
│   │   └── AllocationScreen.js
│   ├── SIP/
│   │   ├── CreateSIPScreen.js
│   │   ├── SIPListScreen.js
│   │   └── PerformanceScreen.js
│   └── Profile/
│       ├── ProfileScreen.js
│       ├── SettingsScreen.js
│       └── KYCScreen.js
├── components/
│   ├── common/
│   │   ├── Header.js
│   │   ├── Button.js
│   │   ├── Card.js
│   │   └── Input.js
│   ├── charts/
│   │   ├── PortfolioChart.js
│   │   ├── CompositionChart.js
│   │   └── PerformanceChart.js
│   └── forms/
│       ├── BuyForm.js
│       ├── SellForm.js
│       └── SIPForm.js
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── storage.js
│   ├── notifications.js
│   └── biometric.js
├── navigation/
│   ├── AppNavigator.js
│   ├── AuthNavigator.js
│   └── TabNavigator.js
└── utils/
    ├── formatters.js
    ├── validators.js
    └── constants.js
```

#### Cross-Platform Implementation

```javascript
// Biometric Authentication
import React, { useEffect, useState } from 'react';
import { TouchID, FaceID, AndroidFaceID } from 'react-native-biometrics';

const BiometricAuth = () => {
  const [biometricType, setBiometricType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const { available, biometryType } = await ReactNativeBiometrics.simpleQuery({
        reason: 'Authenticate to access your portfolio'
      });

      if (available) {
        setBiometricType(biometryType);
      }
    } catch (error) {
      console.log('Biometric authentication error:', error);
    }
  };

  const authenticate = async () => {
    try {
      const { success } = await ReactNativeBiometrics.simplePrompt({
        reason: 'Authenticate to access your MBT portfolio',
        fallbackLabel: 'Use passcode'
      });

      if (success) {
        setIsAuthenticated(true);
        // Proceed to app
      }
    } catch (error) {
      console.log('Authentication failed:', error);
    }
  };

  return (
    <View>
      {biometricType && (
        <Button
          title={`Authenticate with ${biometricType}`}
          onPress={authenticate}
        />
      )}
    </View>
  );
};
```

#### Offline Support

```javascript
// Offline data synchronization
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OfflineManager = {
  async syncData() {
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (!isConnected) {
      // Store actions for later sync
      const pendingActions = await this.getPendingActions();
      return { synced: false, pendingActions };
    }

    try {
      // Sync pending portfolio updates
      await this.syncPortfolio();
      
      // Sync pending transactions
      await this.syncTransactions();
      
      // Sync SIP operations
      await this.syncSIPOperations();
      
      return { synced: true, syncedAt: new Date() };
    } catch (error) {
      console.error('Sync error:', error);
      return { synced: false, error: error.message };
    }
  },

  async queueAction(action) {
    const pendingActions = await AsyncStorage.getItem('pendingActions') || '[]';
    const actions = JSON.parse(pendingActions);
    actions.push({
      ...action,
      timestamp: new Date().toISOString(),
      id: generateId()
    });
    await AsyncStorage.setItem('pendingActions', JSON.stringify(actions));
  },

  async syncPortfolio() {
    const cachedPortfolio = await AsyncStorage.getItem('cachedPortfolio');
    if (cachedPortfolio) {
      const portfolio = JSON.parse(cachedPortfolio);
      // Update with latest server data
      const updatedPortfolio = await fetch('/api/mbt/portfolio');
      await AsyncStorage.setItem('cachedPortfolio', JSON.stringify(updatedPortfolio));
    }
  }
};
```

---

## Security Architecture

### Authentication & Authorization

#### Multi-Factor Authentication Flow

```javascript
// JWT with refresh token mechanism
class AuthService {
  async login(email, password, biometricData = null) {
    // 1. Primary authentication
    const user = await this.validateCredentials(email, password);
    
    // 2. Biometric verification (if enabled)
    if (user.mfaEnabled && biometricData) {
      const biometricValid = await this.verifyBiometric(user.id, biometricData);
      if (!biometricValid) {
        throw new Error('Biometric verification failed');
      }
    }
    
    // 3. Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    // 4. Store refresh token securely
    await this.storeRefreshToken(user.id, refreshToken);
    
    // 5. Log authentication event
    await this.logAuthEvent(user.id, 'LOGIN', 'SUCCESS');
    
    return { accessToken, refreshToken, user };
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await this.getUserById(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }
      
      // Check for token blacklisting
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }
      
      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
```

#### Role-Based Access Control

```javascript
// RBAC implementation
const roles = {
  USER: ['read:portfolio', 'write:portfolio', 'read:transactions'],
  PREMIUM_USER: [
    ...roles.USER,
    'read:analytics',
    'write:sip',
    'read:sip'
  ],
  ADMIN: [
    ...roles.PREMIUM_USER,
    'read:all_users',
    'write:system_settings',
    'read:system_metrics',
    'execute:rebalancing'
  ],
  SUPER_ADMIN: [
    ...roles.ADMIN,
    'write:blockchain_operations',
    'read:audit_logs',
    'write:user_management'
  ]
};

const permissions = {
  'read:portfolio': {
    resource: 'portfolio',
    action: 'read',
    scope: 'own'
  },
  'write:portfolio': {
    resource: 'portfolio',
    action: 'write',
    scope: 'own'
  },
  'read:all_users': {
    resource: 'users',
    action: 'read',
    scope: 'all'
  }
};

function hasPermission(user, permission) {
  const userRoles = user.roles || [];
  const userPermissions = new Set();
  
  userRoles.forEach(role => {
    roles[role].forEach(p => userPermissions.add(p));
  });
  
  return userPermissions.has(permission);
}
```

### Data Protection

#### Encryption Strategy

```javascript
// AES-256 encryption for sensitive data
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = process.env.ENCRYPTION_KEY;
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('mbt-additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('mbt-additional-data'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Hash sensitive data for storage
  async hashData(data, salt = null) {
    const finalSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, finalSalt, 100000, 64, 'sha512');
    
    return {
      hash: hash.toString('hex'),
      salt: finalSalt
    };
  }
}
```

#### Input Validation & Sanitization

```javascript
// Input validation using Joi
const Joi = require('joi');

const validationSchemas = {
  // User registration
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
  }),

  // MBT purchase
  mbtPurchase: Joi.object({
    amount: Joi.number().min(1000).max(10000000).required(),
    paymentMethod: Joi.string().valid('UPI', 'CARD', 'NETBANKING', 'WALLET').required()
  }),

  // SIP creation
  sipCreation: Joi.object({
    amount: Joi.number().min(1000).max(1000000).required(),
    frequency: Joi.string().valid('MONTHLY', 'QUARTERLY').required(),
    startDate: Joi.date().min('now').required()
  })
};

function validateInput(data, schema) {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new ValidationError(`Validation failed: ${error.details[0].message}`);
  }
  return value;
}

// SQL injection prevention
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['";\\]/g, '') // Remove SQL injection characters
      .trim();
  }
  return input;
}
```

### Blockchain Security

#### Multi-Signature Controls

```go
// Multi-signature transaction approval in Go chaincode
func (c *MBTBasketContract) MintTokens(ctx contractapi.TransactionContextInterface, 
    userID string, gramAmount float64, vault string) error {
    
    // Validate request
    if !isValidMintRequest(userID, gramAmount, vault) {
        return fmt.Errorf("invalid mint request")
    }
    
    // Check minimum approvals required
    approvals := getRequiredApprovals()
    currentApprovals := getCurrentApprovals()
    
    if len(currentApprovals) < 3 {
        return fmt.Errorf("minimum 3 approvals required, got %d", len(currentApprovals))
    }
    
    // Validate vault partner authorization
    if !isApprovedVault(vault) {
        return fmt.Errorf("unauthorized vault partner: %s", vault)
    }
    
    // Check user limits and KYC status
    if !isUserKYCApproved(userID) {
        return fmt.Errorf("KYC approval required")
    }
    
    // Check daily transaction limits
    if exceedsDailyLimits(userID, gramAmount) {
        return fmt.Errorf("exceeds daily transaction limits")
    }
    
    // Execute minting
    return executeMintOperation(userID, gramAmount, vault)
}

// Vault authorization check
func isApprovedVault(vaultName string) bool {
    approvedVaults := map[string]bool{
        "MMTC-PAMP": true,
        "SafeGold": true,
        "Augmont": true,
    }
    return approvedVaults[vaultName]
}
```

---

## Integration Architecture

### External API Integration

#### Payment Gateway Integration

```javascript
// Razorpay integration for UPI and card payments
const Razorpay = require('razorpay');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  async createPaymentOrder(amount, userId, customerDetails) {
    try {
      const options = {
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: userId,
          product: 'MBT_TOKEN'
        }
      };

      const order = await this.razorpay.orders.create(options);
      
      // Log payment order creation
      await this.logPaymentEvent({
        userId,
        orderId: order.id,
        amount,
        status: 'CREATED'
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      };
    } catch (error) {
      console.error('Payment order creation failed:', error);
      throw new Error('Failed to create payment order');
    }
  }

  async verifyPayment(paymentId, orderId, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(orderId + '|' + paymentId)
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Payment verification failed');
      }

      // Fetch payment details
      const payment = await this.razorpay.payments.fetch(paymentId);
      
      if (payment.status === 'captured') {
        // Log successful payment
        await this.logPaymentEvent({
          paymentId,
          orderId,
          status: 'SUCCESS',
          amount: payment.amount
        });
        
        return { success: true, payment };
      } else {
        throw new Error('Payment not captured');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      await this.logPaymentEvent({
        paymentId,
        orderId,
        status: 'FAILED',
        error: error.message
      });
      throw error;
    }
  }
}
```

#### Vault Integration

```javascript
// Vault partner API integration
class VaultService {
  constructor() {
    this.mmtcClient = new MMTCPAMPClient(process.env.MMTC_PAMP_API_KEY);
    this.safeGoldClient = new SafeGoldClient(process.env.SAFEGOLD_API_KEY);
    this.augmontClient = new AugmontClient(process.env.AUGMONT_API_KEY);
  }

  async allocateMetals(allocationRequest) {
    const { goldAmount, silverAmount, platinumAmount, purity } = allocationRequest;
    const results = {};

    try {
      // Allocate gold through MMTC-PAMP
      if (goldAmount > 0) {
        results.gold = await this.mmtcClient.allocateGold({
          grams: goldAmount,
          purity: purity || '999.9',
          storageLocation: 'vault_delhi'
        });
      }

      // Allocate silver through SafeGold
      if (silverAmount > 0) {
        results.silver = await this.safeGoldClient.allocateSilver({
          grams: silverAmount,
          purity: '999.0',
          storageLocation: 'vault_mumbai'
        });
      }

      // Allocate platinum through Augmont
      if (platinumAmount > 0) {
        results.platinum = await this.augmontClient.allocatePlatinum({
          grams: platinumAmount,
          purity: '999.5',
          storageLocation: 'vault_bangalore'
        });
      }

      // Update blockchain with allocation details
      await this.updateBlockchainAllocations(results);
      
      return {
        success: true,
        allocations: results,
        totalCertificates: Object.keys(results).length
      };

    } catch (error) {
      console.error('Metal allocation failed:', error);
      
      // Rollback allocations if partial failure
      await this.rollbackAllocations(results);
      
      throw new Error(`Allocation failed: ${error.message}`);
    }
  }

  async getVaultBalance(vaultPartner) {
    try {
      switch (vaultPartner.toLowerCase()) {
        case 'mmtc-pamp':
          return await this.mmtcClient.getInventory();
        case 'safegold':
          return await this.safeGoldClient.getInventory();
        case 'augmont':
          return await this.augmontClient.getInventory();
        default:
          throw new Error(`Unknown vault partner: ${vaultPartner}`);
      }
    } catch (error) {
      console.error('Failed to get vault balance:', error);
      throw error;
    }
  }
}
```

#### Price Feed Integration

```javascript
// Real-time price feed from multiple sources
class PriceFeedService {
  constructor() {
    this.sources = [
      new MetalPriceAPI(),
      new LBMAFeed(),
      new MCXFeed(),
      localStorage.getItem('backup_prices')
    ];
    this.priceCache = new Map();
    this.updateInterval = 60000; // 1 minute
  }

  async getCurrentPrices() {
    try {
      // Fetch from multiple sources
      const pricePromises = this.sources.map(source => 
        source.getCurrentPrices().catch(error => {
          console.warn(`Price source failed: ${error.message}`);
          return null;
        })
      );

      const prices = await Promise.all(pricePromises);
      
      // Validate and average prices
      const validPrices = prices.filter(price => price !== null);
      
      if (validPrices.length === 0) {
        throw new Error('No price sources available');
      }

      const avgPrices = this.calculateAveragePrices(validPrices);
      
      // Cache prices
      this.priceCache.set('current', {
        ...avgPrices,
        timestamp: new Date().toISOString(),
        sourceCount: validPrices.length
      });

      return avgPrices;

    } catch (error) {
      console.error('Price feed error:', error);
      
      // Fallback to cached prices
      const cached = this.priceCache.get('current');
      if (cached) {
        console.warn('Using cached prices due to feed failure');
        return cached;
      }
      
      // Final fallback to static prices
      return this.getStaticPrices();
    }
  }

  calculateAveragePrices(prices) {
    const metals = ['gold', 'silver', 'platinum'];
    const averaged = {};

    metals.forEach(metal => {
      const metalPrices = prices
        .map(price => price[metal])
        .filter(price => price && price > 0);

      if (metalPrices.length > 0) {
        // Use median for better outlier resistance
        averaged[metal] = this.calculateMedian(metalPrices);
      } else {
        averaged[metal] = this.getStaticMetalPrice(metal);
      }
    });

    return averaged;
  }

  calculateMedian(values) {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  startPriceUpdates() {
    setInterval(async () => {
      try {
        await this.getCurrentPrices();
      } catch (error) {
        console.error('Scheduled price update failed:', error);
      }
    }, this.updateInterval);
  }
}
```

---

## Deployment Architecture

### Containerization Strategy

#### Docker Configuration

```dockerfile
# Dockerfile for MBT API Server
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mbt -u 1001
RUN chown -R mbt:nodejs /app
USER mbt

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3003

CMD ["npm", "start"]
```

#### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  # MBT API Server
  mbt-api:
    build: ./backend
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://mbt_user:password@postgres:5432/mbt_platform
      - MONGODB_URI=mongodb://mongo:27017/mbt_audit
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - mongo
      - redis
    restart: unless-stopped
    networks:
      - mbt-network

  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=mbt_platform
      - POSTGRES_USER=mbt_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    restart: unless-stopped
    networks:
      - mbt-network

  # MongoDB for audit logs
  mongo:
    image: mongo:6.0
    environment:
      - MONGO_INITDB_DATABASE=mbt_audit
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped
    networks:
      - mbt-network

  # Redis for caching
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - mbt-network

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - mbt-api
    restart: unless-stopped
    networks:
      - mbt-network

  # Monitoring with Prometheus
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped
    networks:
      - mbt-network

volumes:
  postgres_data:
  mongo_data:
  redis_data:
  prometheus_data:

networks:
  mbt-network:
    driver: bridge
```

#### Kubernetes Deployment

```yaml
# k8s/mbt-api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mbt-api
  namespace: mbt-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mbt-api
  template:
    metadata:
      labels:
        app: mbt-api
    spec:
      containers:
      - name: mbt-api
        image: mbt/api:latest
        ports:
        - containerPort: 3003
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: mbt-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: mbt-config
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3003
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3003
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: mbt-api-service
  namespace: mbt-production
spec:
  selector:
    app: mbt-api
  ports:
  - port: 80
    targetPort: 3003
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mbt-ingress
  namespace: mbt-production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.mbt.tokens
    secretName: mbt-tls-secret
  rules:
  - host: api.mbt.tokens
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: mbt-api-service
            port:
              number: 80
```

### CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy MBT Platform

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: 'backend/package-lock.json'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm test
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run security tests
      run: npm audit --audit-level moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Add deployment commands here
        kubectl set image deployment/mbt-api mbt-api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
        kubectl rollout status deployment/mbt-api

  notify:
    needs: [build, deploy]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
    - name: Notify Slack
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      if: always()
```

---

## Performance & Scalability

### Load Balancing Strategy

#### Nginx Configuration

```nginx
# nginx/nginx.conf
upstream mbt_backend {
    least_conn;
    server mbt-api-1:3003 weight=1 max_fails=3 fail_timeout=30s;
    server mbt-api-2:3003 weight=1 max_fails=3 fail_timeout=30s;
    server mbt-api-3:3003 weight=1 max_fails=3 fail_timeout=30s;
    
    keepalive 32;
}

server {
    listen 80;
    server_name api.mbt.tokens;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=mbt_api:10m rate=10r/s;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    location / {
        limit_req zone=mbt_api burst=20 nodelay;
        
        proxy_pass http://mbt_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://mbt_backend/health;
        access_log off;
    }
    
    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://mbt_backend;
    }
}
```

### Database Optimization

#### PostgreSQL Performance Tuning

```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

-- Connection pool configuration
max_connections = 200
superuser_reserved_connections = 3

-- Query optimization indexes
CREATE INDEX CONCURRENTLY idx_mbt_transactions_user_id_created_at 
ON mbt_transactions(user_id, created_at);

CREATE INDEX CONCURRENTLY idx_portfolios_user_id 
ON portfolios(user_id);

CREATE INDEX CONCURRENTLY idx_sip_plans_user_id_next_date 
ON sip_plans(user_id, next_investment_date) 
WHERE is_active = true;

-- Partitioning for large tables
CREATE TABLE mbt_transactions_y2025m01 PARTITION OF mbt_transactions
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE mbt_transactions_y2025m02 PARTITION OF mbt_transactions
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

#### Redis Optimization

```redis
# redis.conf optimizations
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Enable compression
rdbcompression yes
rdbchecksum yes

# AOF configuration for durability
appendonly yes
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

### Caching Strategy

#### Application-Level Caching

```javascript
// Redis caching middleware
class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.defaultTTL = 300; // 5 minutes
  }

  // Cache portfolio data
  async getPortfolio(userId) {
    const cacheKey = `portfolio:${userId}`;
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from database
      const portfolio = await this.fetchPortfolioFromDB(userId);
      
      // Cache for 5 minutes
      await this.redis.setex(cacheKey, this.defaultTTL, JSON.stringify(portfolio));
      
      return portfolio;
    } catch (error) {
      console.error('Cache error:', error);
      // Fallback to database
      return await this.fetchPortfolioFromDB(userId);
    }
  }

  // Cache NAV calculations
  async getNAV() {
    const cacheKey = 'nav:latest';
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Calculate NAV
      const nav = await this.calculateNAV();
      
      // Cache for 1 minute (frequently updated)
      await this.redis.setex(cacheKey, 60, JSON.stringify(nav));
      
      return nav;
    } catch (error) {
      console.error('NAV cache error:', error);
      return await this.calculateNAV();
    }
  }

  // Invalidate cache on updates
  async invalidatePortfolio(userId) {
    const cacheKey = `portfolio:${userId}`;
    await this.redis.del(cacheKey);
  }

  // Cache market prices
  async getMarketPrices() {
    const cacheKey = 'prices:metals';
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from external APIs
      const prices = await this.fetchMarketPrices();
      
      // Cache for 30 seconds
      await this.redis.setex(cacheKey, 30, JSON.stringify(prices));
      
      return prices;
    } catch (error) {
      console.error('Price cache error:', error);
      return await this.getStaticPrices();
    }
  }
}
```

### Performance Monitoring

#### Application Performance Monitoring

```javascript
// Performance monitoring service
const prometheus = require('prom-client');

class MetricsService {
  constructor() {
    this.register = new prometheus.Registry();
    
    // Custom metrics
    this.httpRequestDuration = new prometheus.Histogram({
      name: 'mbt_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });

    this.httpRequestTotal = new prometheus.Counter({
      name: 'mbt_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    this.databaseQueryDuration = new prometheus.Histogram({
      name: 'mbt_database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'table']
    });

    this.blockchainTransactionDuration = new prometheus.Histogram({
      name: 'mbt_blockchain_transaction_duration_seconds',
      help: 'Duration of blockchain transactions in seconds',
      labelNames: ['transaction_type']
    });

    // Register metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.databaseQueryDuration);
    this.register.registerMetric(this.blockchainTransactionDuration);
  }

  // Middleware for HTTP request tracking
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        const route = req.route ? req.route.path : req.path;
        
        this.httpRequestDuration
          .labels(req.method, route, res.statusCode)
          .observe(duration);
          
        this.httpRequestTotal
          .labels(req.method, route, res.statusCode)
          .inc();
      });
      
      next();
    };
  }

  // Database query tracking
  trackDatabaseQuery(queryType, table, queryFn) {
    return async (...args) => {
      const startTime = Date.now();
      
      try {
        const result = await queryFn(...args);
        const duration = (Date.now() - startTime) / 1000;
        
        this.databaseQueryDuration
          .labels(queryType, table)
          .observe(duration);
          
        return result;
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        
        this.databaseQueryDuration
          .labels(queryType, table)
          .observe(duration);
          
        throw error;
      }
    };
  }

  // Blockchain transaction tracking
  async trackBlockchainTransaction(txType, transactionFn) {
    const startTime = Date.now();
    
    try {
      const result = await transactionFn();
      const duration = (Date.now() - startTime) / 1000;
      
      this.blockchainTransactionDuration
        .labels(txType)
        .observe(duration);
        
      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      this.blockchainTransactionDuration
        .labels(txType)
        .observe(duration);
        
      throw error;
    }
  }

  // Get metrics for Prometheus scraping
  async getMetrics() {
    return await this.register.metrics();
  }
}
```

#### Business Metrics Dashboard

```javascript
// Business metrics collector
class BusinessMetricsService {
  constructor(database) {
    this.db = database;
  }

  async collectDailyMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const metrics = {
      date: today.toISOString().split('T')[0],
      newUsers: await this.getNewUsersCount(today),
      totalTransactions: await this.getTransactionsCount(today),
      totalVolume: await this.getTransactionVolume(today),
      averageTransactionSize: await this.getAverageTransactionSize(today),
      sipCreations: await this.getSIPCreationsCount(today),
      activeUsers: await this.getActiveUsersCount(7), // Last 7 days
      rebalancingEvents: await this.getRebalancingEvents(today),
      systemUptime: await this.getSystemUptime(),
      avgResponseTime: await this.getAverageResponseTime(today),
      errorRate: await this.getErrorRate(today)
    };

    // Store in MongoDB for time-series analysis
    await this.db.collection('business_metrics').insertOne(metrics);
    
    return metrics;
  }

  async getNewUsersCount(date) {
    return await this.db.collection('users').countDocuments({
      createdAt: { $gte: date }
    });
  }

  async getTransactionsCount(date) {
    return await this.db.collection('mbt_transactions').countDocuments({
      createdAt: { $gte: date }
    });
  }

  async getTransactionVolume(date) {
    const result = await this.db.collection('mbt_transactions').aggregate([
      {
        $match: {
          createdAt: { $gte: date },
          status: 'COMPLETED'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total_value' }
        }
      }
    ]).toArray();
    
    return result[0]?.total || 0;
  }

  async getAverageTransactionSize(date) {
    const result = await this.db.collection('mbt_transactions').aggregate([
      {
        $match: {
          createdAt: { $gte: date },
          status: 'COMPLETED'
        }
      },
      {
        $group: {
          _id: null,
          avgSize: { $avg: '$total_value' }
        }
      }
    ]).toArray();
    
    return Math.round(result[0]?.avgSize || 0);
  }
}
```

---

## Monitoring & Analytics

### System Health Monitoring

#### Health Check Implementation

```javascript
// Health check endpoints
const healthCheck = {
  async checkDatabase() {
    try {
      await this.db.query('SELECT 1');
      return { status: 'healthy', latency: 'low' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },

  async checkRedis() {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return { 
        status: 'healthy', 
        latency: latency < 10 ? 'low' : latency < 50 ? 'medium' : 'high'
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },

  async checkBlockchain() {
    try {
      // Test blockchain connectivity
      const channel = this.fabricClient.getChannel('mbt-channel');
      await channel.queryInfo();
      
      return { status: 'healthy', network: 'connected' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },

  async checkExternalAPIs() {
    const checks = {
      razorpay: await this.checkRazorpay(),
      vault_apis: await this.checkVaultAPIs(),
      price_feeds: await this.checkPriceFeeds()
    };

    const healthyCount = Object.values(checks).filter(check => check.status === 'healthy').length;
    
    return {
      status: healthyCount === Object.keys(checks).length ? 'healthy' : 'degraded',
      services: checks
    };
  },

  async getOverallHealth() {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      blockchain: await this.checkBlockchain(),
      external_apis: await this.checkExternalAPIs(),
      system: await this.checkSystemResources()
    };

    const unhealthyServices = Object.entries(checks)
      .filter(([_, check]) => check.status === 'unhealthy')
      .map(([service]) => service);

    return {
      status: unhealthyServices.length === 0 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
  }
};
```

#### Alert System

```javascript
// Alert management service
class AlertService {
  constructor() {
    this.alertRules = [
      {
        name: 'high_error_rate',
        condition: (metrics) => metrics.errorRate > 0.05, // 5% error rate
        severity: 'critical',
        message: 'Error rate exceeds 5%',
        channels: ['email', 'slack', 'pagerduty']
      },
      {
        name: 'slow_response_time',
        condition: (metrics) => metrics.avgResponseTime > 1000, // 1 second
        severity: 'warning',
        message: 'Average response time exceeds 1 second',
        channels: ['slack']
      },
      {
        name: 'low_disk_space',
        condition: (metrics) => metrics.diskUsage > 0.85, // 85% disk usage
        severity: 'warning',
        message: 'Disk space usage exceeds 85%',
        channels: ['email', 'slack']
      },
      {
        name: 'blockchain_disconnect',
        condition: (metrics) => metrics.blockchainStatus !== 'connected',
        severity: 'critical',
        message: 'Blockchain network disconnected',
        channels: ['email', 'slack', 'pagerduty']
      }
    ];
  }

  async evaluateAlerts(metrics) {
    const triggeredAlerts = [];

    for (const rule of this.alertRules) {
      try {
        if (rule.condition(metrics)) {
          const alert = {
            id: generateAlertId(),
            rule: rule.name,
            severity: rule.severity,
            message: rule.message,
            timestamp: new Date().toISOString(),
            metrics: metrics,
            resolved: false
          };

          triggeredAlerts.push(alert);
          await this.sendAlert(alert, rule.channels);
        }
      } catch (error) {
        console.error(`Alert evaluation failed for rule ${rule.name}:`, error);
      }
    }

    // Store alerts in database
    if (triggeredAlerts.length > 0) {
      await this.storeAlerts(triggeredAlerts);
    }

    return triggeredAlerts;
  }

  async sendAlert(alert, channels) {
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(alert);
            break;
          case 'slack':
            await this.sendSlackAlert(alert);
            break;
          case 'pagerduty':
            await this.sendPagerDutyAlert(alert);
            break;
          default:
            console.warn(`Unknown alert channel: ${channel}`);
        }
      } catch (error) {
        console.error(`Failed to send alert via ${channel}:`, error);
      }
    }
  }

  async sendSlackAlert(alert) {
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    const payload = {
      text: `🚨 MBT Platform Alert`,
      attachments: [
        {
          color: alert.severity === 'critical' ? 'danger' : 'warning',
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Service',
              value: 'MBT Platform',
              short: true
            },
            {
              title: 'Message',
              value: alert.message,
              short: false
            },
            {
              title: 'Timestamp',
              value: alert.timestamp,
              short: true
            }
          ]
        }
      ]
    };

    await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
}
```

This comprehensive architecture document provides detailed technical specifications for building and deploying the MBT platform. It covers all aspects from blockchain integration to frontend applications, ensuring scalability, security, and regulatory compliance for the diversified metal tokenization system.