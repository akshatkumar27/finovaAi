import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../constants';
import { useCurrency } from '../context/CurrencyContext';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, gradient = false }) => {
    return (
        <View style={[styles.card, gradient && styles.gradientCard, style]}>
            {children}
        </View>
    );
};

interface ProgressBarProps {
    progress: number; // 0-100
    color?: string;
    backgroundColor?: string;
    height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    color = colors.primary,
    backgroundColor = colors.border,
    height = 8,
}) => {
    return (
        <View style={[styles.progressContainer, { height, backgroundColor }]}>
            <View
                style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color },
                ]}
            />
        </View>
    );
};

interface StatCardProps {
    label: string;
    value: string;
    valueColor?: string;
    small?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    valueColor = colors.textPrimary,
    small = false,
}) => {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, { color: valueColor, fontSize: small ? 14 : 16 }]}>
                {value}
            </Text>
        </View>
    );
};

interface AccountRowProps {
    icon: string;
    name: string;
    subtitle?: string;
    amount: string;
    badge?: string;
    badgeColor?: string;
}

export const AccountRow: React.FC<AccountRowProps> = ({
    icon,
    name,
    subtitle,
    amount,
    badge,
    badgeColor = '#22c55e',
}) => {
    return (
        <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
                <Text style={styles.accountIconText}>{icon}</Text>
            </View>
            <View style={styles.accountInfo}>
                <View style={styles.accountNameRow}>
                    <Text style={styles.accountName}>{name}</Text>
                    {badge && (
                        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                            <Text style={styles.badgeText}>{badge}</Text>
                        </View>
                    )}
                </View>
                {subtitle && <Text style={styles.accountSubtitle}>{subtitle}</Text>}
            </View>
            <Text style={styles.accountAmount}>{amount}</Text>
        </View>
    );
};

interface GoalCardProps {
    icon: string;
    title: string;
    progress: number;
    subtitle: string;
    color?: string;
}

export const GoalCard: React.FC<GoalCardProps> = ({
    icon,
    title,
    progress,
    subtitle,
    color = colors.primary,
}) => {
    return (
        <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
                <View style={[styles.goalIconCircle, { borderColor: color }]}>
                    <Text style={[styles.goalIconEmoji, { color: color }]}>{icon}</Text>
                </View>
                <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle}>{title}</Text>
                    <Text style={styles.goalSubtitle}>{subtitle}</Text>
                </View>
                <Text style={styles.goalProgressPercent}>{progress}%</Text>
            </View>
            <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, { width: `${progress}%` }]} />
            </View>
        </View>
    );
};

interface GoalCardWithSuggestionProps {
    icon?: string;
    title: string;
    progress: number;
    subtitle?: string;
    color?: string;
    suggestionTitle?: string;
    suggestionDescription?: string;
    suggestionHighlight?: string;
    achieveInMonths?: number;
    targetAmount?: number;
    savedAmount?: number;
    onEditPress?: () => void;
    onAskAiPress?: () => void;
    onCardPress?: () => void;
}

