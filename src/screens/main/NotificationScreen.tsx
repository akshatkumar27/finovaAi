import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store/hooks';
import { useTheme, fontFor } from '../../theme';
import { Palette } from '../../theme/palette';
import { BackButton, Icon, IconName } from '../../components';

type NType = 'suggestion' | 'alert' | 'update' | 'achievement';
interface NotificationItem {
    id: string;
    type: NType;
    title: string;
    description: string;
    time: string;
    when: 'today' | 'week' | 'earlier';
    isRead: boolean;
}



export const NotificationScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors, typography } = useTheme();
    const currencySymbol = useAppSelector((state) => state.settings.appCurrency);
    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const NOTIFICATIONS: NotificationItem[] = useMemo(() => [
        { id: '1', type: 'alert', title: 'Payment due Sep 10', description: `Emergency fund contribution of ${currencySymbol}30,000 due in 2 days.`, time: '9:12 AM', when: 'today', isRead: false },
        { id: '2', type: 'update', title: 'You saved ₹18k this month', description: '+22% vs last month · nice work.', time: '8:00 AM', when: 'today', isRead: false },
        { id: '3', type: 'achievement', title: 'Milestone: 20% of Emergency fund', description: 'One-fifth done. Steady.', time: 'Yesterday', when: 'week', isRead: true },
        { id: '4', type: 'suggestion', title: 'Tip: SIP step-up', description: 'Increase contribution 10% each year to hit goals faster.', time: '3 days ago', when: 'week', isRead: true },
        { id: '5', type: 'update', title: 'Account synced', description: 'Your HDFC bank account is up to date.', time: '5 days ago', when: 'earlier', isRead: true },
    ], [currencySymbol]);

    const groups: { head: string; items: NotificationItem[] }[] = [
        { head: 'TODAY', items: NOTIFICATIONS.filter((n) => n.when === 'today') },
        { head: 'THIS WEEK', items: NOTIFICATIONS.filter((n) => n.when === 'week') },
        { head: 'EARLIER', items: NOTIFICATIONS.filter((n) => n.when === 'earlier') },
    ].filter((g) => g.items.length > 0);

    const iconForType = (type: NType) => {
        switch (type) {
            case 'alert': return { bg: colors.warnSoft, fg: colors.warn, iconName: 'alert-triangle' as IconName };
            case 'update': return { bg: colors.gainSoft, fg: colors.gain, iconName: 'check' as IconName };
            case 'achievement': return { bg: colors.accentSoft, fg: colors.accent, iconName: 'star' as IconName };
            case 'suggestion':
            default: return { bg: colors.accentSoft, fg: colors.accent, iconName: 'lightbulb' as IconName };
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings' as never)} activeOpacity={0.7} style={styles.back}>
                    <Icon name="settings" color="ink2" size="md" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {groups.map((group) => (
                    <View key={group.head}>
                        <Text style={styles.sectionHead}>{group.head}</Text>
                        {group.items.map((n) => {
                            const { bg, fg, iconName } = iconForType(n.type);
                            return (
                                <View key={n.id} style={styles.card}>
                                    {!n.isRead && <View style={styles.unreadDot} />}
                                    <View style={[styles.iconWrap, { backgroundColor: bg }]}>
                                        <Icon name={iconName} color={fg} size="md" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.title}>{n.title}</Text>
                                        <Text style={styles.desc}>{n.description}</Text>
                                        <Text style={styles.time}>{n.time}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ))}

                {groups.length === 0 && (
                    <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>All caught up.</Text>
                        <Text style={styles.emptyDesc}>We'll ping you when there's something worth surfacing.</Text>
                    </View>
                )}
            </ScrollView>
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
        headerTitle: { color: c.ink1, fontSize: 15, fontFamily: fontFor('semibold') },

        scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 12 },
        sectionHead: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontFamily: fontFor('semibold'), marginTop: 4, marginBottom: 8, paddingHorizontal: 2 },

        card: {
            backgroundColor: c.surface, borderRadius: 16,
            borderWidth: 1, borderColor: c.border,
            padding: 14, marginBottom: 8,
            flexDirection: 'row', alignItems: 'flex-start', gap: 12,
            position: 'relative',
        },
        unreadDot: {
            width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent,
            position: 'absolute', top: 14, right: 14,
        },
        iconWrap: {
            width: 36, height: 36, borderRadius: 10,
            alignItems: 'center', justifyContent: 'center',
        },
        title: { color: c.ink1, fontSize: 14, fontFamily: fontFor('semibold'), marginRight: 16 },
        desc: { color: c.ink2, fontSize: 13, lineHeight: 18, marginTop: 4 },
        time: { color: c.ink3, fontSize: 11, marginTop: 6 },

        empty: { paddingVertical: 60, alignItems: 'center' },
        emptyTitle: { color: c.ink1, fontSize: 18, fontFamily: fontFor('bold'), letterSpacing: -0.3 },
        emptyDesc: { color: c.ink2, fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
    });
