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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackButton, Button, AnimatedMascot, Header } from '../../components';
import { colors, typography, spacing } from '../../constants';
import { formatNumberInput } from '../../utils/formatNumber';

import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCurrency } from '../../context/CurrencyContext';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

export const MonthlyIncomeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [amount, setAmount] = useState('');
    const scrollViewRef = React.useRef<ScrollView>(null);
    const { currencySymbol } = useCurrency();

    const handleContinue = () => {
        const incomeValue = parseInt(amount.replace(/,/g, '')) || 0;

        if (!amount.trim() || incomeValue <= 0) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Input',
                text2: 'Please enter a valid monthly income greater than 0.',
            });
            return;
        }

        navigation.navigate('MonthlyExpenses', {
            onboardingData: { monthly_income: incomeValue }
        });
    };

    // React.useEffect(() => {
    //     const saveStatus = async () => {
    //         await AsyncStorage.setItem('onboardingStatus', 'MonthlyIncome');
    //     };
    //     saveStatus();
    // }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <Header title="Step 1 of 5" titleStyle={styles.stepIndicator} />

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
                        <Text style={styles.progressPercent}>20%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '20%' }]} />
                    </View>
                    {/* Illustration */}
                    <View style={styles.illustrationContainer}>
                        <Text style={styles.emoji}>💰</Text>
                    </View>

                    <Text style={styles.title}>What is your monthly income?</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={(text) => setAmount(formatNumberInput(text))}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                </ScrollView>

                {/* Mascot at bottom */}
                <View style={styles.mascotContainer}>
                    <AnimatedMascot text="Let me know your monthly income so I can understand your financial capacity!" />
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
        fontWeight: typography.medium,
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
        fontWeight: typography.medium,
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
        fontWeight: typography.bold,
        marginBottom: spacing.sm,
        textAlign: 'center',
        lineHeight: 32,
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: typography.body,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    currencySymbol: {
        color: colors.textPrimary,
        fontSize: 32,
        fontWeight: typography.bold,
        marginRight: spacing.sm,
    },
    amountInput: {
        color: colors.textPrimary,
        fontSize: 48,
        fontWeight: typography.bold,
        minWidth: 20,
        maxWidth: 280,
        textAlign: 'left',
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
        paddingBottom: spacing.sm,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    mascotContainer: {
        paddingHorizontal: spacing.xs,
    },
});
