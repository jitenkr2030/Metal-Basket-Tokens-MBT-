// MBT Backend API Server
// Metal Basket Tokens - Diversified Metal Portfolio Platform

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const Redis = require('redis');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

// Import existing token integrations
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// Redis client for caching and sessions
const redisClient = Redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.connect();

// Database connections
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mbt_platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB Connection Error:', err);
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key';

// Initialize Fabric Gateway
let gateway;

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  kycStatus: { type: String, default: 'pending' },
  walletAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// MBT Transaction Schema
const mbtTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, required: true },
  userId: { type: String, required: true },
  type: { type: String, enum: ['BUY', 'SELL', 'SIP_INVESTMENT'], required: true },
  mbtAmount: { type: Number, required: true },
  totalValue: { type: Number, required: true },
  bgtAllocation: { type: Number, required: true },
  bstAllocation: { type: Number, required: true },
  bptAllocation: { type: Number, required: true },
  status: { type: String, default: 'PENDING' },
  blockchainTxId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const MBTTransaction = mongoose.model('MBTTransaction', mbtTransactionSchema);

// SIP Schema
const sipSchema = new mongoose.Schema({
  sipId: { type: String, unique: true, required: true },
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  frequency: { type: String, enum: ['MONTHLY', 'QUARTERLY'], default: 'MONTHLY' },
  nextInvestmentDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  totalInvested: { type: Number, default: 0 },
  lastInvestmentDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const SIP = mongoose.model('SIP', sipSchema);

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// MBT Composition (50% Gold, 30% Silver, 20% Platinum)
const MBT_COMPOSITION = {
  gold: 0.50,
  silver: 0.30,
  platinum: 0.20
};

// Current metal prices (in production, would be fetched from external APIs)
const CURRENT_PRICES = {
  BGT: 5800,  // Gold per gram in INR
  BST: 75,    // Silver per gram in INR
  BPT: 3200   // Platinum per gram in INR
};

// ====================== MBT BASKET OPERATIONS ======================

// Get current MBT basket composition
app.get('/api/mbt/composition', authenticateToken, async (req, res) => {
  try {
    const composition = {
      ...MBT_COMPOSITION,
      metals: [
        { symbol: 'BGT', name: 'Gold', percentage: 50, allocation: MBT_COMPOSITION.gold },
        { symbol: 'BST', name: 'Silver', percentage: 30, allocation: MBT_COMPOSITION.silver },
        { symbol: 'BPT', name: 'Platinum', percentage: 20, allocation: MBT_COMPOSITION.platinum }
      ]
    };

    res.json({
      success: true,
      data: composition,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting composition:', error);
    res.status(500).json({ error: 'Failed to get composition' });
  }
});

// Buy MBT tokens
app.post('/api/mbt/buy', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod = 'UPI' } = req.body;
    const userId = req.user.userId;

    if (!amount || amount < 1000) {
      return res.status(400).json({ error: 'Minimum investment amount is ₹1,000' });
    }

    // Calculate allocations
    const bgtAmount = amount * MBT_COMPOSITION.gold;
    const bstAmount = amount * MBT_COMPOSITION.silver;
    const bptAmount = amount * MBT_COMPOSITION.platinum;

    // Create transaction record
    const transactionId = `MBT-TXN-${uuidv4()}`;
    const transaction = new MBTTransaction({
      transactionId,
      userId,
      type: 'BUY',
      mbtAmount: amount,
      totalValue: amount,
      bgtAllocation: bgtAmount,
      bstAllocation: bstAmount,
      bptAllocation: bptAmount,
      status: 'PENDING'
    });

    await transaction.save();

    // Process payment (simplified - would integrate with actual payment gateway)
    const paymentResult = await processPayment(userId, amount, paymentMethod, transactionId);
    
    if (paymentResult.success) {
      // Mint MBT tokens via blockchain
      const blockchainResult = await mintMBTTokens(userId, amount, bgtAmount, bstAmount, bptAmount);
      
      if (blockchainResult.success) {
        transaction.status = 'COMPLETED';
        transaction.blockchainTxId = blockchainResult.txId;
        await transaction.save();

        res.json({
          success: true,
          transactionId,
          mbtAmount: amount,
          allocations: {
            BGT: bgtAmount,
            BST: bstAmount,
            BPT: bptAmount
          },
          blockchainTxId: blockchainResult.txId,
          message: 'MBT tokens purchased successfully'
        });
      } else {
        transaction.status = 'FAILED';
        await transaction.save();
        res.status(500).json({ error: 'Failed to mint MBT tokens' });
      }
    } else {
      transaction.status = 'FAILED';
      await transaction.save();
      res.status(400).json({ error: paymentResult.error || 'Payment failed' });
    }

  } catch (error) {
    console.error('Error buying MBT:', error);
    res.status(500).json({ error: 'Failed to buy MBT tokens' });
  }
});

// Sell MBT tokens
app.post('/api/mbt/sell', authenticateToken, async (req, res) => {
  try {
    const { amount, tokenId } = req.body;
    const userId = req.user.userId;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Minimum sell amount is ₹100' });
    }

    // Verify user owns the token
    const tokenVerification = await verifyMBTTokenOwnership(tokenId, userId);
    if (!tokenVerification.valid) {
      return res.status(400).json({ error: 'Invalid token or insufficient ownership' });
    }

    // Calculate current value based on market prices
    const currentNAV = await calculateCurrentNAV();
    const saleValue = amount * currentNAV;

    // Create transaction record
    const transactionId = `MBT-SELL-${uuidv4()}`;
    const transaction = new MBTTransaction({
      transactionId,
      userId,
      type: 'SELL',
      mbtAmount: amount,
      totalValue: saleValue,
      bgtAllocation: saleValue * MBT_COMPOSITION.gold,
      bstAllocation: saleValue * MBT_COMPOSITION.silver,
      bptAllocation: saleValue * MBT_COMPOSITION.platinum,
      status: 'PENDING'
    });

    await transaction.save();

    // Process redemption via blockchain
    const redemptionResult = await redeemMBTTokens(tokenId, amount, userId);

    if (redemptionResult.success) {
      // Process payout
      const payoutResult = await processPayout(userId, saleValue, transactionId);
      
      transaction.status = 'COMPLETED';
      transaction.blockchainTxId = redemptionResult.txId;
      await transaction.save();

      res.json({
        success: true,
        transactionId,
        soldAmount: amount,
        saleValue,
        currentNAV,
        blockchainTxId: redemptionResult.txId,
        message: 'MBT tokens sold successfully'
      });
    } else {
      transaction.status = 'FAILED';
      await transaction.save();
      res.status(500).json({ error: 'Failed to redeem MBT tokens' });
    }

  } catch (error) {
    console.error('Error selling MBT:', error);
    res.status(500).json({ error: 'Failed to sell MBT tokens' });
  }
});

