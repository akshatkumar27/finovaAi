import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppSelector } from '../../store/hooks';
import { useTheme, fontFor } from '../../theme';
import { Palette } from '../../theme/palette';
import { Icon, IconName } from '../../components';
import { formatMoney } from '../../utils/formatMoney';



export const InvestHubScreen: React.FC = () => {
    const currencySymbol = useAppSelector((state) => state.settings.appCurrency);
    const { colors, typography } = useTheme();
    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.dateCap}>INVEST</Text>
                    <Text style={styles.greeting}>Grow your money.</Text>
                </View>
                <TouchableOpacity style={styles.searchBtn} activeOpacity={0.7}>
                    <Icon name="search" color="ink2" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Portfolio value */}
                <View style={styles.hero}>
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.heroCap}>PORTFOLIO VALUE</Text>
                            <View style={styles.amountRow}>
                                <Text style={styles.heroSymbol}>{currencySymbol}</Text>
                                <Text style={styles.heroValue}>24,85,420</Text>
                            </View>
                        </View>
                        <View style={styles.gainBadge}>
                            <Text style={styles.gainBadgeText}>+12.4%</Text>
                        </View>
                    </View>
                    <Svg viewBox="0 0 280 60" preserveAspectRatio="none" style={{ width: '100%', height: 52, marginTop: 8 }}>
                        <Path
                            d="M0 48 L30 42 L60 44 L90 32 L120 34 L150 22 L180 26 L210 18 L240 20 L280 8"
                            fill="none" stroke={colors.gain} strokeWidth={2}
                            strokeLinecap="round" strokeLinejoin="round"
                        />
                        <Path
                            d="M0 48 L30 42 L60 44 L90 32 L120 34 L150 22 L180 26 L210 18 L240 20 L280 8 L280 60 L0 60 Z"
                            fill={colors.gainSoft} opacity={0.6}
                        />
                    </Svg>
                    <View style={styles.axisRow}>
                        <Text style={styles.axisText}>Aug 2025</Text>
                        <Text style={styles.axisText}>Sep 2026</Text>
                    </View>
                </View>

                {/* AI suggestion */}
                <View style={styles.tipCard}>
                    <Text style={styles.tipHeader}>SUGGESTED MOVE</Text>
                    <Text style={styles.tipText}>
                        Move {currencySymbol}10,000 from Savings to an index fund for better long-term growth.
                    </Text>
                    <TouchableOpacity style={styles.tipBtn} activeOpacity={0.85}>
                        <Text style={styles.tipBtnText}>Review options</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionHead}>YOUR ALLOCATION</Text>

                {[
                    { name: 'Mutual funds', sub: '10 active SIPs', amount: 1420000, change: '+18.4%', gain: true, Icon: 'bar-chart-3' as IconName, tint: colors.gain, tintBg: colors.gainSoft },
                    { name: 'Digital gold', sub: '45.2 g', amount: 315420, change: '+6.2%', gain: true, Icon: 'circle-dollar-sign' as IconName, tint: colors.warn, tintBg: colors.warnSoft },
                    { name: 'Fixed deposits', sub: '3 FDs active', amount: 750000, change: '-7.1%', gain: false, Icon: 'landmark' as IconName, tint: colors.accent, tintBg: colors.accentSoft },
                ].map((asset, i) => (
                    <View key={i} style={styles.assetCard}>
                        <View style={[styles.assetIcon, { backgroundColor: asset.tintBg }]}>
                            <Icon name={asset.Icon} color={asset.tint} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.assetName}>{asset.name}</Text>
                            <Text style={styles.assetSub}>{asset.sub}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.assetAmt}>{formatMoney(asset.amount)}</Text>
                            <Text style={[styles.assetChange, { color: asset.gain ? colors.gain : colors.loss }]}>{asset.change}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
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
        dateCap: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontFamily: fontFor('semibold') },
        greeting: { color: c.ink1, fontSize: 22, fontFamily: fontFor('bold'), letterSpacing: -0.4, marginTop: 2 },
        searchBtn: {
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
            alignItems: 'center', justifyContent: 'center',
        },

        scroll: { paddingHorizontal: 20, paddingBottom: 100, gap: 14 },

        hero: {
            marginTop: 12,
            backgroundColor: c.surface, borderRadius: 20,
            borderWidth: 1, borderColor: c.border, padding: 18,
        },
        row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
        heroCap: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontFamily: fontFor('semibold') },
        amountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
        heroSymbol: { color: c.ink1, fontSize: 22, fontFamily: fontFor('bold'), marginRight: 4 },
        heroValue: { color: c.ink1, fontSize: 30, fontFamily: fontFor('bold'), letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
        gainBadge: { backgroundColor: c.gainSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
        gainBadgeText: { color: c.gain, fontSize: 12, fontFamily: fontFor('semibold'), fontVariant: ['tabular-nums'] },
        axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
        axisText: { color: c.ink3, fontSize: 11 },

        tipCard: {
            backgroundColor: c.accentSoft, borderRadius: 16, padding: 14,
        },
        tipHeader: { color: c.accent, fontSize: 11, letterSpacing: 1.4, fontFamily: fontFor('semibold') },
        tipText: { color: c.ink1, fontSize: 14, lineHeight: 20, marginTop: 6 },
        tipBtn: {
            marginTop: 10, alignSelf: 'flex-start',
            backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
        },
        tipBtnText: { color: c.accent, fontSize: 13, fontFamily: fontFor('semibold') },

        sectionHead: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontFamily: fontFor('semibold'), marginTop: 4, paddingHorizontal: 2 },

        assetCard: {
            backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border,
            padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
        },
        assetIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
        assetName: { color: c.ink1, fontSize: 14, fontFamily: fontFor('semibold') },
        assetSub: { color: c.ink3, fontSize: 12, marginTop: 2 },
        assetAmt: { color: c.ink1, fontSize: 14, fontFamily: fontFor('semibold'), fontVariant: ['tabular-nums'] },
        assetChange: { fontSize: 11, fontFamily: fontFor('semibold'), marginTop: 2, fontVariant: ['tabular-nums'] },

        fab: {
            position: 'absolute', right: 20, bottom: 24,
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center',
            elevation: 8, shadowColor: c.shadow, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
        },
        fabPlus: { color: c.accentInk, fontSize: 28, fontFamily: fontFor('regular'), lineHeight: 30 },
    });
