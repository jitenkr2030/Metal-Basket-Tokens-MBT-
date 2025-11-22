// MBT Home Screen - Main Dashboard
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { LineChart } from 'react-native-chart-kit';

// Import services
import { MBTService } from '../services/MBTService';
import { AuthService } from '../services/AuthService';

// Theme
const theme = {
  colors: {
    primary: '#1e3a8a',
    secondary: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    light: '#f8fafc',
    white: '#ffffff',
    gray: '#6b7280'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16
  }
};

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [portfolio, setPortfolio] = useState(null);
  const [currentNAV, setCurrentNAV] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load portfolio data
      const portfolioData = await MBTService.getPortfolio();
      setPortfolio(portfolioData);
      
      // Load current NAV
      const navData = await MBTService.getCurrentNAV();
      setCurrentNAV(navData.nav);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const navigateToInvestment = (type) => {
    navigation.navigate('Investment', { action: type });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getMetalIcon = (metal) => {
    switch (metal.toLowerCase()) {
      case 'gold':
      case 'bgt':
        return 'attach-money';
      case 'silver':
      case 'bst':
        return 'silver';
      case 'platinum':
      case 'bpt':
        return 'diamond';
      default:
        return 'account-balance-wallet';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your portfolio...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with Greeting */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.info]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Good Morning!</Text>
          <Text style={styles.userName}>
            {portfolio?.user?.name || 'MBT Investor'}
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationIcon}>
          <Icon name="notifications" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Portfolio Overview Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatCurrency(portfolio?.currentValue || 0)}
          </Text>
          <Text style={styles.statLabel}>Current Value</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatCurrency(portfolio?.totalInvested || 0)}
          </Text>
          <Text style={styles.statLabel}>Total Invested</Text>
        </View>
      </View>

      {/* NAV Card */}
      <View style={styles.navCard}>
        <View style={styles.navHeader}>
          <Text style={styles.navLabel}>MBT Net Asset Value</Text>
          <Text style={styles.navTime}>Updated: Just now</Text>
        </View>
        <Text style={styles.navValue}>{formatCurrency(currentNAV)}</Text>
        <View style={styles.navChange}>
          <Icon name="trending-up" size={16} color={theme.colors.success} />
          <Text style={[styles.navChangeText, { color: theme.colors.success }]}>
            +1.2% today
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
            onPress={() => navigateToInvestment('buy')}
          >
            <Icon name="add" size={24} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>Buy MBT</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.danger }]}
            onPress={() => navigateToInvestment('sell')}
          >
            <Icon name="remove" size={24} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>Sell MBT</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
            onPress={() => navigation.navigate('SIP')}
          >
            <Icon name="schedule" size={24} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>SIP</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Portfolio Allocation */}
      {portfolio?.composition && (
        <View style={styles.allocationContainer}>
          <Text style={styles.sectionTitle}>Portfolio Allocation</Text>
          {Object.entries(portfolio.composition).map(([metal, allocation]) => (
            <View key={metal} style={styles.allocationItem}>
              <View style={styles.allocationHeader}>
                <View style={styles.metalInfo}>
                  <View style={styles.metalIconContainer}>
                    <Icon 
                      name={getMetalIcon(metal)} 
                      size={20} 
                      color={theme.colors.primary} 
                    />
                    <Text style={styles.metalName}>
                      {metal.charAt(0).toUpperCase() + metal.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.allocationPercentage}>
                    {allocation.percentage}%
                  </Text>
                </View>
                <Text style={styles.allocationValue}>
                  {formatCurrency(allocation.value)}
                </Text>
              </View>
              
              <View style={styles.allocationBar}>
                <View 
                  style={[
                    styles.allocationFill,
                    { width: `${allocation.percentage}%` }
                  ]} 
                />
              </View>
              
              {allocation.gainLoss !== undefined && (
                <Text style={[
                  styles.gainLoss,
                  { color: allocation.gainLoss >= 0 ? theme.colors.success : theme.colors.danger }
                ]}>
                  {formatCurrency(allocation.gainLoss)} ({formatPercentage(allocation.gainLossPercentage)})
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Performance Chart Placeholder */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.chartPlaceholder}>
          <Icon name="show-chart" size={48} color={theme.colors.gray} />
          <Text style={styles.chartPlaceholderText}>
            Portfolio performance chart will be displayed here
          </Text>
        </View>
      </View>

      {/* Recent Transactions Preview */}
      {portfolio?.recentTransactions?.length > 0 && (
        <View style={styles.transactionsContainer}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {portfolio.recentTransactions.slice(0, 3).map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>
                  {transaction.type}
                </Text>
                <Text style={styles.transactionDate}>
                  {transaction.date}
                </Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={[
                  styles.transactionAmountText,
                  { color: transaction.type === 'BUY' ? theme.colors.danger : theme.colors.success }
                ]}>
                  {transaction.type === 'BUY' ? '-' : '+'}{formatCurrency(transaction.amount)}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: transaction.status === 'COMPLETED' 
                      ? theme.colors.success 
                      : theme.colors.warning 
                  }
                ]}>
                  <Text style={styles.statusText}>{transaction.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary
  },
  
  loadingText: {
    color: theme.colors.white,
    fontSize: 16
  },
  
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  headerContent: {
    flex: 1
  },
  
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.xs
  },
  
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white
  },
  
  notificationIcon: {
    padding: theme.spacing.sm
  },
  
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginTop: -25
  },
  
  statCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs
  },
  
  statLabel: {
    fontSize: 12,
    color: theme.colors.gray,
    textAlign: 'center'
  },
  
  navCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm
  },
  
  navLabel: {
    fontSize: 14,
    color: theme.colors.gray,
    fontWeight: '600'
  },
  
  navTime: {
    fontSize: 12,
    color: theme.colors.gray
  },
  
  navValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm
  },
  
  navChange: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  navChangeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: theme.spacing.xs
  },
  
  actionsContainer: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md
  },
  
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: theme.spacing.xs
  },
  
  allocationContainer: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md
  },
  
  allocationItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm
  },
  
  metalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  
  metalIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm
  },
  
  metalName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs
  },
  
  allocationPercentage: {
    fontSize: 14,
    color: theme.colors.gray
  },
  
  allocationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success
  },
  
  allocationBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden'
  },
  
  allocationFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3
  },
  
  gainLoss: {
    fontSize: 12,
    fontWeight: '600'
  },
  
  chartContainer: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md
  },
  
  chartPlaceholder: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200
  },
  
  chartPlaceholderText: {
    fontSize: 14,
    color: theme.colors.gray,
    textAlign: 'center',
    marginTop: theme.spacing.md
  },
  
  transactionsContainer: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md
  },
  
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600'
  },
  
  transactionItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  transactionInfo: {
    flex: 1
  },
  
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs
  },
  
  transactionDate: {
    fontSize: 12,
    color: theme.colors.gray
  },
  
  transactionAmount: {
    alignItems: 'flex-end'
  },
  
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs
  },
  
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm
  },
  
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.white
  }
});

export default HomeScreen;