// Get user MBT portfolio
app.get('/api/mbt/portfolio', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's MBT tokens
    const userTokens = await getUserMBTTokens(userId);
    
    // Get transaction history
    const transactions = await MBTTransaction.find({ userId }).sort({ createdAt: -1 }).limit(50);
    
    // Get user's SIPs
    const sips = await SIP.find({ userId, isActive: true });

    // Calculate current portfolio value
    const totalValue = userTokens.reduce((sum, token) => sum + token.totalValue, 0);
    const currentNAV = await calculateCurrentNAV();
    const currentValue = userTokens.reduce((sum, token) => sum + (token.mbtAmount * currentNAV), 0);

    const portfolio = {
      totalInvested: totalValue,
      currentValue,
      totalGainLoss: currentValue - totalValue,
      totalGainLossPercentage: totalValue > 0 ? ((currentValue - totalValue) / totalValue) * 100 : 0,
      mbtTokens: userTokens,
      recentTransactions: transactions,
      activeSIPs: sips.length,
      composition: MBT_COMPOSITION
    };

    res.json({
      success: true,
      data: portfolio
    });

  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({ error: 'Failed to get portfolio' });
  }
});

// ====================== SIP MANAGEMENT ======================

// Create SIP
app.post('/api/mbt/sip/create', authenticateToken, async (req, res) => {
  try {
    const { amount, frequency = 'MONTHLY', startDate } = req.body;
    const userId = req.user.userId;

    if (!amount || amount < 1000) {
      return res.status(400).json({ error: 'Minimum SIP amount is ₹1,000' });
    }

    const sipId = `MBT-SIP-${uuidv4()}`;
    const nextInvestmentDate = startDate ? new Date(startDate) : new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

    const sip = new SIP({
      sipId,
      userId,
      amount,
      frequency,
      nextInvestmentDate
    });

    await sip.save();

    res.json({
      success: true,
      sipId,
      amount,
      frequency,
      nextInvestmentDate,
      message: 'SIP created successfully'
    });

  } catch (error) {
    console.error('Error creating SIP:', error);
    res.status(500).json({ error: 'Failed to create SIP' });
  }
});

