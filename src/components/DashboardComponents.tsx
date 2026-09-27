import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../theme';
import { Palette } from '../theme/palette';
import { useAppSelector } from '../store/hooks';

const makeStyles = (colors: Palette) =>
    StyleSheet.create({
        card: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: spacing.md,
        },
        gradientCard: {
            backgroundColor: colors.accentSoft,
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
            backgroundColor: colors.surfaceAlt,
            borderRadius: 8,
            padding: spacing.sm,
            alignItems: 'center',
            flex: 1,
        },
        statLabel: {
            color: colors.ink2,
            fontSize: 10,
            textTransform: 'uppercase',
            marginBottom: 4,
        },
        statValue: {
            color: colors.ink1,
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
            backgroundColor: colors.surfaceAlt,
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
            color: colors.ink1,
            fontSize: typography.bodySmall,
            fontWeight: typography.medium,
        },
        accountSubtitle: {
            color: colors.ink2,
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
            color: colors.accentInk,
            fontSize: 8,
            fontWeight: typography.bold,
        },
        accountAmount: {
            color: colors.ink1,
            fontSize: typography.body,
            fontWeight: typography.semibold,
        },
        goalCard: {
            backgroundColor: colors.surface,
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
            color: colors.ink1,
            fontSize: typography.bodySmall,
            fontWeight: typography.medium,
        },
        goalSubtitle: {
            color: colors.ink2,
            fontSize: typography.caption,
        },
        goalProgress: {
            color: colors.ink1,
            fontSize: typography.body,
            fontWeight: typography.semibold,
        },
        aiCard: {
            backgroundColor: colors.surface,
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
            color: colors.ink2,
            fontSize: typography.caption,
            lineHeight: 18,
        },
        assetRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: spacing.md,
            marginBottom: spacing.sm,
        },
        assetIcon: {
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: colors.surfaceAlt,
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
            color: colors.ink1,
            fontSize: typography.bodySmall,
            fontWeight: typography.medium,
        },
        assetSubtitle: {
            color: colors.ink2,
            fontSize: typography.caption,
            marginTop: 2,
        },
        assetValues: {
            alignItems: 'flex-end',
        },
        assetValue: {
            color: colors.ink1,
            fontSize: typography.body,
            fontWeight: typography.semibold,
        },
        assetChange: {
            fontSize: typography.caption,
            marginTop: 2,
        },
        combinedCard: {
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
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
            color: colors.ink1,
            fontSize: 17,
            fontWeight: typography.semibold,
            flex: 1,
            marginRight: spacing.sm,
        },
        goalProgressPercent: {
            color: colors.gain,
            fontSize: typography.h3,
            fontWeight: typography.bold,
        },
        goalProgressBar: {
            height: 8,
            backgroundColor: colors.border,
            borderRadius: 99,
            overflow: 'hidden',
        },
        goalProgressFill: {
            height: '100%',
            borderRadius: 99,
        },
        suggestionSection: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginTop: spacing.md,
            backgroundColor: colors.surfaceAlt,
            borderRadius: 12,
            padding: spacing.md,
        },
        suggestionIconContainer: {
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: colors.warnSoft,
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
            color: colors.warn,
            fontSize: typography.caption,
            fontWeight: typography.bold,
            letterSpacing: 0.5,
            marginBottom: 4,
        },
        suggestionDescription: {
            color: colors.ink2,
            fontSize: typography.caption,
            lineHeight: 18,
        },
        suggestionHighlight: {
            color: colors.gain,
            fontWeight: typography.semibold,
        },
        aiSuggestionCard: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: colors.surface,
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
            color: colors.ink2,
            fontSize: typography.caption,
            lineHeight: 18,
        },
        aiHighlight: {
            color: colors.gain,
            fontWeight: typography.semibold,
        },
        goalHeaderRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xs,
        },
        editButton: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 10,
        },
        editButtonText: {
            color: colors.ink2,
            fontSize: typography.caption,
            fontWeight: typography.medium,
        },
        achieveInText: {
            color: colors.ink3,
            fontSize: typography.caption,
            marginBottom: 2,
        },
        goalAmountText: {
            color: colors.ink1,
            fontSize: typography.body,
            fontWeight: typography.bold,
            marginBottom: 2,
            fontVariant: ['tabular-nums'],
        },
        goalAmountSaved: {
            color: colors.ink2,
            fontWeight: typography.medium,
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
            fontSize: typography.bodySmall,
            fontWeight: typography.semibold,
            minWidth: 40,
            textAlign: 'right',
            fontVariant: ['tabular-nums'],
        },
        aiSuggestionSection: {
            marginBottom: spacing.md,
        },
        aiSuggestionLabel: {
            color: colors.ink1,
            fontSize: typography.bodySmall,
            fontWeight: typography.semibold,
            marginBottom: spacing.xs,
        },
        aiSuggestionText: {
            color: colors.ink2,
            fontSize: typography.caption,
            lineHeight: 18,
        },
        askAiButton: {
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.accent,
            borderRadius: 12,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            alignItems: 'center',
        },
        askAiButtonText: {
            color: colors.accent,
            fontSize: typography.bodySmall,
            fontWeight: typography.semibold,
        },
    });

