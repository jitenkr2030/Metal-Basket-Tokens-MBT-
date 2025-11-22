// MBT Mobile App - React Native Application
// Metal Basket Tokens - Cross-platform Mobile App

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  Dimensions
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import InvestmentScreen from './src/screens/InvestmentScreen';
import SIPScreen from './src/screens/SIPScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Import services
import { AuthService } from './src/services/AuthService';
import { MBTService } from './src/services/MBTService';
import { NotificationService } from './src/services/NotificationService';

const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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
    dark: '#1f2937',
    white: '#ffffff',
    gray: '#6b7280',
    background: '#f9fafb'
  },
  fonts: {
    regular: 'System',
    bold: 'System-Bold',
    medium: 'System-Medium'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16
  }
};

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Portfolio':
              iconName = 'account-balance-wallet';
              break;
            case 'Investment':
              iconName = 'add-circle';
              break;
            case 'SIP':
              iconName = 'schedule';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'home';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Investment" component={InvestmentScreen} />
      <Tab.Screen name="SIP" component={SIPScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Authentication Navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('mbt_token');
      if (token) {
        // Validate token with server
        const isValid = await AuthService.validateToken(token);
        if (isValid) {
          setUserToken(token);
          NotificationService.initialize();
        } else {
          await AsyncStorage.removeItem('mbt_token');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await AsyncStorage.removeItem('mbt_token');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {userToken ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabNavigator} />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

// Main App Component
const App = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <AppNavigator />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  
  // Common Components
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.sm
  },
  
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.sm
  },
  
  buttonOutlineText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600'
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.md
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.dark,
    marginBottom: theme.spacing.xs
  },
  
  // Home Screen Styles
  homeHeader: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: theme.spacing.lg
  },
  
  homeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs
  },
  
  homeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginTop: -30
  },
  
  statCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    flex: 1,
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
    color: theme.colors.gray
  },
  
  // Investment Styles
  allocationBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginVertical: theme.spacing.sm,
    overflow: 'hidden'
  },
  
  allocationFill: {
    height: '100%',
    backgroundColor: theme.colors.primary
  },
  
  // Portfolio Styles
  metalCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  
  metalInfo: {
    flex: 1
  },
  
  metalName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.dark,
    marginBottom: theme.spacing.xs
  },
  
  metalAllocation: {
    fontSize: 14,
    color: theme.colors.gray
  },
  
  metalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary
  },
  
  loadingText: {
    color: theme.colors.white,
    fontSize: 16,
    marginTop: theme.spacing.md
  },
  
  // Gradient Styles
  gradient: {
    flex: 1
  }
});

export default App;