// Get user SIPs
app.get('/api/mbt/sip/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sips = await SIP.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: sips
    });

  } catch (error) {
    console.error('Error getting SIPs:', error);
    res.status(500).json({ error: 'Failed to get SIPs' });
  }
});

// Cancel SIP
app.put('/api/mbt/sip/cancel/:sipId', authenticateToken, async (req, res) => {
  try {
    const { sipId } = req.params;
    const userId = req.user.userId;

    const sip = await SIP.findOne({ sipId, userId });
    if (!sip) {
      return res.status(404).json({ error: 'SIP not found' });
    }

    sip.isActive = false;
    await sip.save();

    res.json({
      success: true,
      message: 'SIP cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling SIP:', error);
    res.status(500).json({ error: 'Failed to cancel SIP' });
  }
});

// ====================== REBALANCING & NAV ======================

// Get current NAV (Net Asset Value)
app.get('/api/mbt/nav', async (req, res) => {
  try {
    const nav = await calculateCurrentNAV();
    const timestamp = new Date().toISOString();

    res.json({
      success: true,
      nav,
      timestamp,
      composition: MBT_COMPOSITION,
      metalPrices: CURRENT_PRICES
    });

  } catch (error) {
    console.error('Error calculating NAV:', error);
    res.status(500).json({ error: 'Failed to calculate NAV' });
  }
});

// Get NAV history
app.get('/api/mbt/nav/history', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // In production, would fetch from database or external service
    const history = generateSampleNAVHistory(period);

    res.json({
      success: true,
      data: history,
      period
    });

  } catch (error) {
    console.error('Error getting NAV history:', error);
    res.status(500).json({ error: 'Failed to get NAV history' });
  }
});

// Trigger rebalancing
app.post('/api/mbt/rebalance/trigger', authenticateToken, async (req, res) => {
  try {
    // Check if rebalancing is needed
    const rebalanceNeeded = await evaluateRebalanceNeed();
    
    if (!rebalanceNeeded.needed) {
      return res.json({
        success: true,
        message: 'Rebalancing not needed at this time',
        reason: rebalanceNeeded.reason
      });
    }

    // Create rebalancing request
    const requestResult = await createRebalanceRequest(rebalanceNeeded);
    
    res.json({
      success: true,
      rebalanceRequest: requestResult,
      message: 'Rebalancing request created successfully'
    });

  } catch (error) {
    console.error('Error triggering rebalancing:', error);
    res.status(500).json({ error: 'Failed to trigger rebalancing' });
  }
});

// ====================== ADMIN ENDPOINTS ======================

