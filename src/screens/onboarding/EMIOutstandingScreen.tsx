import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { formatNumberInput } from '../../utils/formatNumber';
import { OnboardingAmountScreen } from './_OnboardingLayout';
import { useDispatch } from 'react-redux';
import { setFinancialData } from '../../store/slices/financialDataSlice';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

const PRESETS = [0, 100000, 300000, 500000, 1000000];

export const EMIOutstandingScreen: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const [amount, setAmount] = useState('');

    const value = amount.trim() === '' ? -1 : parseInt(amount.replace(/,/g, '')) || 0;

    const handleContinue = () => {
        if (amount.trim() === '') {
            Toast.show({ type: 'error', text1: 'Fill this in', text2: 'Enter your outstanding EMI (0 is fine).' });
            return;
        }
        dispatch(setFinancialData({ emiOutstanding: value }));
        navigation.navigate('MonthlyInvestment');
    };

    return (
        <OnboardingAmountScreen
            step={4}
            title="Total EMI outstanding."
            helper="Roughly, what's left across your loans. We use this to protect your goals during high-EMI periods."
            amount={amount}
            onAmountChange={(v) => setAmount(formatNumberInput(v))}
            chipPresets={PRESETS}
            onChipPress={(n) => setAmount(n === 0 ? '0' : formatNumberInput(String(n)))}
            onContinue={handleContinue}
        />
    );
};
