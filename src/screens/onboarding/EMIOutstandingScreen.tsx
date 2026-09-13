import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { formatNumberInput } from '../../utils/formatNumber';
import { OnboardingAmountScreen } from './_OnboardingLayout';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;
type ScreenRouteProp = RouteProp<OnboardingStackParamList, 'EMIOutstanding'>;

const PRESETS = [0, 100000, 300000, 500000, 1000000];

export const EMIOutstandingScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ScreenRouteProp>();
    const [amount, setAmount] = useState('');

    const onboardingData = route.params?.onboardingData || {};
    const value = amount.trim() === '' ? -1 : parseInt(amount.replace(/,/g, '')) || 0;

    const handleContinue = () => {
        if (amount.trim() === '') {
            Toast.show({ type: 'error', text1: 'Fill this in', text2: 'Enter your outstanding EMI (0 is fine).' });
            return;
        }
        navigation.navigate('MonthlyInvestment', {
            onboardingData: { ...onboardingData, emi_outstanding: value },
        });
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
