import React, { useState } from 'react';
import { toast } from 'sonner-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { api } from '../../services';
import { formatNumberInput } from '../../utils/formatNumber';
import { OnboardingAmountScreen } from './_OnboardingLayout';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { RootState } from '../../store';
import { setFinancialData, setFinancialProfilePresent } from '../../store/slices/financialDataSlice';
import { updateUser } from '../../store/slices/authSlice';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

const PRESETS = [0, 5000, 10000, 15000, 25000];

export const MonthlyInvestmentScreen: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const currencySymbol = useSelector((state: RootState) => state.settings.appCurrency);
    const { monthlyIncome, monthlyExpenses, monthlyEmi, emiOutstanding } = useSelector((state: RootState) => state.financialData, shallowEqual);
    const [amount, setAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const available = monthlyIncome - monthlyExpenses - monthlyEmi;
    const value = parseInt(amount.replace(/,/g, '')) || 0;
    const exceeds = value > available;

    const handleComplete = async () => {
        if (amount.trim() === '') {
            toast.error('Fill this in', { description: 'Enter a monthly amount (0 is fine).' });
            return;
        }
        if (exceeds) {
            toast.error('Too high', { description: `Can't exceed available (${currencySymbol}${available.toLocaleString()}).` });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                monthly_income: monthlyIncome || 0,
                monthly_expenses: monthlyExpenses || 0,
                monthly_emi: monthlyEmi || 0,
                emi_outstanding: emiOutstanding || 0,
                monthly_investment: value,
            };
            
            await api.post('/api/user/financial-profile', payload);

            dispatch(setFinancialData({ monthlyInvestment: value }));
            dispatch(setFinancialProfilePresent(true));
            dispatch(updateUser({ isNewUser: false, isFinancialProfilePresent: true }));

            navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
        } catch (error) {
            console.error('Onboarding submit error:', error);
            toast.error('Error', { description: 'Something went wrong. Please try again.' });
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
