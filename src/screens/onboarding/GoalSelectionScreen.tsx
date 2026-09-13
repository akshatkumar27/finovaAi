import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, BackButton } from '../../components';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../theme';
import { Palette } from '../../theme/palette';

interface Insight {
    title: string;
    description: string;
    amount: number;
    target_months: number;
}

type ScreenRouteProp = RouteProp<OnboardingStackParamList, 'GoalSelection'>;
type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

const parseTitle = (title: string) => {
    const emojiMatch = title.match(/^(\p{Emoji}+)\s*/u);
    if (emojiMatch) return { icon: emojiMatch[1], text: title.replace(emojiMatch[0], '').trim() };
    return { icon: '', text: title };
};

const TargetIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
        <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.8} />
        <Circle cx={12} cy={12} r={1.5} fill={color} />
    </Svg>
);

export const GoalSelectionScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ScreenRouteProp>();
    const { currencySymbol } = useCurrency();
    const { colors, typography } = useTheme();
    const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [insights, setInsights] = useState<Insight[]>([]);

    const onboardingData = route.params?.onboardingData || {};
    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    useEffect(() => { fetchInsights(); /* eslint-disable-next-line */ }, []);

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
            if (res.data.success && res.data.insights) setInsights(res.data.insights);
        } catch (error) {
            console.error('Insights API error:', error);
            Toast.show({ type: 'info', text1: 'Heads up', text2: 'Couldn\'t load personalized suggestions.' });
        } finally { setIsLoading(false); }
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
            await api.post('/api/goals', payload);
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.isNewUser = false;
                await AsyncStorage.setItem('user', JSON.stringify(user));
            }
            navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
        } catch (error) {
            console.error('Save goal error:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save your goal.' });
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.stepCap}>YOUR PLAN</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Suggestions for you.</Text>
                <Text style={styles.helper}>Personalized from your financial profile. Pick one to start.</Text>

                {isLoading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="large" color={colors.accent} />
                        <Text style={styles.loadingText}>Analyzing your finances…</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {insights.map((insight, index) => {
                            const { text } = parseTitle(insight.title);
                            const selected = selectedGoal === index;
                            const monthly = Math.ceil(insight.amount / insight.target_months);
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.card, selected && styles.cardSelected]}
                                    activeOpacity={0.85}
                                    onPress={() => setSelectedGoal(index)}
                                >
                                    <View style={styles.cardTop}>
                                        <View style={styles.iconWrap}><TargetIcon color={colors.accent} size={16} /></View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.cardTitle}>{text}</Text>
                                            <Text style={styles.cardSub}>{insight.target_months} {insight.target_months === 1 ? 'month' : 'months'} · {currencySymbol}{monthly.toLocaleString()}/mo</Text>
                                        </View>
                                        <View style={[styles.check, selected && styles.checkOn]}>
                                            {selected && <Text style={styles.checkTick}>✓</Text>}
                                        </View>
                                    </View>
                                    <Text style={styles.cardAmount}>{currencySymbol}{insight.amount.toLocaleString()}</Text>
                                    <Text style={styles.cardDesc}>{insight.description}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        {insights.length === 0 && (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>No suggestions right now. You can add a goal manually next.</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Set this goal"
                    onPress={handleComplete}
                    loading={isSaving}
                    disabled={selectedGoal === null}
                />
            </View>
        </SafeAreaView>
    );
};

const makeStyles = (c: Palette, t: ReturnType<typeof useTheme>['typography']) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: c.canvas },
        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6,
        },
        back: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
        backArrow: { color: c.ink1, fontSize: 18, marginTop: -2 },
        stepCap: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontWeight: t.weightSemibold },
        scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
        title: { color: c.ink1, fontSize: 22, fontWeight: t.weightBold, letterSpacing: -0.4 },
        helper: { color: c.ink2, fontSize: 13, marginTop: 6, lineHeight: 18, marginBottom: 16 },

        loadingWrap: { alignItems: 'center', paddingTop: 40, gap: 12 },
        loadingText: { color: c.ink3, fontSize: 13 },

        list: { gap: 10 },
        card: {
            backgroundColor: c.surface,
            borderRadius: 16,
            borderWidth: 1, borderColor: c.border,
            padding: 16,
        },
        cardSelected: { borderColor: c.accent, backgroundColor: c.accentSoft },
        cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        iconWrap: {
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center',
        },
        cardTitle: { color: c.ink1, fontSize: 14, fontWeight: t.weightSemibold },
        cardSub: { color: c.ink3, fontSize: 12, marginTop: 2 },
        check: {
            width: 22, height: 22, borderRadius: 11,
            borderWidth: 1.5, borderColor: c.border,
            alignItems: 'center', justifyContent: 'center',
        },
        checkOn: { borderColor: c.accent, backgroundColor: c.accent },
        checkTick: { color: c.accentInk, fontSize: 12, fontWeight: '700' },

        cardAmount: { color: c.ink1, fontSize: 22, fontWeight: t.weightBold, letterSpacing: -0.4, marginTop: 12, fontVariant: ['tabular-nums'] },
        cardDesc: { color: c.ink2, fontSize: 13, lineHeight: 18, marginTop: 6 },

        emptyCard: {
            backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border,
            padding: 16, alignItems: 'center',
        },
        emptyText: { color: c.ink3, fontSize: 13, textAlign: 'center' },

        footer: { paddingHorizontal: 20, paddingBottom: 20 },
    });
