import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BackButton, Header } from '../../components';
import { colors, typography, spacing } from '../../constants';

// Enable LayoutAnimation for Android
if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const HelpSupportScreen: React.FC = () => {
    const navigation = useNavigation();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const handleContactSupport = () => {
        // Replace with your actual WhatsApp number
        Linking.openURL('https://wa.me/919569937537?text=Hello%20Finova%20AI%20Support');
    };

    const FAQs = [
        {
            id: '1',
            question: 'How do I add a new financial goal?',
            answer: 'Navigate to the "Pulse" tab and tap the "+" button in the top right corner. Follow the steps to set your goal name, target amount, and timeline.',
        },
        {
            id: '2',
            question: 'Is my data secure?',
            answer: 'Yes, absolutely. We use bank-grade AES-256 encryption to protect your data. Your financial information is never shared with third parties without your explicit consent.',
        },
        {
            id: '3',
            question: 'Can I change my monthly investment amount?',
            answer: 'Yes! Go to the "Contributions" screen for any specific goal and you can adjust your monthly contribution plan there.',
        },
        {
            id: '4',
            question: 'How do I delete my account?',
            answer: 'You can delete your account from the "Personal Information" screen. Note that this action is permanent and cannot be undone.',
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <Header title="Help & Support" />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Contact Section */}
                <View style={styles.contactCard}>
                    <Text style={styles.contactTitle}>Need specific help?</Text>
                    <Text style={styles.contactText}>
                        Our support team is here to assist you with any questions or issues.
                    </Text>
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={handleContactSupport}
                    >
                        <Text style={styles.contactButtonText}>Contact Support</Text>
                    </TouchableOpacity>
                </View>

                {/* FAQ Section */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                <View style={styles.faqList}>
                    {FAQs.map((faq) => (
                        <View key={faq.id} style={styles.faqItem}>
                            <TouchableOpacity
                                style={styles.faqHeader}
                                onPress={() => toggleExpand(faq.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.question}>{faq.question}</Text>
                                <Text style={styles.expandIcon}>
                                    {expandedId === faq.id ? '−' : '+'}
                                </Text>
                            </TouchableOpacity>
                            {expandedId === faq.id && (
                                <View style={styles.answerContainer}>
                                    <Text style={styles.answer}>{faq.answer}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.copyrightText}>© 2026 Finova AI</Text>
                </View>
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
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: typography.h3,
        fontWeight: typography.bold,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    contactCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16, // using number directly
        padding: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    contactTitle: {
        color: colors.textPrimary,
        fontSize: typography.h3,
        fontWeight: typography.bold,
        marginBottom: spacing.xs,
    },
    contactText: {
        color: colors.textSecondary,
        fontSize: typography.body,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    contactButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12, // using number directly
        paddingHorizontal: 24, // using number directly
        borderRadius: 24, // using number directly
        width: '100%',
        alignItems: 'center',
    },
    contactButtonText: {
        color: '#fff',
        fontSize: typography.body,
        fontWeight: typography.bold,
    },
    sectionTitle: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        fontWeight: typography.bold,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    faqList: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        overflow: 'hidden',
    },
    faqItem: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        minHeight: 60,
    },
    question: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.medium,
        flex: 1,
        paddingRight: spacing.md,
    },
    expandIcon: {
        color: colors.primary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    answerContainer: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
    },
    answer: {
        color: colors.textSecondary,
        fontSize: typography.body,
        lineHeight: 22,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    versionText: {
        color: colors.textMuted,
        fontSize: typography.caption,
        marginBottom: 4,
    },
    copyrightText: {
        color: colors.textMuted,
        fontSize: typography.caption,
    },
});
