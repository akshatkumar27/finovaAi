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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackButton, Button, AnimatedMascot, Header } from '../../components';
import { colors, typography, spacing } from '../../constants';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { formatNumberInput } from '../../utils/formatNumber';
import { useCurrency } from '../../context/CurrencyContext';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;
type ScreenRouteProp = RouteProp<OnboardingStackParamList, 'EMIOutstanding'>;

export const EMIOutstandingScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ScreenRouteProp>();
    const [amount, setAmount] = useState('');
    const scrollViewRef = React.useRef<ScrollView>(null);
    const { currencySymbol } = useCurrency();
    const onboardingData = route.params?.onboardingData || {};

    const outstandingAmount = amount.trim() === '' ? -1 : (parseInt(amount.replace(/,/g, '')) || 0);

    const handleContinue = () => {
        if (amount.trim() === '') {
            Toast.show({
                type: 'error',
                text1: 'Invalid Input',
                text2: 'Please enter your outstanding EMI amount (0 is allowed).',
            });
            return;
        }

        navigation.navigate('MonthlyInvestment', {
            onboardingData: { ...onboardingData, emi_outstanding: outstandingAmount }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <Header title="Step 4 of 5" titleStyle={styles.stepIndicator} />

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
                        <Text style={styles.progressPercent}>80%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '80%' }]} />
                    </View>
                    {/* Illustration */}
                    <View style={styles.illustrationContainer}>
                        <Text style={styles.emoji}>🏦</Text>
                    </View>

                    <Text style={styles.title}>What is your total outstanding EMI?</Text>

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

                    <View style={styles.noteCard}>
                        <Text style={styles.noteIcon}>💡</Text>
                        <Text style={styles.noteText}>
                            This is the total principal amount remaining on all your loans
                        </Text>
                    </View>
                </ScrollView>

                {/* Mascot at bottom */}
                <View style={styles.mascotContainer}>
                    <AnimatedMascot text="What's the total amount remaining on all your loans?" />
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
    noteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: spacing.md,
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
