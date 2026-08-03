import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Card, AssetRow, AIInsightCard } from '../../components';
import { colors, typography, spacing } from '../../constants';
import { useCurrency } from '../../context/CurrencyContext';

export const InvestHubScreen: React.FC = () => {
    const { currencySymbol } = useCurrency();
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoIcon}>
                        <Text style={styles.logoText}>◀▶</Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Invest Hub</Text>
                        <Text style={styles.headerSubtitle}>SMART PORTFOLIO</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Text style={styles.iconText}>🔍</Text>
                    </TouchableOpacity>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>👤</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Portfolio Value */}
                <View style={styles.portfolioSection}>
                    <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
                    <View style={styles.portfolioRow}>
                        <Text style={styles.rupeeSymbol}>{currencySymbol}</Text>
                        <Text style={styles.portfolioValue}>24,85,420</Text>
                        <View style={styles.changePositiveBadge}>
                            <Text style={styles.changePositiveText}>+1.2%</Text>
                        </View>
                    </View>
                    <View style={styles.dayChangeRow}>
                        <Text style={styles.dayChangeLabel}>24h Change:</Text>
                        <Text style={styles.dayChangeValue}>+{currencySymbol}28,620</Text>
                        <TouchableOpacity>
                            <Text style={styles.historyLink}>HISTORY</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* AI Portfolio Optimizer */}
                <Card style={styles.optimizerCard}>
                    <View style={styles.optimizerHeader}>
                        <Text style={styles.optimizerIcon}>✨</Text>
                        <Text style={styles.optimizerTitle}>AI PORTFOLIO OPTIMIZER</Text>
                    </View>
                    <Text style={styles.optimizerText}>
                        Move {currencySymbol}10,000 from Savings to <Text style={styles.highlightText}>Index Fund</Text> for better long-term growth.
                    </Text>
                    <TouchableOpacity style={styles.rebalanceButton}>
                        <Text style={styles.rebalanceButtonText}>Apply Rebalance</Text>
                    </TouchableOpacity>
                </Card>

                {/* Asset Allocation */}
                <View style={styles.assetSection}>
                    <Text style={styles.sectionTitle}>Asset Allocation</Text>

                    <AssetRow
                        icon="📈"
                        name="Mutual Funds"
                        subtitle="10 Active SIPs"
                        value={`${currencySymbol}14,20,000`}
                        change="+18.4%"
                        isPositive={true}
                    />

                    <AssetRow
                        icon="🪙"
                        name="Digital Gold"
                        subtitle="45.2g"
                        value={`${currencySymbol}3,15,420`}
                        change="+6.2%"
                        isPositive={true}
                    />

                    <AssetRow
                        icon="🏦"
                        name="Fixed Deposits"
                        subtitle="3 FDs Active"
                        value={`${currencySymbol}7,50,000`}
                        change="-7.1%"
                        isPositive={false}
                    />
                </View>
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    logoText: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: typography.bold,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
    },
    headerSubtitle: {
        color: colors.textMuted,
        fontSize: 10,
        letterSpacing: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    iconText: {
        fontSize: 16,
    },
    avatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    portfolioSection: {
        marginBottom: spacing.lg,
    },
    portfolioLabel: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        letterSpacing: 0.3,
        marginBottom: spacing.xs,
    },
    portfolioRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rupeeSymbol: {
        color: colors.textPrimary,
        fontSize: typography.h1,
        fontWeight: typography.bold,
        marginRight: 4,
        fontVariant: ['tabular-nums'],
    },
    portfolioValue: {
        color: colors.textPrimary,
        fontSize: typography.display,
        fontWeight: typography.bold,
        fontVariant: ['tabular-nums'],
    },
    changePositiveBadge: {
        backgroundColor: colors.gainDim,
        borderWidth: 1,
        borderColor: 'rgba(0,200,150,0.25)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: spacing.sm,
    },
    changePositiveText: {
        color: colors.gainText,
        fontSize: typography.caption,
        fontWeight: typography.semibold,
        fontVariant: ['tabular-nums'],
    },
    dayChangeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    dayChangeLabel: {
        color: colors.textSecondary,
        fontSize: typography.caption,
    },
    dayChangeValue: {
        color: colors.gainText,
        fontSize: typography.caption,
        fontWeight: typography.medium,
        marginLeft: spacing.xs,
        flex: 1,
        fontVariant: ['tabular-nums'],
    },
    historyLink: {
        color: colors.primary,
        fontSize: typography.caption,
        fontWeight: typography.semibold,
    },
    optimizerCard: {
        backgroundColor: colors.primaryDim,
        borderColor: 'rgba(61,142,248,0.25)',
        marginBottom: spacing.lg,
    },
    optimizerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    optimizerIcon: {
        fontSize: 16,
        marginRight: spacing.xs,
    },
    optimizerTitle: {
        color: colors.gainText,
        fontSize: typography.caption,
        fontWeight: typography.semibold,
        letterSpacing: 0.5,
    },
    optimizerText: {
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    highlightText: {
        color: colors.primary,
        fontWeight: typography.medium,
    },
    rebalanceButton: {
        backgroundColor: colors.warningDim,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.25)',
        borderRadius: 14,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        minHeight: 44,
        justifyContent: 'center',
    },
    rebalanceButtonText: {
        color: colors.warningText,
        fontSize: typography.bodySmall,
        fontWeight: typography.semibold,
    },
    assetSection: {
        marginBottom: spacing.xxl,
    },
    sectionTitle: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
        marginBottom: spacing.md,
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
    },
    fabText: {
        color: colors.textPrimary,
        fontSize: 28,
        fontWeight: '300',
    },
});
