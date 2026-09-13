import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { MainStackParamList } from '../../navigation/MainTabNavigator';
import { api } from '../../services';
import { useTheme } from '../../theme';
import { Palette } from '../../theme/palette';
import { BackButton, Icon } from '../../components';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type GoalChatRouteProp = RouteProp<MainStackParamList, 'GoalChat'>;



export const GoalChatScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<GoalChatRouteProp>();
    const { colors, typography } = useTheme();
    const goalTitle = route.params?.goalTitle || 'Goal coach';

    const [isLoading, setIsLoading] = useState(false);
    const [joined, setJoined] = useState(false);

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const handleJoin = async () => {
        setIsLoading(true);
        try {
            const response = await api.post('/api/waitlist/join', { feature: 'ai_goals' });
            if (response.data.success) {
                setJoined(true);
                Toast.show({ type: 'success', text1: 'You\'re on the list', text2: 'We\'ll ping you when AI Coach opens.' });
            } else {
                Toast.show({ type: 'error', text1: 'Try again', text2: response.data.message || 'Something went wrong.' });
            }
        } catch (error: any) {
            if (error.response?.status === 409) {
                setJoined(true);
                Toast.show({ type: 'info', text1: 'Already joined', text2: 'You\'re already on the waitlist.' });
            } else {
                Toast.show({ type: 'error', text1: 'Connection error', text2: 'Check your internet and try again.' });
            }
        } finally { setIsLoading(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>{goalTitle}</Text>
                <View style={{ width: 34 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <Icon name="message-square" color="accent" size="xl" />
                </View>
                <Text style={styles.title}>AI coach — coming soon.</Text>
                <Text style={styles.subtitle}>
                    An always-on financial coach that knows your goals, your budget, and how to help you finish faster.
                </Text>

                <View style={styles.features}>
                    {[
                        'Personalized advice on your goals',
                        'Tradeoff analysis before you commit',
                        'Weekly nudges — never noise',
                    ].map((f, i) => (
                        <View key={i} style={styles.featureRow}>
                            <View style={styles.featureDot} />
                            <Text style={styles.featureText}>{f}</Text>
                        </View>
                    ))}
                </View>

                {joined ? (
                    <View style={styles.joinedCard}>
                        <Text style={styles.joinedText}>You're on the list.</Text>
                        <Text style={styles.joinedSub}>We'll notify you when AI Coach opens up.</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.button, isLoading && { opacity: 0.6 }]}
                        onPress={handleJoin}
                        disabled={isLoading}
                        activeOpacity={0.85}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.accentInk} />
                        ) : (
                            <Text style={styles.buttonText}>Join the waitlist</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
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

        content: { flex: 1, paddingHorizontal: 24, paddingTop: 32, alignItems: 'center' },
        iconWrap: {
            width: 80, height: 80, borderRadius: 20,
            backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
        },
        title: { color: c.ink1, fontSize: 24, fontWeight: t.weightBold, letterSpacing: -0.5, textAlign: 'center' },
        subtitle: { color: c.ink2, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, maxWidth: 320 },

        features: { marginTop: 32, width: '100%', gap: 12 },
        featureRow: { flexDirection: 'row', alignItems: 'center' },
        featureDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent, marginRight: 12 },
        featureText: { color: c.ink1, fontSize: 14 },

        button: {
            marginTop: 'auto', marginBottom: 24, width: '100%',
            backgroundColor: c.accent, paddingVertical: 14, borderRadius: 12,
            alignItems: 'center', justifyContent: 'center', minHeight: 52,
        },
        buttonText: { color: c.accentInk, fontSize: 14, fontWeight: t.weightSemibold },

        joinedCard: {
            marginTop: 'auto', marginBottom: 24, width: '100%',
            backgroundColor: c.gainSoft, borderRadius: 12, padding: 16, alignItems: 'center',
        },
        joinedText: { color: c.gain, fontSize: 15, fontWeight: t.weightSemibold },
        joinedSub: { color: c.ink2, fontSize: 12, marginTop: 4 },
    });
