import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { formatNumberInput } from '../../utils/formatNumber';
import { OnboardingAmountScreen } from './_OnboardingLayout';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setFinancialData } from '../../store/slices/financialDataSlice';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

const PRESETS = [20000, 30000, 45000, 60000, 80000];

export const MonthlyExpensesScreen: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const currencySymbol = useSelector((state: RootState) => state.settings.appCurrency);
    const monthlyIncome = useSelector((state: RootState) => state.financialData.monthlyIncome);
    const [amount, setAmount] = useState('');
    const value = parseInt(amount.replace(/,/g, '')) || 0;
    const exceedsIncome = value > monthlyIncome;

    const handleContinue = () => {
        if (!amount.trim() || value <= 0) {
            Toast.show({ type: 'error', text1: 'Invalid input', text2: 'Enter an amount greater than 0.' });
            return;
        }
        if (exceedsIncome) {
            Toast.show({ type: 'error', text1: 'Too high', text2: `Expenses can't exceed your income (${currencySymbol}${monthlyIncome.toLocaleString()}).` });
            return;
        }
        dispatch(setFinancialData({ monthlyExpenses: value }));
        navigation.navigate('MonthlyEMI');
    };

    return (
        <OnboardingAmountScreen
            step={2}
            title="Monthly expenses."
            helper="Rent, food, subscriptions — the essentials."
            amount={amount}
            onAmountChange={(v) => setAmount(formatNumberInput(v))}
            chipPresets={PRESETS}
            onChipPress={(n) => setAmount(formatNumberInput(String(n)))}
            error={exceedsIncome ? `Expenses can't exceed your income of ${currencySymbol}${monthlyIncome.toLocaleString()}.` : undefined}
            footerHint={monthlyIncome > 0 ? `Income on record: ${currencySymbol}${monthlyIncome.toLocaleString()}` : undefined}
            continueDisabled={exceedsIncome}
            onContinue={handleContinue}
        />
    );
};