// Get system dashboard
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Verify admin privileges
    const isAdmin = await verifyAdminAccess(userId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get system metrics
    const metrics = await getSystemMetrics();

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

// Get transaction reports
app.get('/api/admin/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const isAdmin = await verifyAdminAccess(userId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate, type } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await MBTTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(1000);

    res.json({
      success: true,
      data: transactions,
      total: transactions.length
    });

  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// ====================== UTILITY FUNCTIONS ======================

// Process payment (simplified - would integrate with actual payment gateway)
async function processPayment(userId, amount, paymentMethod, transactionId) {
  try {
    // Simulate payment processing
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo
    
    if (paymentSuccess) {
      return { success: true, paymentId: `PAY-${uuidv4()}` };
    } else {
      return { success: false, error: 'Payment declined' };
    }
  } catch (error) {
    return { success: false, error: 'Payment processing error' };
  }
}

// Process payout (simplified)
async function processPayout(userId, amount, transactionId) {
  try {
    // Simulate payout processing
    const payoutSuccess = Math.random() > 0.05; // 95% success rate
    
    if (payoutSuccess) {
      return { success: true, payoutId: `PAYOUT-${uuidv4()}` };
    } else {
      return { success: false, error: 'Payout processing failed' };
    }
  } catch (error) {
    return { success: false, error: 'Payout processing error' };
  }
}

// Mint MBT tokens via blockchain
async function mintMBTTokens(userId, totalAmount, bgtAmount, bstAmount, bptAmount) {
  try {
    // In production, would interact with the MBT basket chaincode
    return {
      success: true,
      txId: `MBT-CHAIN-${uuidv4()}`,
      tokenId: `MBT-TOKEN-${uuidv4()}`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Redeem MBT tokens via blockchain
async function redeemMBTTokens(tokenId, amount, userId) {
  try {
    // In production, would interact with the MBT basket chaincode
    return {
      success: true,
      txId: `MBT-REDEEM-${uuidv4()}`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Verify MBT token ownership
async function verifyMBTTokenOwnership(tokenId, userId) {
  try {
    // In production, would query blockchain for token ownership
    return { valid: true, owner: userId };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Get user's MBT tokens
async function getUserMBTTokens(userId) {
  try {
    // In production, would query blockchain for user tokens
    return [
      {
        tokenId: `MBT-TOKEN-1`,
        mbtAmount: 5000,
        totalValue: 500000,
        createdAt: new Date('2025-01-01')
      }
    ];
  } catch (error) {
    return [];
  }
}

// Calculate current NAV
async function calculateCurrentNAV() {
  try {
    // Calculate NAV based on current metal prices and basket composition
    const weightedPrice = 
      CURRENT_PRICES.BGT * MBT_COMPOSITION.gold +
      CURRENT_PRICES.BST * MBT_COMPOSITION.silver +
      CURRENT_PRICES.BPT * MBT_COMPOSITION.platinum;
    
    // NAV is the weighted average price per unit of basket
    return Math.round(weightedPrice * 100) / 100;
  } catch (error) {
    return 0;
  }
}

// Generate sample NAV history
function generateSampleNAVHistory(period) {
  const history = [];
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const baseNAV = 5800; // Base NAV value
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some volatility
    const volatility = (Math.random() - 0.5) * 0.1; // ±5% volatility
    const nav = baseNAV * (1 + volatility);
    
    history.push({
      date: date.toISOString().split('T')[0],
      nav: Math.round(nav * 100) / 100
    });
  }
  
  return history;
}

// Evaluate if rebalancing is needed
async function evaluateRebalanceNeed() {
  try {
    // Simplified rebalancing evaluation
    // In production, would query actual basket composition and compare with targets
    
    const randomDeviation = Math.random() * 0.1 - 0.05; // -5% to +5%
    const needsRebalancing = Math.abs(randomDeviation) > 0.03; // 3% threshold
    
    return {
      needed: needsRebalancing,
      reason: needsRebalancing ? `Deviation of ${(randomDeviation * 100).toFixed(2)}% detected` : 'Allocations within acceptable range'
    };
  } catch (error) {
    return { needed: false, reason: 'Error in evaluation' };
  }
}

// Create rebalancing request
async function createRebalanceRequest(evaluationResult) {
  try {
    const requestId = `REBAL-${uuidv4()}`;
    
    // In production, would create actual blockchain request
    return {
      requestId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      reason: evaluationResult.reason
    };
  } catch (error) {
    throw error;
  }
}

// Verify admin access
async function verifyAdminAccess(userId) {
  // Simplified admin verification
  // In production, would check user roles and permissions
  return userId === 'admin' || userId.startsWith('admin_');
}

// Get system metrics
async function getSystemMetrics() {
  try {
    const totalUsers = await User.countDocuments();
    const totalTransactions = await MBTTransaction.countDocuments();
    const totalSIPs = await SIP.countDocuments({ isActive: true });
    
    // Get recent transaction volume
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVolume = await MBTTransaction.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$totalValue' } } }
    ]);

    return {
      totalUsers,
      totalTransactions,
      activeSIPs: totalSIPs,
      todayTransactionVolume: todayVolume[0]?.total || 0,
      currentNAV: await calculateCurrentNAV(),
      lastRebalance: new Date().toISOString()
    };
  } catch (error) {
    return {
      totalUsers: 0,
      totalTransactions: 0,
      activeSIPs: 0,
      todayTransactionVolume: 0,
      currentNAV: 0,
      lastRebalance: null
    };
  }
}

// ====================== AUTOMATED TASKS ======================

// Automated SIP processing (runs every day at 9 AM)
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('Running automated SIP processing...');
    await processSIPInvestments();
  } catch (error) {
    console.error('Error in automated SIP processing:', error);
  }
});

// Automated rebalancing check (runs every Monday at 8 AM)
cron.schedule('0 8 * * 1', async () => {
  try {
    console.log('Running automated rebalancing check...');
    await processRebalancing();
  } catch (error) {
    console.error('Error in automated rebalancing:', error);
  }
});

// Process SIP investments
async function processSIPInvestments() {
  try {
    const today = new Date();
    const sipsToProcess = await SIP.find({
      isActive: true,
      nextInvestmentDate: { $lte: today }
    });

    for (const sip of sipsToProcess) {
      try {
        // Process SIP investment
        await processSIPInvestment(sip);
        
        // Update next investment date
        const nextDate = new Date(sip.nextInvestmentDate);
        if (sip.frequency === 'MONTHLY') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (sip.frequency === 'QUARTERLY') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        }
        
        sip.nextInvestmentDate = nextDate;
        sip.lastInvestmentDate = new Date();
        sip.totalInvested += sip.amount;
        
        await sip.save();
        
        console.log(`Processed SIP investment: ${sip.sipId}, Amount: ₹${sip.amount}`);
      } catch (error) {
        console.error(`Error processing SIP ${sip.sipId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in SIP processing:', error);
  }
}

// Process individual SIP investment
async function processSIPInvestment(sip) {
  try {
    // Create MBT purchase transaction
    const transactionId = `SIP-${sip.sipId}-${Date.now()}`;
    
    // Process the SIP investment (similar to manual buy)
    const bgtAmount = sip.amount * MBT_COMPOSITION.gold;
    const bstAmount = sip.amount * MBT_COMPOSITION.silver;
    const bptAmount = sip.amount * MBT_COMPOSITION.platinum;
    
    const transaction = new MBTTransaction({
      transactionId,
      userId: sip.userId,
      type: 'SIP_INVESTMENT',
      mbtAmount: sip.amount,
      totalValue: sip.amount,
      bgtAllocation: bgtAmount,
      bstAllocation: bstAmount,
      bptAllocation: bptAmount,
      status: 'COMPLETED'
    });
    
    await transaction.save();
    
    return { success: true, transactionId };
  } catch (error) {
    throw error;
  }
}

// Process automated rebalancing
async function processRebalancing() {
  try {
    const rebalanceEvaluation = await evaluateRebalanceNeed();
    
    if (rebalanceEvaluation.needed) {
      const request = await createRebalanceRequest(rebalanceEvaluation);
      console.log(`Created rebalancing request: ${request.requestId}`);
      
      // Auto-execute small rebalances, require approval for large ones
      // Implementation would depend on business rules
    } else {
      console.log('Rebalancing not needed:', rebalanceEvaluation.reason);
    }
  } catch (error) {
    console.error('Error in rebalancing process:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MBT API Server running on port ${PORT}`);
  console.log(`📊 Metal Basket Tokens Platform - Diversified Metal Portfolio`);
  console.log(`🏗️ Composition: 50% Gold (BGT), 30% Silver (BST), 20% Platinum (BPT)`);
  console.log(`⚙️ Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close();
  redisClient.quit();
  process.exit(0);
});