import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing } from '../../constants';
import { Header } from '../../components';
import { MainStackParamList } from '../../navigation/MainTabNavigator';
import { api } from '../../services';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type GoalChatRouteProp = RouteProp<MainStackParamList, 'GoalChat'>;

export const GoalChatScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<GoalChatRouteProp>();
    const goalTitle = route.params?.goalTitle || 'Goal Chat';

    const [isLoading, setIsLoading] = useState(false);
    const [joined, setJoined] = useState(false);

    const handleJoinWaitlist = async () => {
        setIsLoading(true);
        try {
            const response = await api.post('/api/waitlist/join', {
                feature: 'ai_goals',
            });

            if (response.data.success) {
                setJoined(true);
                Toast.show({
                    type: 'success',
                    text1: 'You\'re on the list!',
                    text2: 'We\'ll notify you when AI Goals are available.',
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Something went wrong',
                    text2: response.data.message || 'Please try again later.',
                });
            }
        } catch (error: any) {
            console.error('Failed to join waitlist:', error);
            if (error.response && error.response.status === 409) {
                setJoined(true);
                Toast.show({
                    type: 'info',
                    text1: 'Already Joined',
                    text2: 'You have already joined the waitlist!',
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Connection Error',
                    text2: 'Please check your internet connection.',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            {/* Header */}
            <Header title={goalTitle} />

            {/* Coming Soon Content */}
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🤖</Text>
                </View>
                <Text style={styles.title}>AI Chat Coming Soon</Text>
                <Text style={styles.subtitle}>
                    We're working on an intelligent AI assistant to help you achieve your financial goals faster.
                </Text>
                <View style={styles.featureList}>
                    <Text style={styles.featureItem}>✨ Personalized advice</Text>
                    <Text style={styles.featureItem}>📊 Smart goal tracking</Text>
                    <Text style={styles.featureItem}>💡 Investment insights</Text>
                </View>

                {joined ? (
                    <View style={styles.joinedContainer}>
                        <Text style={styles.joinedText}>You're on the list! 🚀</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.disabledButton]}
                        onPress={handleJoinWaitlist}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.textPrimary} />
                        ) : (
                            <Text style={styles.buttonText}>Join Waitlist</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
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
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: typography.medium,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontSize: typography.h3,
        fontWeight: typography.semibold,
        flex: 1,
        marginLeft: spacing.md,
    },
    headerSpacer: {
        width: 36,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    icon: {
        fontSize: 48,
    },
    title: {
        color: colors.textPrimary,
        fontSize: typography.h2,
        fontWeight: typography.bold,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: typography.body,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xl,
    },
    featureList: {
        alignItems: 'flex-start',
        marginBottom: spacing.xl,
    },
    featureItem: {
        color: colors.textSecondary,
        fontSize: typography.body,
        marginBottom: spacing.sm,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
    },
    joinedContainer: {
        backgroundColor: colors.cardBackground,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    joinedText: {
        color: colors.primary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
    },
    disabledButton: {
        opacity: 0.7,
    },
});

