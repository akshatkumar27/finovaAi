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
import { formatNumberInput } from '../../utils/formatNumber';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { formatCurrency } from '../../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCurrency } from '../../context/CurrencyContext';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;
type ScreenRouteProp = RouteProp<OnboardingStackParamList, 'MonthlyExpenses'>;

export const MonthlyExpensesScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ScreenRouteProp>();
    const [amount, setAmount] = useState('');
    const scrollViewRef = React.useRef<ScrollView>(null);
    const { currencySymbol } = useCurrency();
    const onboardingData = route.params?.onboardingData || {};
    const monthlyIncome = onboardingData.monthly_income || 0;

    // React.useEffect(() => {
    //     const saveStatus = async () => {
    //         await AsyncStorage.setItem('onboardingStatus', 'MonthlyExpenses');
    //         // Optionally save current data progress if needed for robust restore
    //         if (onboardingData) {
    //             await AsyncStorage.setItem('onboarding_progress_data', JSON.stringify(onboardingData));
    //         }
    //     };
    //     saveStatus();
    // }, [onboardingData]);

    const expenseAmount = parseInt(amount.replace(/,/g, '')) || 0;
    const isExceedingIncome = expenseAmount > monthlyIncome;

    const handleContinue = () => {
        if (!amount.trim() || expenseAmount <= 0) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Input',
                text2: 'Please enter a valid expense amount greater than 0.',
            });
            return;
        }

        if (isExceedingIncome) {
            Toast.show({
                type: 'error',
                text1: 'Excessive Expenses',
                text2: `Expenses cannot exceed your income (${currencySymbol}${monthlyIncome.toLocaleString()})`,
            });
            return;
        }

        navigation.navigate('MonthlyEMI', {
            onboardingData: { ...onboardingData, monthly_expenses: expenseAmount }
        });
    };
    const isValid = amount.trim() !== '' && expenseAmount > 0 && !isExceedingIncome;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <Header title="Step 2 of 5" titleStyle={styles.stepIndicator} />

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
                        <Text style={styles.progressPercent}>40%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '40%' }]} />
                    </View>
                    {/* Illustration */}
                    <View style={styles.illustrationContainer}>
                        <Text style={styles.emoji}>🛒</Text>
                    </View>

                    <Text style={styles.title}>What are your monthly expenses?</Text>

                    {/* Available Income Info */}
                    <Text style={styles.availableText}>
                        Your income: {formatCurrency(monthlyIncome, currencySymbol)}
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                        <TextInput
                            style={[styles.amountInput, isExceedingIncome && styles.inputError]}
                            value={amount}
                            onChangeText={(text) => setAmount(formatNumberInput(text))}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    {/* Error Message */}
                    {isExceedingIncome && (
                        <Text style={styles.errorText}>
                            Expenses cannot exceed your income ({formatCurrency(monthlyIncome, currencySymbol)})
                        </Text>
                    )}
                </ScrollView>

                {/* Mascot at bottom */}
                <View style={styles.mascotContainer}>
                    <AnimatedMascot text="Tell me about your monthly expenses like rent, utilities, and groceries!" />
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
    footer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    mascotContainer: {
        paddingHorizontal: spacing.xs,
    },
});
