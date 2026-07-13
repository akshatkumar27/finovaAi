import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackButton, Button, AnimatedMascot, Header } from '../../components';
import { colors, typography, spacing } from '../../constants';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { api } from '../../services';
import { formatCurrency } from '../../utils';
import { formatNumberInput } from '../../utils/formatNumber';
import { useCurrency } from '../../context/CurrencyContext';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;
type ScreenRouteProp = RouteProp<OnboardingStackParamList, 'MonthlyInvestment'>;

export const MonthlyInvestmentScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ScreenRouteProp>();
    const [amount, setAmount] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const scrollViewRef = React.useRef<ScrollView>(null);
    const { currencySymbol } = useCurrency();
    const onboardingData = route.params?.onboardingData || {};

    const monthlyIncome = onboardingData.monthly_income || 0;
    const monthlyExpenses = onboardingData.monthly_expenses || 0;
    const monthlyEmi = onboardingData.monthly_emi || 0;
    const availableAmount = monthlyIncome - monthlyExpenses - monthlyEmi;

    const investmentAmount = parseInt(amount.replace(/,/g, '')) || 0;
    const isExceedingAvailable = investmentAmount > availableAmount;

    const handleComplete = async () => {
        if (amount.trim() === '') {
            Toast.show({
                type: 'error',
                text1: 'Invalid Input',
                text2: 'Please enter your monthly savings amount (0 is allowed).',
            });
            return;
        }

        if (isExceedingAvailable) {
            Toast.show({
                type: 'error',
                text1: 'Excessive Savings',
                text2: `Savings cannot exceed available amount (${currencySymbol}${availableAmount.toLocaleString()})`,
            });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                monthly_income: onboardingData.monthly_income || 0,
                monthly_expenses: onboardingData.monthly_expenses || 0,
                monthly_emi: onboardingData.monthly_emi || 0,
                emi_outstanding: onboardingData.emi_outstanding || 0,
                monthly_investment: investmentAmount,
            };
            console.log('payload--', payload);

            // Save onboarding data for use in Pulse screen suggestions
            await AsyncStorage.setItem('onboardingData', JSON.stringify(payload));

            // Save financial profile to backend
            const response = await api.post('/api/user/financial-profile', payload);
            console.log('Financial profile saved:', response.data);

            // Mark onboarding as complete in local storage
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.isNewUser = false;
                await AsyncStorage.setItem('user', JSON.stringify(user));
            }
            // await AsyncStorage.setItem('onboardingStatus', 'COMPLETED');

            // Go directly to the main app (Pulse screen)
            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' as never }],
            });
        } catch (error) {
            console.error('Onboarding submit error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <Header title="Step 5 of 5" titleStyle={styles.stepIndicator} />


            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    <View style={styles.progressSection}>
                        <Text style={styles.progressLabel}>Profile Completion</Text>
                        <Text style={styles.progressPercent}>100%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '100%' }]} />
                    </View>
                    {/* Illustration */}
                    <View style={styles.illustrationContainer}>
                        <Text style={styles.emoji}>📈</Text>
                        <View style={styles.sparkles}>
                            <Text style={styles.sparkle}>✨</Text>
                            <Text style={styles.sparkle}>✨</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>How much do you save monthly?</Text>

                    {/* Available Amount Info */}
                    <Text style={styles.availableText}>
                        Available for savings: {formatCurrency(availableAmount, currencySymbol)}
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                        <TextInput
                            style={[styles.amountInput, isExceedingAvailable && styles.inputError]}
                            value={amount}
                            onChangeText={(text) => setAmount(formatNumberInput(text))}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    {/* Error/Warning Message */}
                    {isExceedingAvailable && (
                        <Text style={styles.errorText}>
                            Investment cannot exceed available amount ({formatCurrency(availableAmount, currencySymbol)})
                        </Text>
                    )}
                </ScrollView>

                {/* Mascot at bottom */}
                <View style={styles.mascotContainer}>
                    <AnimatedMascot text="Almost there! 🎉
Add monthly savings so I can track them for you." />
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Set Your Goals"
                        onPress={handleComplete}
                        loading={isSaving}
                        disabled={isSaving}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    stepIndicator: {
        // flex: 1,
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.medium as any,
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    progressSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    progressLabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
    },
    progressPercent: {
        color: colors.primary,
        fontSize: typography.caption,
        fontWeight: typography.medium as any,
    },
    progressBar: {
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        marginBottom: spacing.xl,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    illustrationContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    emoji: {
        fontSize: 80,
    },
    sparkles: {
        flexDirection: 'row',
        gap: 16,
        marginTop: spacing.sm,
    },
    sparkle: {
        fontSize: 20,
    },
    title: {
        color: colors.textPrimary,
        fontSize: typography.h2,
        fontWeight: typography.bold as any,
        marginBottom: spacing.sm,
        textAlign: 'center',
        lineHeight: 32,
    },
    availableText: {
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    currencySymbol: {
        color: colors.textPrimary,
        fontSize: 32,
        fontWeight: typography.bold as any,
        marginRight: spacing.sm,
    },
    amountInput: {
        color: colors.textPrimary,
        fontSize: 48,
        fontWeight: typography.bold as any,
        minWidth: 20,
        maxWidth: 280,
        textAlign: 'left',
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
        paddingBottom: spacing.sm,
    },
    inputError: {
        borderBottomColor: '#ef4444',
    },
    errorText: {
        color: '#ef4444',
        fontSize: typography.bodySmall,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    mascotContainer: {
        paddingHorizontal: spacing.xs,
    },
});