export const GoalCardWithSuggestion: React.FC<GoalCardWithSuggestionProps> = ({
    title,
    progress,
    color = '#22c55e',
    suggestionTitle,
    suggestionDescription,
    achieveInMonths,
    targetAmount,
    savedAmount,
    onEditPress,
    onAskAiPress,
    onCardPress,
}) => {
    const { currencySymbol } = useCurrency();
    const formatCurrency = (amount: number) => {
        if (amount >= 1000000000) {
            return currencySymbol + (amount / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
        }
        if (amount >= 1000000) {
            return currencySymbol + (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (amount >= 1000) {
            return currencySymbol + (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return currencySymbol + amount.toString();
    };

    return (
        <TouchableOpacity
            style={styles.combinedCard}
            onPress={onCardPress}
            activeOpacity={onCardPress ? 0.7 : 1}
        >
            {/* Header Section with Title and Edit Button */}
            <View style={styles.goalHeaderRow}>
                <Text style={styles.goalTitleLarge}>{title}</Text>
                <TouchableOpacity style={styles.editButton} onPress={(e) => {
                    e.stopPropagation?.();
                    onEditPress?.();
                }}>
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
            </View>

            {/* Timeline and Amount */}
            <View style={{ marginBottom: spacing.sm }}>
                {targetAmount !== undefined && (
                    <Text style={styles.goalAmountText}>
                        {savedAmount !== undefined ? `${formatCurrency(savedAmount)} / ` : ''}
                        {formatCurrency(targetAmount)}
                    </Text>
                )}
                {achieveInMonths !== undefined && (
                    <Text style={styles.achieveInText}>Achieve in {achieveInMonths} {achieveInMonths === 1 ? 'month' : 'months'}</Text>
                )}
            </View>

            {/* Progress Bar with Percentage */}
            <View style={styles.progressRow}>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.goalProgressBar, { flex: 1 }]}>
                        <View style={[styles.goalProgressFill, { width: `${progress}%`, backgroundColor: color }]} />
                    </View>
                </View>
                <Text style={styles.goalProgressPercentNew}>{progress}%</Text>
            </View>

            {/* AI Suggestion Section */}
            {/* <View style={styles.aiSuggestionSection}>
                <Text style={styles.aiSuggestionLabel}>{suggestionTitle || 'Ai suggestions'}</Text>
                <Text style={styles.aiSuggestionText}>
                    {suggestionDescription || 'No suggestions available at the moment.'}
                </Text>
            </View> */}

            {/* Ask AI Button */}
            <TouchableOpacity style={styles.askAiButton} onPress={(e) => {
                e.stopPropagation?.();
                onAskAiPress?.();
            }}>
                <Text style={styles.askAiButtonText}>Ask AI about your goal</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

interface AIInsightCardProps {
    type: 'suggestion' | 'strategy' | 'insight';
    title: string;
    description: string;
    highlight?: string;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
    type,
    title,
    description,
    highlight,
}) => {
    const colors_map = {
        suggestion: '#f59e0b',
        strategy: '#3b82f6',
        insight: '#22c55e',
    };
    const accentColor = colors_map[type];

    return (
        <View style={styles.aiSuggestionCard}>
            <View style={[styles.aiIconContainer, { backgroundColor: accentColor + '20' }]}>
                <Text style={styles.aiIcon}>⚡</Text>
            </View>
            <View style={styles.aiContent}>
                <Text style={[styles.aiSuggestionTitle, { color: accentColor }]}>{title}</Text>
                <Text style={styles.aiSuggestionDescription}>
                    {description}
                    {highlight && <Text style={styles.aiHighlight}> {highlight}</Text>}.
                </Text>
            </View>
        </View>
    );
};

interface AssetRowProps {
    icon: string;
    name: string;
    subtitle: string;
    value: string;
    change: string;
    isPositive: boolean;
}

export const AssetRow: React.FC<AssetRowProps> = ({
    icon,
    name,
    subtitle,
    value,
    change,
    isPositive,
}) => {
    return (
        <View style={styles.assetRow}>
            <View style={styles.assetIcon}>
                <Text style={styles.assetIconText}>{icon}</Text>
            </View>
            <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{name}</Text>
                <Text style={styles.assetSubtitle}>{subtitle}</Text>
            </View>
            <View style={styles.assetValues}>
                <Text style={styles.assetValue}>{value}</Text>
                <Text style={[styles.assetChange, { color: isPositive ? '#22c55e' : '#ef4444' }]}>
                    {change}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: spacing.md,
    },
    gradientCard: {
        backgroundColor: '#1a2744',
    },
    progressContainer: {
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    statCard: {
        backgroundColor: colors.inputBackground,
        borderRadius: 8,
        padding: spacing.sm,
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        color: colors.textMuted,
        fontSize: 10,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statValue: {
        color: colors.textPrimary,
        fontWeight: typography.semibold,
    },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    accountIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    accountIconText: {
        fontSize: 18,
    },
    accountInfo: {
        flex: 1,
    },
    accountNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    accountName: {
        color: colors.textPrimary,
        fontSize: typography.bodySmall,
        fontWeight: typography.medium,
    },
    accountSubtitle: {
        color: colors.textMuted,
        fontSize: typography.caption,
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    badgeText: {
        color: colors.textPrimary,
        fontSize: 8,
        fontWeight: typography.bold,
    },
    accountAmount: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
    },
    goalCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    goalIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    goalIconText: {
        fontSize: 16,
    },
    goalInfo: {
        flex: 1,
    },
    goalTitle: {
        color: colors.textPrimary,
        fontSize: typography.bodySmall,
        fontWeight: typography.medium,
    },
    goalSubtitle: {
        color: colors.textMuted,
        fontSize: typography.caption,
    },
    goalProgress: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
    },
    aiCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 8,
        padding: spacing.sm,
        borderLeftWidth: 3,
        marginBottom: spacing.sm,
    },
    aiTitle: {
        fontSize: typography.caption,
        fontWeight: typography.semibold,
        marginBottom: 4,
    },
    aiDescription: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        lineHeight: 18,
    },
    assetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    assetIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    assetIconText: {
        fontSize: 20,
    },
    assetInfo: {
        flex: 1,
    },
    assetName: {
        color: colors.textPrimary,
        fontSize: typography.bodySmall,
        fontWeight: typography.medium,
    },
    assetSubtitle: {
        color: colors.textMuted,
        fontSize: typography.caption,
        marginTop: 2,
    },
    assetValues: {
        alignItems: 'flex-end',
    },
    assetValue: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
    },
    assetChange: {
        fontSize: typography.caption,
        marginTop: 2,
    },
    // Combined card styles
    combinedCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    goalSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    goalIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    goalIconEmoji: {
        fontSize: 22,
    },
    goalTitleLarge: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
    },
    goalProgressPercent: {
        color: '#22c55e',
        fontSize: typography.h3,
        fontWeight: typography.bold,
    },
    goalProgressBar: {
        height: 6,
        backgroundColor: colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    goalProgressFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: '#22c55e',
    },
    suggestionSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: spacing.md,
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        padding: spacing.md,
    },
    suggestionIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#f59e0b20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    suggestionIcon: {
        fontSize: 14,
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionTitle: {
        color: '#f59e0b',
        fontSize: typography.caption,
        fontWeight: typography.bold,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    suggestionDescription: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        lineHeight: 18,
    },
    suggestionHighlight: {
        color: '#22c55e',
        fontWeight: typography.semibold,
    },
    // Standalone AI card styles
    aiSuggestionCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    aiIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    aiIcon: {
        fontSize: 16,
    },
    aiContent: {
        flex: 1,
    },
    aiSuggestionTitle: {
        fontSize: typography.caption,
        fontWeight: typography.bold,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    aiSuggestionDescription: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        lineHeight: 18,
    },
    aiHighlight: {
        color: '#22c55e',
        fontWeight: typography.semibold,
    },
    // New Goal Card styles
    goalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    editButton: {
        backgroundColor: colors.inputBackground,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 8,
    },
    editButtonText: {
        color: colors.textPrimary,
        fontSize: typography.caption,
        fontWeight: typography.medium,
    },
    achieveInText: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        marginBottom: 2,
    },
    goalAmountText: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.bold,
        marginBottom: 2,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    progressBarContainer: {
        flex: 1,
        marginRight: spacing.sm,
    },
    goalProgressPercentNew: {
        color: colors.textPrimary,
        fontSize: typography.bodySmall,
        fontWeight: typography.semibold,
        minWidth: 40,
        textAlign: 'right',
    },
    aiSuggestionSection: {
        marginBottom: spacing.md,
    },
    aiSuggestionLabel: {
        color: colors.textPrimary,
        fontSize: typography.bodySmall,
        fontWeight: typography.semibold,
        marginBottom: spacing.xs,
    },
    aiSuggestionText: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        lineHeight: 18,
    },
    askAiButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
    },
    askAiButtonText: {
        color: colors.textPrimary,
        fontSize: typography.bodySmall,
        fontWeight: typography.medium,
    },
});
