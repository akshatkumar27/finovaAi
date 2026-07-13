import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import {
    Card,
    StatCard,
    AccountRow,
    AIInsightCard,
} from '../../components';
import { colors, typography, spacing } from '../../constants';
import { useCurrency } from '../../context/CurrencyContext';

export const VaultScreen: React.FC = () => {
    const [viewMode, setViewMode] = useState<'consolidated' | 'manual'>('consolidated');
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
                        <Text style={styles.headerTitle}>Vault</Text>
                        <Text style={styles.headerSubtitle}>
                            {viewMode === 'consolidated' ? 'CONSOLIDATED VIEW' : 'MANUAL TRACKING HUB'}
                        </Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => setViewMode(viewMode === 'consolidated' ? 'manual' : 'consolidated')}
                    >
                        <Text style={styles.toggleIcon}>⟳</Text>
                    </TouchableOpacity>
                    {viewMode === 'manual' && (
                        <TouchableOpacity style={styles.iconButton}>
                            <Text style={styles.iconText}>+</Text>
                        </TouchableOpacity>
                    )}
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>👤</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Total Balance */}
                <View style={styles.balanceSection}>
                    <Text style={styles.balanceLabel}>TOTAL LIQUID BALANCE</Text>
                    <View style={styles.balanceRow}>
                        <Text style={styles.rupeeSymbol}>{currencySymbol}</Text>
                        <Text style={styles.balanceValue}>12,45,600</Text>
                        <Text style={styles.balanceDecimal}>.{viewMode === 'consolidated' ? '42' : '00'}</Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    {viewMode === 'consolidated' ? (
                        <>
                            <StatCard label="AVAILABLE TO INVEST" value={`${currencySymbol}4.2L`} />
                            <View style={styles.statGap} />
                            <StatCard label="MONTHLY YIELD" value={`${currencySymbol}8,420`} valueColor="#f59e0b" />
                        </>
                    ) : (
                        <>
                            <StatCard label="MANUAL INPUT BASE" value={`${currencySymbol}12.4L`} />
                            <View style={styles.statGap} />
                            <View style={styles.lastUpdateBadge}>
                                <Text style={styles.lastUpdateLabel}>LAST UPDATE</Text>
                                <Text style={styles.lastUpdateValue}>Today</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Accounts Section */}
                <View style={styles.accountsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {viewMode === 'consolidated' ? 'Connected Accounts' : 'Manual Accounts'}
                        </Text>
                        <Text style={styles.accountCount}>
                            {viewMode === 'consolidated' ? '4 Active' : '3 Accounts'}
                        </Text>
                    </View>

                    <Card>
                        <AccountRow
                            icon="🏦"
                            name={viewMode === 'consolidated' ? 'HDFC Bank' : 'Savings Account'}
                            subtitle={viewMode === 'consolidated' ? '•••• 5829' : 'UPDATED 2 DAYS AGO'}
                            amount={`${currencySymbol}8,24,500`}
                            badge={viewMode === 'consolidated' ? 'GPAY LINKED' : 'UPDATE'}
                            badgeColor={viewMode === 'consolidated' ? '#22c55e' : '#f59e0b'}
                        />

                        <AccountRow
                            icon="💰"
                            name={viewMode === 'consolidated' ? 'ICICI Savings' : 'Cash in Hand'}
                            subtitle={viewMode === 'consolidated' ? '•••• 0042' : 'UPDATED 12 DAYS AGO'}
                            amount={viewMode === 'consolidated' ? `${currencySymbol}3,12,000` : `${currencySymbol}12,000`}
                            badge={viewMode === 'consolidated' ? 'LOW INTEREST' : 'UPDATE'}
                            badgeColor={viewMode === 'consolidated' ? '#ef4444' : '#f59e0b'}
                        />

                        <AccountRow
                            icon="📱"
                            name={viewMode === 'consolidated' ? 'Paytm Wallet' : 'Digital Wallet'}
                            subtitle={viewMode === 'consolidated' ? 'Mobile Wallet' : 'UPDATED TODAY'}
                            amount={`${currencySymbol}9,100`}
                            badge={viewMode === 'consolidated' ? 'GPAY LINKED' : 'UPDATE'}
                            badgeColor={viewMode === 'consolidated' ? '#22c55e' : '#f59e0b'}
                        />
                    </Card>
                </View>

                {/* Monthly Spends */}
                <View style={styles.spendsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Monthly Spends</Text>
                        <Text style={styles.spendsAmount}>{currencySymbol}42,800</Text>
                    </View>
                    <Text style={styles.spendsSubtitle}>
                        {viewMode === 'consolidated' ? 'Smart Categorization' : 'Based on manual entries'}
                    </Text>

                    <Card style={styles.spendsCard}>
                        <View style={styles.chartRow}>
                            <View style={styles.chartPlaceholder}>
                                <View style={styles.chartCircle}>
                                    <Text style={styles.chartIcon}>📊</Text>
                                </View>
                            </View>
                            <View style={styles.chartLegend}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                                    <Text style={styles.legendLabel}>Shopping</Text>
                                    <Text style={styles.legendValue}>35%</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                                    <Text style={styles.legendLabel}>Bills</Text>
                                    <Text style={styles.legendValue}>30%</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                                    <Text style={styles.legendLabel}>Food</Text>
                                    <Text style={styles.legendValue}>35%</Text>
                                </View>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* AI Insight */}
                <AIInsightCard
                    type="insight"
                    title="AI PROACTIVE INSIGHT"
                    description={
                        viewMode === 'consolidated'
                            ? "Your 'Shopping' is 15% higher than usual. Switch to UPI at select stores for 5% cashback."
                            : "Your 'Cash in Hand' hasn't been updated for a while. Consider updating for accurate tracking."
                    }
                />

                <View style={{ height: spacing.xxl }} />
            </ScrollView>
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
    toggleButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    toggleIcon: {
        color: colors.textPrimary,
        fontSize: 16,
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
        color: colors.textPrimary,
        fontSize: 20,
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
    balanceSection: {
        marginBottom: spacing.lg,
    },
    balanceLabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    rupeeSymbol: {
        color: colors.textPrimary,
        fontSize: typography.h1,
        fontWeight: typography.bold,
        marginRight: 4,
    },
    balanceValue: {
        color: colors.textPrimary,
        fontSize: 36,
        fontWeight: typography.bold,
    },
    balanceDecimal: {
        color: colors.textMuted,
        fontSize: typography.h3,
        fontWeight: typography.medium,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
    },
    statGap: {
        width: spacing.sm,
    },
    lastUpdateBadge: {
        flex: 1,
        backgroundColor: '#22c55e',
        borderRadius: 8,
        padding: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lastUpdateLabel: {
        color: colors.textPrimary,
        fontSize: 10,
        opacity: 0.8,
    },
    lastUpdateValue: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
    },
    accountsSection: {
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
    },
    accountCount: {
        color: colors.textMuted,
        fontSize: typography.caption,
    },
    spendsSection: {
        marginBottom: spacing.lg,
    },
    spendsAmount: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
    },
    spendsSubtitle: {
        color: colors.textMuted,
        fontSize: typography.caption,
        marginBottom: spacing.sm,
    },
    spendsCard: {
        padding: spacing.md,
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chartPlaceholder: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 12,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartIcon: {
        fontSize: 24,
    },
    chartLegend: {
        flex: 1,
        marginLeft: spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.sm,
    },
    legendLabel: {
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
        flex: 1,
    },
    legendValue: {
        color: colors.textPrimary,
        fontSize: typography.bodySmall,
        fontWeight: typography.medium,
    },
});
