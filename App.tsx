import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootNavigator } from './src/navigation';
import Toast from 'react-native-toast-message';
import { toastConfig, Logo } from './src/components';
import { notificationService } from './src/services/NotificationService';
import { api } from './src/services';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { Provider } from 'react-redux';
import { store } from './src/store';
function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | undefined>(undefined);
  const [initialParams, setInitialParams] = useState<any>(undefined);
  const [appCurrency, setAppCurrency] = useState('₹');

  useEffect(() => {
    checkAuthStatus();

    // Notification Setup
    const setupNotifications = async () => {
      await notificationService.requestUserPermission();
      notificationService.createChannel();
      const unsubscribe = notificationService.setupForegroundHandler();
      return unsubscribe;
    };

    const setupCurrency = async () => {
      try {
        const storedSymbol = await AsyncStorage.getItem('appCurrencySymbol');
        if (storedSymbol) {
          setAppCurrency(storedSymbol);
          return; // Already cached
        }

        let symbol = '₹'; // default

        try {
          const response = await fetch('https://ipapi.co/json');
          const data = await response.json();
          console.log('data --> c', data);
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
          console.warn('IP API currency detection failed, falling back to locale', apiError);
          // Fallback to system locale currency
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
        setAppCurrency(symbol);
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
        // No token at all — go to Auth
        setIsLoggedIn(false);
        setInitialRoute('Auth');
        return;
      }

      // --- Step 1: Validate token via /api/me ---
      let meData: any = null;
      console.log('meData 2', token);

      // Removed dispatch imports to top level manually next
      try {
        const meRes = await api.get('/api/auth/me');
        meData = meRes.data;
        console.log('meData', meData?.user);
        setIsOnboardingCompleted(meData?.user?.isFinancialProfilePresent);

        // Save in global storage
        await AsyncStorage.setItem('isFinancialProfilePresent', JSON.stringify(meData?.user?.isFinancialProfilePresent || false));

        if (meData?.user?.isFinancialProfilePresent) {
          // store.dispatch({ type: 'financialData/setFinancialProfilePresent', payload: true });
          try {
            const profileRes = await api.get('/api/user/financial-profile');
            if (profileRes.data && profileRes.data.data) {
              const profileData = profileRes.data.data;
              const payload = {
                monthly_income: profileData.monthly_income || 0,
                monthly_expenses: profileData.monthly_expenses || 0,
                monthly_emi: profileData.monthly_emi || 0,
                emi_outstanding: profileData.emi_outstanding || 0,
                monthly_investment: profileData.monthly_investment || 0,
              };
              await AsyncStorage.setItem('onboardingData', JSON.stringify(payload));

              store.dispatch({
                type: 'financialData/setFinancialData',
                payload: {
                  monthlyIncome: profileData.monthly_income || 0,
                  monthlyExpenses: profileData.monthly_expenses || 0,
                  monthlyEmi: profileData.monthly_emi || 0,
                  emiOutstanding: profileData.emi_outstanding || 0,
                  monthlyInvestment: profileData.monthly_investment || 0,
                }
              });
            }
          } catch (profileErr) {
            console.error('Failed to fetch financial profile:', profileErr);
          //   await AsyncStorage.multiRemove(['authToken', 'user', 'onboardingStatus', 'onboarding_draft']);
          // store.dispatch({ type: 'financialData/clearFinancialData' });
          // setIsLoggedIn(false);
          // setIsOnboardingCompleted(false);
          // setInitialRoute('Auth');
          // return;
          }
        } else {
          store.dispatch({ type: 'financialData/setFinancialProfilePresent', payload: false });
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401 ) {
          // Token expired — clear everything and go to Auth
          await AsyncStorage.multiRemove(['authToken', 'user', 'onboardingStatus', 'onboarding_draft']);
          store.dispatch({ type: 'financialData/clearFinancialData' });
          setIsLoggedIn(false);
          setIsOnboardingCompleted(false);
          setInitialRoute('Auth');
          return;
        }
        // Network/server error — fall back to stored user data
      }

      setIsLoggedIn(true);

      // --- Step 2: Set onboarding state directly from /api/me ---
      const isNewUser = meData?.isNewUser ?? meData?.user?.isNewUser;
      const onboardingCompleted = isNewUser === false;
      // setIsOnboardingCompleted(onboardingCompleted);

      // --- Step 3: Determine initial route ---
      if (meData?.user?.isFinancialProfilePresent) {
        setInitialRoute('Main');
      } else {
        // Always start onboarding from the beginning — don't resume mid-flow
        setInitialRoute('Onboarding');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoggedIn(false);
      setIsOnboardingCompleted(false);
      setInitialRoute('Auth');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a14" />
        <View style={styles.splashContent}>
          <Logo size="large" />
          <ActivityIndicator size="small" color="#1192e9ff" style={styles.splashSpinner} />
        </View>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <CurrencyProvider initialSymbol={appCurrency}>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor="#0a0a14" />
          <RootNavigator
            isLoggedIn={isLoggedIn}
            isOnboardingCompleted={isOnboardingCompleted}
            initialRouteName={initialRoute}
            initialParams={initialParams}
          />
          <Toast config={toastConfig} position="bottom" bottomOffset={40} visibilityTime={4000} />
        </NavigationContainer>
      </CurrencyProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a14',
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
