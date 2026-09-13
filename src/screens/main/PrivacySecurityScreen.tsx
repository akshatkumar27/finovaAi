import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Palette } from '../../theme/palette';
import { BackButton } from '../../components';

const SECTIONS = [
    { title: 'Data collection', content: 'We only collect what\'s needed to give you personalized financial insights — income, expenses, goals. We never sell your data.' },
    { title: 'Security', content: 'Your data is encrypted with AES-256 in transit and at rest. Access is restricted to authorized personnel.' },
    { title: 'Your rights', content: 'You can access, correct, or delete your data any time. Request a copy or account deletion through our support team.' },
    { title: 'Third-party services', content: 'We use trusted partners for analytics and payments. All are compliant with GDPR and other data protection rules.' },
    { title: 'Policy updates', content: 'We\'ll notify you in the app or by email when this policy meaningfully changes.' },
];

export const PrivacySecurityScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors, typography } = useTheme();
    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Privacy &amp; security</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.intro}>
                    We take your privacy seriously. Here's how we protect your data and your rights as a user.
                </Text>

                {SECTIONS.map((s, i) => (
                    <View key={i} style={styles.section}>
                        <Text style={styles.sectionTitle}>{s.title}</Text>
                        <Text style={styles.sectionBody}>{s.content}</Text>
                    </View>
                ))}

                <Text style={styles.footer}>Last updated: February 2026</Text>
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
        headerTitle: { color: c.ink1, fontSize: 15, fontWeight: t.weightSemibold },
        scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
        intro: { color: c.ink2, fontSize: 15, lineHeight: 22, marginBottom: 20 },
        section: { marginBottom: 20 },
        sectionTitle: { color: c.ink1, fontSize: 15, fontWeight: t.weightSemibold, marginBottom: 6 },
        sectionBody: { color: c.ink2, fontSize: 14, lineHeight: 21 },
        footer: { color: c.ink3, fontSize: 12, textAlign: 'center', marginTop: 12 },
    });