const useStyles = () => {
    const { colors } = useTheme();
    return useMemo(() => makeStyles(colors), [colors]);
};

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, gradient = false }) => {
    const styles = useStyles();
    return (
        <View style={[styles.card, gradient && styles.gradientCard, style]}>
            {children}
        </View>
    );
};

interface ProgressBarProps {
    progress: number;
    color?: string;
    backgroundColor?: string;
    height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    color,
    backgroundColor,
    height = 8,
}) => {
    const { colors } = useTheme();
    const styles = useStyles();
    return (
        <View style={[styles.progressContainer, { height, backgroundColor: backgroundColor ?? colors.border }]}>
            <View
                style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color ?? colors.accent },
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
    valueColor,
    small = false,
}) => {
    const { colors } = useTheme();
    const styles = useStyles();
    return (
        <View style={styles.statCard}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, { color: valueColor ?? colors.ink1, fontSize: small ? 14 : 16 }]}>
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
    badgeColor,
}) => {
    const { colors } = useTheme();
    const styles = useStyles();
    return (
        <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
                <Text style={styles.accountIconText}>{icon}</Text>
            </View>
            <View style={styles.accountInfo}>
                <View style={styles.accountNameRow}>
                    <Text style={styles.accountName}>{name}</Text>
                    {badge && (
                        <View style={[styles.badge, { backgroundColor: badgeColor ?? colors.gain }]}>
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
    color,
}) => {
    const { colors } = useTheme();
    const styles = useStyles();
    const resolvedColor = color ?? colors.accent;
    return (
        <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
                <View style={[styles.goalIconCircle, { borderColor: resolvedColor }]}>
                    <Text style={[styles.goalIconEmoji, { color: resolvedColor }]}>{icon}</Text>
                </View>
                <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle}>{title}</Text>
                    <Text style={styles.goalSubtitle}>{subtitle}</Text>
                </View>
                <Text style={styles.goalProgressPercent}>{progress}%</Text>
            </View>
            <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, { width: `${progress}%`, backgroundColor: resolvedColor }]} />
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
    achieveInMonths,
    targetAmount,
    savedAmount,
    onEditPress,
    onAskAiPress,
    onCardPress,
}) => {
    const { colors } = useTheme();
    const styles = useStyles();
    const currencySymbol = useAppSelector((state) => state.settings.appCurrency);
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

    const progressFillColor = progress >= 75
        ? colors.gain
        : progress >= 40
            ? colors.accent
            : colors.warn;

    return (
        <TouchableOpacity
            style={styles.combinedCard}
            onPress={onCardPress}
            activeOpacity={onCardPress ? 0.7 : 1}
        >
            <View style={styles.goalHeaderRow}>
                <Text style={styles.goalTitleLarge}>{title}</Text>
                <TouchableOpacity style={styles.editButton} onPress={(e) => {
                    e.stopPropagation?.();
                    onEditPress?.();
                }}>
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <View style={{ marginBottom: spacing.sm }}>
                {targetAmount !== undefined && (
                    <Text style={styles.goalAmountText}>
                        {savedAmount !== undefined
                            ? <Text style={styles.goalAmountSaved}>{formatCurrency(savedAmount)} </Text>
                            : null}
                        {savedAmount !== undefined ? '/ ' : ''}
                        {formatCurrency(targetAmount)}
                    </Text>
                )}
                {achieveInMonths !== undefined && (
                    <Text style={styles.achieveInText}>Achieve in {achieveInMonths} {achieveInMonths === 1 ? 'month' : 'months'}</Text>
                )}
            </View>

            <View style={styles.progressRow}>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.goalProgressBar, { flex: 1 }]}>
                        <View style={[styles.goalProgressFill, { width: `${progress}%`, backgroundColor: progressFillColor }]} />
                    </View>
                </View>
                <Text style={[styles.goalProgressPercentNew, { color: progressFillColor }]}>{progress}%</Text>
            </View>

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
    const { colors } = useTheme();
    const styles = useStyles();
    const colors_map = {
        suggestion: colors.warn,
        strategy: colors.accent,
        insight: colors.gain,
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
    const { colors } = useTheme();
    const styles = useStyles();
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
                <Text style={[styles.assetChange, { color: isPositive ? colors.gain : colors.loss }]}>
                    {change}
                </Text>
            </View>
        </View>
    );
};
