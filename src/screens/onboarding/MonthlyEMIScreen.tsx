import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { formatNumberInput } from '../../utils/formatNumber';
import { OnboardingAmountScreen } from './_OnboardingLayout';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { RootState } from '../../store';
import { setFinancialData } from '../../store/slices/financialDataSlice';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

const PRESETS = [0, 5000, 10000, 20000, 30000];

export const MonthlyEMIScreen: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const currencySymbol = useSelector((state: RootState) => state.settings.appCurrency);
    const { monthlyIncome, monthlyExpenses } = useSelector((state: RootState) => state.financialData, shallowEqual);
    const [amount, setAmount] = useState('');
    const available = monthlyIncome - monthlyExpenses;
    const value = amount.trim() === '' ? -1 : parseInt(amount.replace(/,/g, '')) || 0;
    const exceeds = value > available;

    const handleContinue = () => {
        if (amount.trim() === '') {
            Toast.show({ type: 'error', text1: 'Fill this in', text2: 'Enter your EMI (0 is fine).' });
            return;
        }
        if (exceeds) {
            Toast.show({ type: 'error', text1: 'Too high', text2: `EMI can't exceed available (${currencySymbol}${available.toLocaleString()}).` });
            return;
        }
        dispatch(setFinancialData({ monthlyEmi: value }));
        navigation.navigate('EMIOutstanding');
    };

    return (
        <OnboardingAmountScreen
            step={3}
            title="Monthly EMIs."
            helper="Loan, credit-card minimums, anything you must pay each month."
            amount={amount}
            onAmountChange={(v) => setAmount(formatNumberInput(v))}
            chipPresets={PRESETS}
            onChipPress={(n) => setAmount(n === 0 ? '0' : formatNumberInput(String(n)))}
            error={exceeds ? `EMI can't exceed your available amount of ${currencySymbol}${available.toLocaleString()}.` : undefined}
            footerHint={available > 0 ? `Available after expenses: ${currencySymbol}${available.toLocaleString()}` : undefined}
            continueDisabled={exceeds}
            onContinue={handleContinue}
        />
    );
};
