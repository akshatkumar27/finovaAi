import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackButton, Button, AnimatedMascot, Header } from '../../components';
import { colors, typography, spacing } from '../../constants';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { formatCurrency } from '../../utils';
import { formatNumberInput } from '../../utils/formatNumber';
import { useCurrency } from '../../context/CurrencyContext';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;
type ScreenRouteProp = RouteProp<OnboardingStackParamList, 'MonthlyEMI'>;

export const MonthlyEMIScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ScreenRouteProp>();
    const [amount, setAmount] = useState('');
    const scrollViewRef = React.useRef<ScrollView>(null);
    const { currencySymbol } = useCurrency();
    const onboardingData = route.params?.onboardingData || {};

    const monthlyIncome = onboardingData.monthly_income || 0;
    const monthlyExpenses = onboardingData.monthly_expenses || 0;
    const availableAmount = monthlyIncome - monthlyExpenses;
    const emiAmount = amount.trim() === '' ? -1 : (parseInt(amount.replace(/,/g, '')) || 0);
    const isExceedingAvailable = emiAmount > availableAmount;

    const handleContinue = () => {
        if (amount.trim() === '') {
            Toast.show({
                type: 'error',
                text1: 'Invalid Input',
                text2: 'Please enter your EMI amount (0 is allowed).',
            });
            return;
        }

        if (isExceedingAvailable) {
            Toast.show({
                type: 'error',
                text1: 'Excessive EMI',
                text2: `EMI cannot exceed available amount (${currencySymbol}${availableAmount.toLocaleString()})`,
            });
            return;
        }

        navigation.navigate('EMIOutstanding', {
            onboardingData: { ...onboardingData, monthly_emi: emiAmount }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <Header title="Step 3 of 5" titleStyle={styles.stepIndicator} />

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
                        <Text style={styles.progressPercent}>60%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '60%' }]} />
                    </View>
                    {/* Illustration */}
                    <View style={styles.illustrationContainer}>
                        <Text style={styles.emoji}>📋</Text>
                    </View>

                    <Text style={styles.title}>What is your monthly EMI payment?</Text>

                    {/* Available Amount Info */}
                    <Text style={styles.availableText}>
                        Available after expenses: {formatCurrency(availableAmount, currencySymbol)}
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

                    {/* Error Message */}
                    {isExceedingAvailable && (
                        <Text style={styles.errorText}>
                            EMI cannot exceed available amount ({formatCurrency(availableAmount, currencySymbol)})
                        </Text>
                    )}

                    <View style={styles.noteCard}>
                        <Text style={styles.noteIcon}>💡</Text>
                        <Text style={styles.noteText}>
                            Enter 0 if you don't have any active EMIs
                        </Text>
                    </View>
                </ScrollView>

                {/* Mascot at bottom */}
                <View style={styles.mascotContainer}>
                    <AnimatedMascot text="How much do you pay in EMIs? Include home, car, and personal loans!" />
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Continue"
                        onPress={handleContinue}
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
    noteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: spacing.md,
        marginTop: spacing.md,
    },
    noteIcon: {
        fontSize: 20,
        marginRight: spacing.sm,
    },
    noteText: {
        flex: 1,
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    mascotContainer: {
        paddingHorizontal: spacing.xs,
    },
});
