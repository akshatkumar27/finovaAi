import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackButton, Button, GoalCard, AnimatedMascot, Header } from '../../components';
import { colors, typography, spacing } from '../../constants';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services';
import { useCurrency } from '../../context/CurrencyContext';

interface Insight {
    title: string;
    description: string;
    amount: number;
    target_months: number;
}

type ScreenRouteProp = RouteProp<OnboardingStackParamList, 'GoalSelection'>;

// Helper function to extract emoji and text from title
const parseTitle = (title: string) => {
    const emojiMatch = title.match(/^(\p{Emoji}+)\s*/u);
    if (emojiMatch) {
        return {
            icon: emojiMatch[1],
            text: title.replace(emojiMatch[0], '').trim(),
        };
    }
    return { icon: '🎯', text: title };
};

// Format amount
const formatAmount = (amount: number, currency: string) => {
    return `${currency}${amount.toLocaleString('en-IN')}`;
};

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

export const GoalSelectionScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ScreenRouteProp>();
    const { currencySymbol } = useCurrency();
    const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [insights, setInsights] = useState<Insight[]>([]);

    const onboardingData = route.params?.onboardingData || {};

    useEffect(() => {
        // const saveStatus = async () => {
        //     await AsyncStorage.setItem('onboardingStatus', 'GoalSelection');
        //     if (onboardingData) {
        //         await AsyncStorage.setItem('onboarding_progress_data', JSON.stringify(onboardingData));
        //     }
        // };
        // saveStatus();
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const payload = {
                monthly_income: onboardingData.monthly_income || 0,
                monthly_expenses: onboardingData.monthly_expenses || 0,
                monthly_emi: onboardingData.monthly_emi || 0,
                emi_outstanding: onboardingData.emi_outstanding || 0,
                monthly_investment: onboardingData.monthly_investment || 0,
            };

            const res = await api.post('/api/insights', payload);
            console.log('Insights response:', res.data);
            if (res.data.success && res.data.insights) {
                setInsights(res.data.insights);
            }
        } catch (error) {
            console.error('Insights API error:', error);
            Toast.show({
                type: 'info',
                text1: 'Info',
                text2: 'Could not load personalized insights. You can continue to set your goals.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        if (selectedGoal === null) return;

        const insight = insights[selectedGoal];
        const { text } = parseTitle(insight.title);

        setIsSaving(true);
        try {
            const payload = {
                name: text,
                target_amount: insight.amount,
                achieve_in_months: insight.target_months,
                monthly_contribution: Math.ceil(insight.amount / insight.target_months),
            };

            console.log('Creating goal from insight:', payload);
            const response = await api.post('/api/goals', payload);
            console.log('Goal created:', response.data);

            // Update local user data to mark onboarding as completed
            try {
                const userStr = await AsyncStorage.getItem('user');
                console.log('Current user in storage:', userStr);
                if (userStr) {
                    const user = JSON.parse(userStr);
                    // Force update regardless of current state to ensure it is synced
                    user.isNewUser = false;
                    await AsyncStorage.setItem('user', JSON.stringify(user));
                    console.log('Updated user in storage:', JSON.stringify(user));
                } else {
                    console.warn('No user found in storage to update');
                }
            } catch (err) {
                console.error('Error updating user onboarding status:', err);
            }

            // Navigate to main app
            // Note: Since App state won't update automatically without a context or event,
            // the user might need to restart the app or we need a way to trigger a refresh.
            // For now, focusing on the storage update as requested.
            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' as never }],
            });
        } catch (error) {
            console.error('Save goal error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to save your goal. Please try again.',
            });
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <Header title="Your Personalized Insight" titleStyle={styles.stepIndicator} />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Mascot - inline compact version */}
                <View style={styles.mascotInline}>
                    <AnimatedMascot
                        text="Yay! I made a plan just for you ✨"
                        mascotImage={require('../../asset/happymascot.png')}
                        mascotWidth={100}
                        mascotHeight={140}
                    />
                </View>

                <Text style={styles.title}>Based on your financial profile</Text>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Analyzing your finances...</Text>
                    </View>
                ) : (
                    <View style={styles.goalsContainer}>
                        {insights.map((insight, index) => {
                            const { icon, text } = parseTitle(insight.title);
                            return (
                                <GoalCard
                                    key={index}
                                    icon={icon}
                                    title={`${text}\n(${insight.target_months} ${insight.target_months === 1 ? 'month' : 'months'})`}
                                    description={insight.description}
                                    highlightedAmount={formatAmount(insight.amount, currencySymbol)}
                                    selected={selectedGoal === index}
                                    onPress={() => setSelectedGoal(index)}
                                />
                            );
                        })}

                        {/* Custom Goal Card */}
                        <GoalCard
                            icon="✨"
                            title="Add Custom Goal"
                            description="Create your own personalized financial goal"
                            selected={false}
                            onPress={() => navigation.navigate('AddGoal')}
                        />
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title={isSaving ? "Setting up... ⏳" : "Let's Get Started! 🚀"}
                    onPress={handleComplete}
                    disabled={selectedGoal === null || isSaving}
                />
            </View>
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
        flex: 1,
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
    illustrationContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    celebrationCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1a2744',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.primary,
    },
    targetEmoji: {
        fontSize: 48,
    },
    sparkles: {
        position: 'absolute',
        width: 160,
        height: 100,
        justifyContent: 'center',
    },
    sparkle: {
        position: 'absolute',
        fontSize: 24,
        left: 0,
        top: 20,
    },
    sparkleRight: {
        left: 'auto',
        right: 0,
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
    goalsContainer: {
        marginBottom: spacing.lg,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    },
    loadingText: {
        color: colors.textSecondary,
        fontSize: typography.body,
        marginTop: spacing.md,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    mascotContainer: {
        paddingHorizontal: spacing.xs,
    },
    mascotInline: {
        marginBottom: spacing.sm,
        transform: [{ scale: 0.95 }],
        marginHorizontal: -spacing.md,
    },
});
