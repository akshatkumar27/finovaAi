import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { MascotLoader } from '../../components';
import { MainStackParamList } from '../../navigation/MainTabNavigator';
import Toast from 'react-native-toast-message';
import { api } from '../../services';
import { formatCompactNumber } from '../../utils/formatNumber';
import { useCurrency } from '../../context/CurrencyContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setFinancialData } from '../../store/slices/financialDataSlice';
import { useTheme } from '../../theme';
import { Palette } from '../../theme/palette';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface Goal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    achieve_in_months: number;
    monthly_contribution: number;
    contribution_day: number;
    contribution_start_date?: string;
    created_at: string;
    updated_at: string;
    saved_amount: number;
    progress: number;
}

interface GoalBudget {
    surplus: number;
    totalGoalContributions: number;
    availableForNewGoals: number;
}

interface GoalsResponse {
    success: boolean;
    message: string;
    goals: Goal[];
    goalBudget: GoalBudget;
    averageAchievement: number;
}

interface Insight {
    title: string;
    description: string;
    amount: number;
    target_months: number;
}

const parseInsightTitle = (title: string) => {
    const emojiMatch = title.match(/^(\p{Emoji}+)\s*/u);
    if (emojiMatch) return { icon: emojiMatch[1], text: title.replace(emojiMatch[0], '').trim() };
    return { icon: '', text: title };
};

// ── Line icons ───────────────────────────────────────────────────────────────
const TargetIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 14 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
        <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.8} />
        <Circle cx={12} cy={12} r={1.5} fill={color} />
    </Svg>
);

const BellIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M13 21a2 2 0 01-2 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const CoachIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 14 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ── Circular ring (pulse score) ──────────────────────────────────────────────
const Ring: React.FC<{
    progress: number;
    size?: number;
    strokeWidth?: number;
    progressColor: string;
    trackColor: string;
    label?: string;
}> = ({ progress, size = 84, strokeWidth = 8, progressColor, trackColor, label }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.min(100, Math.max(0, progress));
    const dashoffset = circumference - (clamped / 100) * circumference;
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
                <Circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={progressColor} strokeWidth={strokeWidth} fill="none"
                    strokeDasharray={circumference} strokeDashoffset={dashoffset}
                    strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Text style={{ color: progressColor, fontSize: size >= 100 ? 28 : 24, fontWeight: '700', letterSpacing: -0.5 }}>
                    {Math.round(progress)}
                </Text>
                {label && <Text style={{ color: progressColor, fontSize: 9, letterSpacing: 1.4, marginTop: -2, opacity: 0.9, fontWeight: '600' }}>{label}</Text>}
            </View>
        </View>
    );
};

