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

const PRESETS = [40000, 60000, 80000, 120000, 200000];

export const MonthlyIncomeScreen: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const [amount, setAmount] = useState('');

    const handleContinue = () => {
        const income = parseInt(amount.replace(/,/g, '')) || 0;
        if (!amount.trim() || income <= 0) {
            Toast.show({ type: 'error', text1: 'Invalid input', text2: 'Enter a monthly income greater than 0.' });
            return;
        }
        dispatch(setFinancialData({ monthlyIncome: income }));
        navigation.navigate('MonthlyExpenses');
    };

    return (
        <OnboardingAmountScreen
            step={1}
            title="Monthly income, roughly."
            helper="After tax. We use this to size your plan, nothing else."
            amount={amount}
            onAmountChange={(v) => setAmount(formatNumberInput(v))}
            chipPresets={PRESETS}
            onChipPress={(n) => setAmount(formatNumberInput(String(n)))}
            onContinue={handleContinue}
        />
    );
};
