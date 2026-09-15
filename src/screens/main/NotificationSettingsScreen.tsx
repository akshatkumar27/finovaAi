import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { notificationService } from '../../services/NotificationService';
import { useTheme, fontFor } from '../../theme';
import { Palette } from '../../theme/palette';
import { BackButton } from '../../components';

type Prefs = {
    paymentDue: boolean;
    missed: boolean;
    weekly: boolean;
    milestones: boolean;
    monthly: boolean;
    tips: boolean;
    product: boolean;
};

const GROUPS: { head: string; rows: { key: keyof Prefs; title: string; sub: string }[] }[] = [
    {
        head: 'REMINDERS',
        rows: [
            { key: 'paymentDue', title: 'Payment due', sub: '3 days, 1 day, morning of' },
            { key: 'missed', title: 'Missed payment', sub: 'Same day + follow-up' },
            { key: 'weekly', title: 'Weekly check-in', sub: 'Sunday mornings' },
        ],
    },
    {
        head: 'PROGRESS',
        rows: [
            { key: 'milestones', title: 'Milestone hit', sub: 'Every 10% of a goal' },
            { key: 'monthly', title: 'Monthly summary', sub: '1st of each month' },
        ],
    },
    {
        head: 'NUDGES',
        rows: [
            { key: 'tips', title: 'Tips & ideas', sub: 'One or two per week, max' },
            { key: 'product', title: 'Product updates', sub: 'When we ship something worth it' },
        ],
    },
];

export const NotificationSettingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors, typography } = useTheme();
    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const [prefs, setPrefs] = useState<Prefs>({
        paymentDue: true,
        missed: true,
        weekly: false,
        milestones: true,
        monthly: true,
        tips: false,
        product: false,
    });

    const toggle = async (key: keyof Prefs) => {
        if (!prefs[key]) await notificationService.requestUserPermission();
        setPrefs((p) => ({ ...p, [key]: !p[key] }));
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {GROUPS.map((group) => (
                    <View key={group.head}>
                        <Text style={styles.sectionHead}>{group.head}</Text>
                        <View style={styles.card}>
                            {group.rows.map((row, idx) => (
                                <View key={row.key}>
                                    <View style={styles.row}>
                                        <View style={{ flex: 1, marginRight: 12 }}>
                                            <Text style={styles.rowTitle}>{row.title}</Text>
                                            <Text style={styles.rowSub}>{row.sub}</Text>
                                        </View>
                                        <Switch
                                            trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
                                            thumbColor="#FFFFFF"
                                            ios_backgroundColor={colors.surfaceAlt}
                                            onValueChange={() => toggle(row.key)}
                                            value={prefs[row.key]}
                                        />
                                    </View>
                                    {idx < group.rows.length - 1 && <View style={styles.divider} />}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                <Text style={styles.footer}>Critical security alerts may still be sent when other notifications are muted.</Text>
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
        sectionHead: {
            color: c.ink3, fontSize: 11, letterSpacing: 1.4,
            fontFamily: fontFor('semibold'), marginTop: 4, marginBottom: 8, paddingHorizontal: 2,
        },
        card: {
            backgroundColor: c.surface, borderRadius: 16,
            borderWidth: 1, borderColor: c.border,
            paddingHorizontal: 16,
        },
        row: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingVertical: 12,
        },
        rowTitle: { color: c.ink1, fontSize: 14, fontFamily: fontFor('medium') },
        rowSub: { color: c.ink3, fontSize: 12, marginTop: 2 },
        divider: { height: 1, backgroundColor: c.border },
        footer: { color: c.ink3, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18, paddingHorizontal: 16 },
    });
