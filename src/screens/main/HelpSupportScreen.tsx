import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme, fontFor } from '../../theme';
import { Palette } from '../../theme/palette';
import { BackButton } from '../../components';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
    { id: '1', q: 'How is the pulse score calculated?', a: 'It averages the progress across all your active goals, weighted by how close you are to target. Above 75 means you\'re ahead of pace.' },
    { id: '2', q: 'What happens if I miss a contribution?', a: 'Nothing breaks — the goal just extends. We\'ll show a small nudge next time you open the app.' },
    { id: '3', q: 'Can I have more than one goal?', a: 'Yes, as many as your budget supports. Add another from the + button on the Pulse screen.' },
    { id: '4', q: 'Is my data safe?', a: 'Yes — bank-grade AES-256 encryption in transit and at rest. We never share your financial info with third parties without your explicit consent.' },
    { id: '5', q: 'How do I delete my account?', a: 'From Personal Info, tap Delete account at the bottom. This is permanent.' },
];

export const HelpSupportScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors, typography } = useTheme();
    const [expanded, setExpanded] = useState<string | null>(null);
    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const toggle = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(expanded === id ? null : id);
    };

    const openChat = () => Linking.openURL('https://wa.me/919569937537?text=Hello%20Finova%20AI%20Support');
    const openEmail = () => Linking.openURL('mailto:help@finova.app');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Help</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>How can we help?</Text>
                    <Text style={styles.heroSub}>Reach out or browse common questions below.</Text>
                </View>

                <View style={styles.contactRow}>
                    <TouchableOpacity style={styles.contactCard} onPress={openChat} activeOpacity={0.85}>
                        <Text style={styles.contactLabel}>Chat</Text>
                        <Text style={styles.contactValue}>WhatsApp</Text>
                        <Text style={styles.contactHint}>~4 hour reply</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactCard} onPress={openEmail} activeOpacity={0.85}>
                        <Text style={styles.contactLabel}>Email</Text>
                        <Text style={styles.contactValue}>help@finova.app</Text>
                        <Text style={styles.contactHint}>~1 day reply</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionHead}>COMMON QUESTIONS</Text>
                <View style={styles.faqCard}>
                    {FAQS.map((faq, idx) => (
                        <View key={faq.id}>
                            <TouchableOpacity style={styles.faqHeader} onPress={() => toggle(faq.id)} activeOpacity={0.7}>
                                <Text style={styles.faqQuestion}>{faq.q}</Text>
                                <Text style={styles.faqIcon}>{expanded === faq.id ? '−' : '+'}</Text>
                            </TouchableOpacity>
                            {expanded === faq.id && (
                                <Text style={styles.faqAnswer}>{faq.a}</Text>
                            )}
                            {idx < FAQS.length - 1 && <View style={styles.faqDivider} />}
                        </View>
                    ))}
                </View>

                <Text style={styles.footer}>© 2026 Finova AI</Text>
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
        scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
        hero: { marginBottom: 16 },
        heroTitle: { color: c.ink1, fontSize: 22, fontFamily: fontFor('bold'), letterSpacing: -0.4 },
        heroSub: { color: c.ink2, fontSize: 13, marginTop: 4, lineHeight: 18 },

        contactRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
        contactCard: {
            flex: 1, backgroundColor: c.surface, borderRadius: 16,
            borderWidth: 1, borderColor: c.border, padding: 14,
        },
        contactLabel: { color: c.ink3, fontSize: 11, letterSpacing: 1.2, fontFamily: fontFor('semibold') },
        contactValue: { color: c.ink1, fontSize: 14, fontFamily: fontFor('semibold'), marginTop: 4 },
        contactHint: { color: c.ink3, fontSize: 11, marginTop: 2 },

        sectionHead: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontFamily: fontFor('semibold'), marginBottom: 8, paddingHorizontal: 2 },
        faqCard: {
            backgroundColor: c.surface, borderRadius: 16,
            borderWidth: 1, borderColor: c.border,
            paddingHorizontal: 16,
        },
        faqHeader: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingVertical: 14,
        },
        faqQuestion: { color: c.ink1, fontSize: 14, fontFamily: fontFor('medium'), flex: 1, marginRight: 12 },
        faqIcon: { color: c.ink2, fontSize: 20, width: 22, textAlign: 'center' },
        faqAnswer: { color: c.ink2, fontSize: 13, lineHeight: 20, paddingBottom: 14 },
        faqDivider: { height: 1, backgroundColor: c.border },

        footer: { color: c.ink3, fontSize: 12, textAlign: 'center', marginTop: 24 },
    });
