import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { api } from '../../services';
import { formatNumberInput } from '../../utils/formatNumber';
import { OnboardingAmountScreen } from './_OnboardingLayout';
import { useCurrency } from '../../context/CurrencyContext';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;
type ScreenRouteProp = RouteProp<OnboardingStackParamList, 'MonthlyInvestment'>;

const PRESETS = [0, 5000, 10000, 15000, 25000];

export const MonthlyInvestmentScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ScreenRouteProp>();
    const { currencySymbol } = useCurrency();
    const [amount, setAmount] = useState('');
    const [saving, setSaving] = useState(false);

    const onboardingData = route.params?.onboardingData || {};
    const monthlyIncome = onboardingData.monthly_income || 0;
    const monthlyExpenses = onboardingData.monthly_expenses || 0;
    const monthlyEmi = onboardingData.monthly_emi || 0;
    const available = monthlyIncome - monthlyExpenses - monthlyEmi;
    const value = parseInt(amount.replace(/,/g, '')) || 0;
    const exceeds = value > available;

    const handleComplete = async () => {
        if (amount.trim() === '') {
            Toast.show({ type: 'error', text1: 'Fill this in', text2: 'Enter a monthly amount (0 is fine).' });
            return;
        }
        if (exceeds) {
            Toast.show({ type: 'error', text1: 'Too high', text2: `Can't exceed available (${currencySymbol}${available.toLocaleString()}).` });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                monthly_income: onboardingData.monthly_income || 0,
                monthly_expenses: onboardingData.monthly_expenses || 0,
                monthly_emi: onboardingData.monthly_emi || 0,
                emi_outstanding: onboardingData.emi_outstanding || 0,
                monthly_investment: value,
            };
            await AsyncStorage.setItem('onboardingData', JSON.stringify(payload));
            await api.post('/api/user/financial-profile', payload);

            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.isNewUser = false;
                await AsyncStorage.setItem('user', JSON.stringify(user));
            }
            navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
        } catch (error) {
            console.error('Onboarding submit error:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong. Please try again.' });
        } finally { setSaving(false); }
    };

    return (
        <OnboardingAmountScreen
            step={5}
            title="Already investing?"
            helper="SIPs, mutual funds, stocks, gold — monthly average."
            amount={amount}
            onAmountChange={(v) => setAmount(formatNumberInput(v))}
            chipPresets={PRESETS}
            onChipPress={(n) => setAmount(n === 0 ? '0' : formatNumberInput(String(n)))}
            error={exceeds ? `Can't exceed available amount of ${currencySymbol}${available.toLocaleString()}.` : undefined}
            footerHint={available > 0 ? `Available after essentials: ${currencySymbol}${available.toLocaleString()}` : undefined}
            continueLabel="Finish setup"
            continueDisabled={exceeds}
            continueLoading={saving}
            onContinue={handleComplete}
        />
    );
};
