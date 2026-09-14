import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootNavigator } from './src/navigation';
import { Logo } from './src/components';
import { notificationService } from './src/services/NotificationService';
import { api } from './src/services';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from './src/store';
import { ThemeProvider, useTheme } from './src/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { login, logout } from './src/store/slices/authSlice';
import { setCurrency } from './src/store/slices/settingsSlice';
import { setFinancialProfilePresent, setFinancialData, clearFinancialData } from './src/store/slices/financialDataSlice';

const ThemedStatusBar: React.FC = () => {
  const { isDark, colors } = useTheme();
  return <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.canvas} />;
};

const SplashScreen: React.FC = () => {
  const { isDark, colors } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.canvas }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.canvas} />
      <View style={styles.splashContent}>
        <Logo size="large" />
        <ActivityIndicator size="small" color={colors.accent} style={styles.splashSpinner} />
      </View>
    </View>
  );
};
const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isOnboardingCompleted = useSelector((state: RootState) => state.financialData.isFinancialProfilePresent);

  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string | undefined>(undefined);
  const [initialParams, setInitialParams] = useState<any>(undefined);

  useEffect(() => {
    checkAuthStatus();

    const setupNotifications = async () => {
      await notificationService.requestUserPermission();
      notificationService.createChannel();
      return notificationService.setupForegroundHandler();
    };

    const setupCurrency = async () => {
      try {
        const storedSymbol = await AsyncStorage.getItem('appCurrencySymbol');
        if (storedSymbol) {
          dispatch(setCurrency(storedSymbol));
          return;
        }

        let symbol = '₹';

        try {
          const response = await fetch('https://ipapi.co/json');
          const data = await response.json();
          if (data && data.currency) {
            const parts = Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: data.currency,
              minimumFractionDigits: 0,
            }).formatToParts(0);

            const symbolPart = parts.find(p => p.type === 'currency');
            if (symbolPart && symbolPart.value) {
              symbol = symbolPart.value;
            }
          }
        } catch (apiError) {
          const localeCurrency = Intl.NumberFormat().resolvedOptions().currency;
          if (localeCurrency) {
            const parts = Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: localeCurrency,
              minimumFractionDigits: 0,
            }).formatToParts(0);

            const symbolPart = parts.find(p => p.type === 'currency');
            if (symbolPart && symbolPart.value) {
              symbol = symbolPart.value;
            }
          }
        }

        await AsyncStorage.setItem('appCurrencySymbol', symbol);
        dispatch(setCurrency(symbol));
      } catch (e) {
        console.warn('Currency setup failed', e);
      }
    };

    const setupPromises = async () => {
      await setupCurrency();
      return await setupNotifications();
    };

    const unsubscribePromise = setupPromises();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        dispatch(logout());
        setInitialRoute('Auth');
        return;
      }

      let meData: any = null;

      try {
        const meRes = await api.get('/api/auth/me');
        meData = meRes.data;
        
        const user = meData?.user;
        if (user) {
          dispatch(login({ token, user }));
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }

        const isProfilePresent = user?.isFinancialProfilePresent || false;
        dispatch(setFinancialProfilePresent(isProfilePresent));
        await AsyncStorage.setItem('isFinancialProfilePresent', JSON.stringify(isProfilePresent));

        if (isProfilePresent) {
          try {
            const profileRes = await api.get('/api/user/financial-profile');
            if (profileRes.data && profileRes.data.data) {
              const profileData = profileRes.data.data;
              dispatch(setFinancialData({
                  monthlyIncome: profileData.monthly_income || 0,
                  monthlyExpenses: profileData.monthly_expenses || 0,
                  monthlyEmi: profileData.monthly_emi || 0,
                  emiOutstanding: profileData.emi_outstanding || 0,
                  monthlyInvestment: profileData.monthly_investment || 0,
              }));
            }
          } catch (profileErr) {
            console.error('Failed to fetch financial profile:', profileErr);
          }
        } else {
          dispatch(setFinancialProfilePresent(false));
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          await AsyncStorage.multiRemove(['authToken', 'user', 'onboardingStatus', 'onboarding_draft']);
          dispatch(clearFinancialData());
          dispatch(logout());
          setInitialRoute('Auth');
          return;
        }
        
        // Fallback to local storage if offline
        const localUser = await AsyncStorage.getItem('user');
        if (localUser) {
           dispatch(login({ token, user: JSON.parse(localUser) }));
        }
      }

      if (meData?.user?.isFinancialProfilePresent) {
        setInitialRoute('Main');
      } else {
        setInitialRoute('Onboarding');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      dispatch(logout());
      setInitialRoute('Auth');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <ThemedStatusBar />
      <RootNavigator
        isLoggedIn={isLoggedIn}
        isOnboardingCompleted={isOnboardingCompleted}
        initialRouteName={initialRoute}
        initialParams={initialParams}
      />
      <Toaster position="bottom-center" />
    </NavigationContainer>
  );
};

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashSpinner: {
    marginTop: 24,
  },
});

export default App;
