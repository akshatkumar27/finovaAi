import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';

import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../theme';
import { Palette } from '../../theme/palette';
import { Icon, IconName } from '../../components';



export const VaultScreen: React.FC = () => {
    const { currencySymbol } = useCurrency();
    const { colors, typography } = useTheme();
    const [mode, setMode] = useState<'linked' | 'manual'>('linked');
    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const total = mode === 'linked' ? 1245600 : 1245600;
    const monthlyYield = 8420;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.dateCap}>YOUR WEALTH</Text>
                    <Text style={styles.greeting}>Vault.</Text>
                </View>
                <View style={styles.seg}>
                    <TouchableOpacity
                        style={[styles.segBtn, mode === 'linked' && styles.segBtnActive]}
                        onPress={() => setMode('linked')}
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.segText, mode === 'linked' && styles.segTextActive]}>Linked</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segBtn, mode === 'manual' && styles.segBtnActive]}
                        onPress={() => setMode('manual')}
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.segText, mode === 'manual' && styles.segTextActive]}>Manual</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Balance hero */}
                <View style={styles.hero}>
                    <Text style={styles.heroCap}>TOTAL LIQUID BALANCE</Text>
                    <View style={styles.amountRow}>
                        <Text style={styles.heroSymbol}>{currencySymbol}</Text>
                        <Text style={styles.heroValue}>{total.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.heroFooter}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.footerCap}>MONTHLY YIELD</Text>
                            <Text style={styles.footerVal}>+{currencySymbol}{monthlyYield.toLocaleString()}</Text>
                        </View>
                        <View style={styles.heroDivider} />
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Text style={styles.footerCap}>UPDATED</Text>
                            <Text style={styles.footerVal}>{mode === 'linked' ? 'Live' : 'Today'}</Text>
                        </View>
                    </View>
                </View>

                {/* Accounts */}
                <View style={styles.sectionHeadRow}>
                    <Text style={styles.sectionHead}>{mode === 'linked' ? 'CONNECTED ACCOUNTS' : 'MANUAL ACCOUNTS'}</Text>
                    <Text style={styles.pill}>{mode === 'linked' ? '4 active' : '3 accounts'}</Text>
                </View>

                <View style={styles.card}>
                    {[
                        { name: mode === 'linked' ? 'HDFC Bank' : 'Savings account', sub: mode === 'linked' ? '•••• 5829' : 'Updated 2 days ago', amount: 824500, Icon: 'landmark' as IconName, tint: colors.accent, tintBg: colors.accentSoft },
                        { name: mode === 'linked' ? 'ICICI Savings' : 'Cash in hand', sub: mode === 'linked' ? '•••• 0042' : 'Updated 12 days ago', amount: mode === 'linked' ? 312000 : 12000, Icon: 'wallet' as IconName, tint: colors.warn, tintBg: colors.warnSoft },
                        { name: mode === 'linked' ? 'Paytm Wallet' : 'Digital wallet', sub: mode === 'linked' ? 'Mobile wallet' : 'Updated today', amount: 9100, Icon: 'wallet' as IconName, tint: colors.gain, tintBg: colors.gainSoft },
                    ].map((a, i) => (
                        <View key={i}>
                            <View style={styles.acctRow}>
                                <View style={[styles.acctIcon, { backgroundColor: a.tintBg }]}>
                                    <Icon name={a.Icon} color={a.tint} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.acctName}>{a.name}</Text>
                                    <Text style={styles.acctSub}>{a.sub}</Text>
                                </View>
                                <Text style={styles.acctAmt}>{currencySymbol}{a.amount.toLocaleString('en-IN')}</Text>
                            </View>
                            {i < 2 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                {/* Monthly spend */}
                <View style={styles.sectionHeadRow}>
                    <Text style={styles.sectionHead}>MONTHLY SPEND</Text>
                    <Text style={styles.spendTotal}>{currencySymbol}42,800</Text>
                </View>
                <View style={styles.card}>
                    <View style={styles.spendBar}>
                        <View style={[styles.spendSegment, { flex: 35, backgroundColor: colors.loss }]} />
                        <View style={[styles.spendSegment, { flex: 25, backgroundColor: colors.warn }]} />
                        <View style={[styles.spendSegment, { flex: 22, backgroundColor: colors.accent }]} />
                        <View style={[styles.spendSegment, { flex: 18, backgroundColor: colors.gain }]} />
                    </View>
                    <View style={styles.legendGrid}>
                        <View style={styles.legendRow}>
                            <View style={[styles.legendDot, { backgroundColor: colors.loss }]} />
                            <Text style={styles.legendLabel}>Shopping</Text>
                            <Text style={styles.legendVal}>35%</Text>
                        </View>
                        <View style={styles.legendRow}>
                            <View style={[styles.legendDot, { backgroundColor: colors.warn }]} />
                            <Text style={styles.legendLabel}>Bills</Text>
                            <Text style={styles.legendVal}>25%</Text>
                        </View>
                        <View style={styles.legendRow}>
                            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                            <Text style={styles.legendLabel}>Food</Text>
                            <Text style={styles.legendVal}>22%</Text>
                        </View>
                        <View style={styles.legendRow}>
                            <View style={[styles.legendDot, { backgroundColor: colors.gain }]} />
                            <Text style={styles.legendLabel}>Other</Text>
                            <Text style={styles.legendVal}>18%</Text>
                        </View>
                    </View>
                </View>

                {mode === 'manual' && (
                    <TouchableOpacity style={styles.addBtn} activeOpacity={0.85}>
                        <Text style={styles.addBtnText}>+  Add account</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
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
        seg: { flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: 10, padding: 3 },
        segBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
        segBtnActive: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
        segText: { color: c.ink2, fontSize: 12, fontWeight: t.weightMedium },
        segTextActive: { color: c.ink1 },

        scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },

        hero: {
            marginTop: 12,
            backgroundColor: c.surface, borderRadius: 20,
            borderWidth: 1, borderColor: c.border, padding: 18,
        },
        heroCap: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontWeight: t.weightSemibold },
        amountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
        heroSymbol: { color: c.ink1, fontSize: 24, fontWeight: t.weightBold, marginRight: 4 },
        heroValue: { color: c.ink1, fontSize: 32, fontWeight: t.weightBold, letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
        heroFooter: {
            flexDirection: 'row', alignItems: 'center',
            marginTop: 16, paddingTop: 14,
            borderTopWidth: 1, borderTopColor: c.border,
        },
        footerCap: { color: c.ink3, fontSize: 10, letterSpacing: 1.2, fontWeight: t.weightSemibold },
        footerVal: { color: c.ink1, fontSize: 16, fontWeight: t.weightSemibold, marginTop: 2, fontVariant: ['tabular-nums'] },
        heroDivider: { width: 1, height: 30, backgroundColor: c.border, marginHorizontal: 16 },

        sectionHeadRow: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 8, marginBottom: 8, paddingHorizontal: 2,
        },
        sectionHead: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontWeight: t.weightSemibold },
        pill: {
            color: c.ink2, backgroundColor: c.surfaceAlt,
            fontSize: 11, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden',
        },
        spendTotal: { color: c.ink1, fontSize: 14, fontWeight: t.weightBold, fontVariant: ['tabular-nums'] },

        card: { backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 6 },
        acctRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
        acctIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
        acctName: { color: c.ink1, fontSize: 14, fontWeight: t.weightSemibold },
        acctSub: { color: c.ink3, fontSize: 12, marginTop: 2 },
        acctAmt: { color: c.ink1, fontSize: 14, fontWeight: t.weightSemibold, fontVariant: ['tabular-nums'] },
        divider: { height: 1, backgroundColor: c.border },

        spendBar: { height: 8, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', marginTop: 8, marginBottom: 12 },
        spendSegment: { height: '100%' },
        legendGrid: { gap: 8, marginBottom: 8 },
        legendRow: { flexDirection: 'row', alignItems: 'center' },
        legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
        legendLabel: { color: c.ink2, fontSize: 13, flex: 1 },
        legendVal: { color: c.ink1, fontSize: 13, fontWeight: t.weightSemibold, fontVariant: ['tabular-nums'] },

        addBtn: {
            marginTop: 4, backgroundColor: c.accentSoft,
            paddingVertical: 14, borderRadius: 12, alignItems: 'center',
        },
        addBtnText: { color: c.accent, fontSize: 14, fontWeight: t.weightSemibold },
    });