// ── Screen ───────────────────────────────────────────────────────────────────
export const GoalPulseScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useAppDispatch();
    const financialData = useAppSelector(state => state.financialData);
    const { colors, typography } = useTheme();
    const { currencySymbol } = useCurrency();

    const [goals, setGoals] = useState<Goal[]>([]);
    const [averageAchievement, setAverageAchievement] = useState(0);
    const [goalBudget, setGoalBudget] = useState<GoalBudget | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [onboardingInvestment, setOnboardingInvestment] = useState(0);

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    useEffect(() => {
        const fetchData = async () => {
            const profileData = await checkAndFetchFinancialProfile();
            const { goals: currentGoals, goalBudget: currentBudget } = await fetchGoals();
            await fetchInsights(profileData, currentGoals, currentBudget);
        };
        fetchData();
        const subscription = DeviceEventEmitter.addListener('refreshGoals', () => { fetchData(); });
        return () => subscription.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkAndFetchFinancialProfile = async () => {
        const hasData = financialData.monthlyIncome > 0 || financialData.monthlyExpenses > 0 || financialData.monthlyEmi > 0 || financialData.monthlyInvestment > 0 || financialData.emiOutstanding > 0;
        if (!hasData) {
            try {
                const response = await api.get('/api/user/financial-profile');
                if (response.data?.success) {
                    const profile = response.data.profile;
                    const newProfileData = {
                        monthlyIncome: profile.monthly_income || 0,
                        monthlyExpenses: profile.monthly_expenses || 0,
                        monthlyEmi: profile.monthly_emi || 0,
                        emiOutstanding: profile.emi_outstanding || 0,
                        monthlyInvestment: profile.monthly_savings || 0,
                    };
                    dispatch(setFinancialData({ ...newProfileData, isFinancialProfilePresent: true }));
                    return newProfileData;
                }
            } catch (error) { console.error('Failed to fetch financial profile:', error); }
        }
        return financialData;
    };

    const fetchGoals = async (showLoader = true) => {
        try {
            if (showLoader) setIsLoading(true);
            const response = await api.get<GoalsResponse>('/api/goals');
            if (response.data.success) {
                setGoals(response.data.goals);
                setAverageAchievement(response.data.averageAchievement);
                setGoalBudget(response.data.goalBudget);
                return { goals: response.data.goals, goalBudget: response.data.goalBudget };
            }
            return { goals: [], goalBudget: null };
        } catch (error) {
            console.error('Failed to fetch goals:', error);
            return { goals: [], goalBudget: null };
        } finally {
            if (showLoader) setIsLoading(false);
        }
    };

    const fetchInsights = async (profileData: any, currentGoals: Goal[] = [], currentBudget: GoalBudget | null = null) => {
        try {
            setInsightsLoading(true);
            const availableForGoals = currentBudget ? currentBudget.availableForNewGoals : (onboardingInvestment || 0);
            setOnboardingInvestment(availableForGoals);

            const payload = {
                monthly_income: profileData.monthlyIncome || 0,
                monthly_expenses: profileData.monthlyExpenses || 0,
                monthly_emi: profileData.monthlyEmi || 0,
                emi_outstanding: profileData.emiOutstanding || 0,
                monthly_savings: profileData.monthlyInvestment || 0,
                available_budget: availableForGoals,
                goals: currentGoals.map(g => ({
                    name: g.name,
                    target_amount: typeof g.target_amount === 'string' ? parseFloat(g.target_amount) : g.target_amount,
                    monthly_contribution: typeof g.monthly_contribution === 'string' ? parseFloat(g.monthly_contribution) : g.monthly_contribution
                }))
            };
            const res = await api.post('/api/insights', payload);
            if (res.data.insights) setInsights(res.data.insights);
        } catch (error) { console.error('Insights fetch error:', error); }
        finally { setInsightsLoading(false); }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchGoals(false);
        setRefreshing(false);
    }, []);

    const availableBudget = goalBudget ? goalBudget.availableForNewGoals : 0;
    const totalSaved = goals.reduce((sum, g) => sum + (Number(g.saved_amount) || 0), 0);

    const scoreColor = averageAchievement >= 75
        ? colors.gain
        : averageAchievement >= 40
            ? colors.accent
            : colors.warn;

    const today = new Date();
    const dayLabel = today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.dateCap}>{dayLabel}</Text>
                    <Text style={styles.greeting}>Your goals.</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.7}>
                        <BellIcon color={colors.ink2} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                            <Circle cx={12} cy={8} r={4} stroke={colors.ink2} strokeWidth={1.8} />
                            <Path d="M4 21a8 8 0 0116 0" stroke={colors.ink2} strokeWidth={1.8} strokeLinecap="round" />
                        </Svg>
                    </TouchableOpacity>
                </View>
            </View>

            {isLoading || refreshing ? (
                <View style={styles.loaderWrap}>
                    <MascotLoader size={140} />
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
                >
                    {/* Pulse Score hero */}
                    {goals.length > 0 && (
                        <View style={styles.hero}>
                            <View style={styles.heroRow}>
                                <Ring
                                    progress={averageAchievement}
                                    size={96}
                                    strokeWidth={9}
                                    progressColor={scoreColor}
                                    trackColor={colors.surfaceAlt}
                                    label="PULSE"
                                />
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <Text style={styles.heroCap}>PROGRESS SCORE</Text>
                                    <Text style={styles.heroTitle}>
                                        {averageAchievement >= 75 ? 'Ahead of pace' :
                                            averageAchievement >= 50 ? 'On track' :
                                                averageAchievement >= 25 ? 'Getting started' : 'Fresh start'}
                                    </Text>
                                    <Text style={styles.heroSub}>Across {goals.length} {goals.length === 1 ? 'goal' : 'goals'}</Text>
                                </View>
                            </View>

                            <View style={styles.heroFooter}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.heroFooterCap}>TOTAL SAVED</Text>
                                    <Text style={styles.heroFooterAmount}>{currencySymbol}{formatCompactNumber(totalSaved)}</Text>
                                </View>
                                <View style={styles.heroDivider} />
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Text style={styles.heroFooterCap}>AVAILABLE</Text>
                                    <Text style={styles.heroFooterAmount}>{currencySymbol}{formatCompactNumber(availableBudget)}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* AI Suggestions */}
                    {availableBudget > 0 && (
                        <View style={{ marginTop: 8 }}>
                            <View style={styles.sectionHeadRow}>
                                <Text style={styles.sectionHead}>SUGGESTED FOR YOU</Text>
                                {goals.length === 0 && (
                                    <Text style={styles.pill}>{currencySymbol}{formatCompactNumber(availableBudget)} available</Text>
                                )}
                            </View>

                            {insightsLoading ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestScroll}>
                                    {[1, 2].map(k => (
                                        <View key={k} style={styles.suggestCard}>
                                            <ActivityIndicator size="small" color={colors.accent} />
                                        </View>
                                    ))}
                                </ScrollView>
                            ) : insights.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestScroll}>
                                    {insights.map((insight, idx) => {
                                        const { text } = parseInsightTitle(insight.title);
                                        return (
                                            <View key={idx} style={styles.suggestCard}>
                                                <View style={styles.suggestIconWrap}><TargetIcon color={colors.accent} size={16} /></View>
                                                <Text style={styles.suggestName} numberOfLines={2}>{text}</Text>
                                                <Text style={styles.suggestAmount}>{currencySymbol}{insight.amount.toLocaleString()}</Text>
                                                <Text style={styles.suggestMonths}>{insight.target_months} {insight.target_months === 1 ? 'month' : 'months'}</Text>
                                                <Text style={styles.suggestDesc} numberOfLines={2}>{insight.description}</Text>
                                                <TouchableOpacity
                                                    style={styles.suggestBtn}
                                                    activeOpacity={0.85}
                                                    onPress={() => navigation.navigate('AddGoal', {
                                                        availableForNewGoals: availableBudget,
                                                        suggestionName: text,
                                                        suggestionTarget: insight.amount,
                                                        suggestionMonths: insight.target_months,
                                                        suggestionDescription: insight.description,
                                                    })}>
                                                    <Text style={styles.suggestBtnText}>Add goal</Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            ) : null}
                        </View>
                    )}

                    {/* Goals list */}
                    {goals.length > 0 && (
                        <View>
                            <Text style={styles.sectionHead}>YOUR GOALS</Text>
                            {goals.map((goal) => {
                                const progressPct = Math.min(100, Math.max(0, Number(goal.progress) || 0));
                                const status = progressPct >= 75 ? 'Ahead' : progressPct >= 40 ? 'On track' : 'Starting';
                                const statusColor = progressPct >= 75 ? colors.gain : progressPct >= 40 ? colors.accent : colors.warn;
                                const targetNum = typeof goal.target_amount === 'string' ? parseFloat(goal.target_amount) : goal.target_amount;
                                return (
                                    <TouchableOpacity
                                        key={goal.id}
                                        style={styles.goalCard}
                                        activeOpacity={0.85}
                                        onPress={() => navigation.navigate('Contributions', {
                                            goalId: goal.id,
                                            goalName: goal.name,
                                            targetAmount: goal.target_amount,
                                            monthlyContribution: goal.monthly_contribution,
                                            achieveInMonths: goal.achieve_in_months,
                                            goalCreatedAt: goal.created_at,
                                            contributionDay: goal.contribution_start_date,
                                        })}
                                    >
                                        <View style={styles.goalTop}>
                                            <View style={styles.goalIconWrap}><TargetIcon color={colors.accent} size={14} /></View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.goalName}>{goal.name}</Text>
                                                <Text style={styles.goalSub}>
                                                    {currencySymbol}{formatCompactNumber(goal.saved_amount)} of {currencySymbol}{formatCompactNumber(targetNum)}
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={styles.goalPct}>{Math.round(progressPct)}%</Text>
                                                <Text style={[styles.goalStatus, { color: statusColor }]}>{status}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.progTrack}>
                                            <View style={[styles.progFill, { width: `${progressPct}%`, backgroundColor: statusColor }]} />
                                        </View>
                                        <View style={styles.goalActions}>
                                            <TouchableOpacity
                                                onPress={(e) => { e.stopPropagation(); navigation.navigate('EditGoal', {
                                                    goalId: goal.id,
                                                    name: goal.name,
                                                    target: goal.target_amount,
                                                    achieveIn: goal.achieve_in_months,
                                                    monthlyContribution: goal.monthly_contribution,
                                                    savedAmount: goal.saved_amount,
                                                    availableForNewGoals: goalBudget?.availableForNewGoals,
                                                    contributionDay: goal.contribution_start_date,
                                                }); }}
                                                activeOpacity={0.7}
                                                style={styles.goalAction}
                                            >
                                                <Text style={styles.goalActionText}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={(e) => { e.stopPropagation(); navigation.navigate('GoalChat', {
                                                    goalTitle: goal.name,
                                                    initialSuggestion: 'How can I achieve this goal faster?',
                                                }); }}
                                                activeOpacity={0.7}
                                                style={styles.goalActionCoach}
                                            >
                                                <CoachIcon color={colors.accent} size={13} />
                                                <Text style={[styles.goalActionText, { color: colors.accent, marginLeft: 6 }]}>Ask coach</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    {/* Empty state */}
                    {goals.length === 0 && (
                        <View style={styles.empty}>
                            <View style={styles.emptyIconWrap}><TargetIcon color={colors.accent} size={24} /></View>
                            <Text style={styles.emptyTitle}>Start your first goal.</Text>
                            <Text style={styles.emptyDesc}>Pick a suggestion above, or tap + to name your own. Consistency beats intensity.</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.85}
                onPress={() => {
                    if (availableBudget > 0) {
                        navigation.navigate('AddGoal', { availableForNewGoals: availableBudget });
                    } else {
                        Toast.show({
                            type: 'error',
                            text1: 'No budget available',
                            text2: 'No room in your budget to create a new goal.',
                        });
                    }
                }}
            >
                <Text style={styles.fabPlus}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const makeStyles = (c: Palette, t: ReturnType<typeof useTheme>['typography']) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: c.canvas },

        header: {
            flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6,
        },
        dateCap: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontWeight: t.weightSemibold },
        greeting: { color: c.ink1, fontSize: 22, fontWeight: t.weightBold, letterSpacing: -0.4, marginTop: 2 },
        notifBtn: {
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
            alignItems: 'center', justifyContent: 'center',
        },
        headerActions: { flexDirection: 'row', gap: 8 },
        iconBtn: {
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
            alignItems: 'center', justifyContent: 'center',
        },

        loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
        scroll: { paddingHorizontal: 20, paddingBottom: 120, gap: 14 },

        hero: {
            marginTop: 12,
            backgroundColor: c.surface,
            borderRadius: 20,
            borderWidth: 1, borderColor: c.border,
            padding: 18,
        },
        heroRow: { flexDirection: 'row', alignItems: 'center' },
        heroCap: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontWeight: t.weightSemibold },
        heroTitle: { color: c.ink1, fontSize: 18, fontWeight: t.weightBold, letterSpacing: -0.3, marginTop: 4 },
        heroSub: { color: c.ink3, fontSize: 12, marginTop: 2 },
        heroFooter: {
            flexDirection: 'row', alignItems: 'center',
            marginTop: 16, paddingTop: 14,
            borderTopWidth: 1, borderTopColor: c.border,
        },
        heroFooterCap: { color: c.ink3, fontSize: 10, letterSpacing: 1.2, fontWeight: t.weightSemibold },
        heroFooterAmount: { color: c.ink1, fontSize: 20, fontWeight: t.weightBold, letterSpacing: -0.4, marginTop: 2 },
        heroDivider: { width: 1, height: 32, backgroundColor: c.border, marginHorizontal: 16 },

        sectionHead: {
            color: c.ink3, fontSize: 11, letterSpacing: 1.4,
            fontWeight: t.weightSemibold,
            marginTop: 8, marginBottom: 8, paddingHorizontal: 2,
        },
        sectionHeadRow: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 8, marginBottom: 8,
        },
        pill: {
            color: c.gain, backgroundColor: c.gainSoft,
            fontSize: 11, fontWeight: t.weightSemibold,
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden',
        },

        suggestScroll: { paddingRight: 20, gap: 12 },
        suggestCard: {
            width: 200,
            backgroundColor: c.surface, borderRadius: 16,
            borderWidth: 1, borderColor: c.border,
            padding: 14,
        },
        suggestIconWrap: {
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: c.accentSoft,
            alignItems: 'center', justifyContent: 'center',
        },
        suggestName: { color: c.ink1, fontSize: 14, fontWeight: t.weightSemibold, marginTop: 10, lineHeight: 18 },
        suggestAmount: { color: c.ink1, fontSize: 18, fontWeight: t.weightBold, letterSpacing: -0.3, marginTop: 8 },
        suggestMonths: { color: c.ink3, fontSize: 11, marginTop: 2 },
        suggestDesc: { color: c.ink2, fontSize: 12, lineHeight: 16, marginTop: 8, marginBottom: 12 },
        suggestBtn: {
            backgroundColor: c.accentSoft,
            paddingVertical: 8, borderRadius: 10, alignItems: 'center',
        },
        suggestBtnText: { color: c.accent, fontSize: 12, fontWeight: t.weightSemibold },

        goalCard: {
            backgroundColor: c.surface, borderRadius: 16,
            borderWidth: 1, borderColor: c.border,
            padding: 14, marginBottom: 10,
        },
        goalTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        goalIconWrap: {
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: c.accentSoft,
            alignItems: 'center', justifyContent: 'center',
        },
        goalName: { color: c.ink1, fontSize: 14, fontWeight: t.weightSemibold },
        goalSub: { color: c.ink3, fontSize: 12, marginTop: 2 },
        goalPct: { color: c.ink1, fontSize: 15, fontWeight: t.weightBold, letterSpacing: -0.3 },
        goalStatus: { fontSize: 10, fontWeight: t.weightSemibold, marginTop: 2, letterSpacing: 0.3 },

        progTrack: { height: 6, borderRadius: 999, backgroundColor: c.surfaceAlt, marginTop: 12, overflow: 'hidden' },
        progFill: { height: '100%', borderRadius: 999 },

        goalActions: { flexDirection: 'row', marginTop: 12, gap: 20, alignItems: 'center' },
        goalAction: { paddingVertical: 2 },
        goalActionCoach: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
        goalActionText: { color: c.ink2, fontSize: 12, fontWeight: t.weightMedium },

        empty: {
            alignItems: 'center', paddingHorizontal: 24, paddingVertical: 48,
        },
        emptyIconWrap: {
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
        },
        emptyTitle: { color: c.ink1, fontSize: 20, fontWeight: t.weightBold, letterSpacing: -0.3, textAlign: 'center' },
        emptyDesc: { color: c.ink2, fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 6 },

        fab: {
            position: 'absolute', right: 20, bottom: 24,
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: c.accent,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: c.shadow, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
            elevation: 8,
        },
        fabPlus: { color: c.accentInk, fontSize: 28, fontWeight: '300', lineHeight: 30 },
    });
