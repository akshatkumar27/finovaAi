import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BackButton, Header } from '../../components';
import { colors, typography, spacing } from '../../constants';
import { useCurrency } from '../../context/CurrencyContext';

interface NotificationItem {
    id: string;
    type: 'suggestion' | 'alert' | 'update' | 'achievement';
    title: string;
    description: string;
    time: string;
    isRead: boolean;
}


const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'suggestion':
            return '⚡';
        case 'alert':
            return '⚠️';
        case 'update':
            return '✅';
        case 'achievement':
            return '🏆';
        default:
            return '🔔';
    }
};

const getNotificationColor = (type: string) => {
    switch (type) {
        case 'suggestion':
            return '#f59e0b';
        case 'alert':
            return '#ef4444';
        case 'update':
            return '#22c55e';
        case 'achievement':
            return '#8b5cf6';
        default:
            return colors.primary;
    }
};

export const NotificationScreen: React.FC = () => {
    const navigation = useNavigation();
    const { currencySymbol } = useCurrency();

    const NOTIFICATIONS: NotificationItem[] = React.useMemo(() => [
        {
            id: '1',
            type: 'suggestion',
            title: 'AI Suggestion',
            description: `Auto-invest ${currencySymbol}2,500 extra to reach your Marriage Fund target by Nov 2025.`,
            time: '2 hours ago',
            isRead: false,
        },
        {
            id: '2',
            type: 'alert',
            title: 'Unusual Spending Detected',
            description: `You spent ${currencySymbol}4,500 on food delivery this week. That's 40% higher than usual.`,
            time: '5 hours ago',
            isRead: false,
        },
        {
            id: '3',
            type: 'achievement',
            title: 'Goal Milestone! 🎉',
            description: 'You\'ve reached 50% of your Marriage Fund goal. Keep it up!',
            time: 'Yesterday',
            isRead: true,
        },
        {
            id: '4',
            type: 'update',
            title: 'Account Synced',
            description: 'Your HDFC Bank account has been successfully synced.',
            time: 'Yesterday',
            isRead: true,
        },
        {
            id: '5',
            type: 'suggestion',
            title: 'Investment Opportunity',
            description: 'Based on your risk profile, consider investing in Nifty 50 Index Fund.',
            time: '2 days ago',
            isRead: true,
        },
        {
            id: '6',
            type: 'alert',
            title: 'Bill Reminder',
            description: `Your electricity bill of ${currencySymbol}2,340 is due in 3 days.`,
            time: '3 days ago',
            isRead: true,
        },
    ], [currencySymbol]);

    const unreadCount = NOTIFICATIONS.filter(n => !n.isRead).length;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            {/* Header */}
            <Header
                title="Notifications"
                rightElement={
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('NotificationSettings' as never)}
                    >
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </TouchableOpacity>
                }
            />

            {/* Unread Badge */}
            {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                        {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                    </Text>
                </View>
            )}

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Today Section */}
                <Text style={styles.sectionLabel}>TODAY</Text>
                {NOTIFICATIONS.filter(n => n.time.includes('hour')).map(notification => (
                    <TouchableOpacity
                        key={notification.id}
                        style={[
                            styles.notificationCard,
                            !notification.isRead && styles.notificationUnread,
                        ]}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: getNotificationColor(notification.type) + '20' },
                            ]}
                        >
                            <Text style={styles.icon}>{getNotificationIcon(notification.type)}</Text>
                        </View>
                        <View style={styles.notificationContent}>
                            <View style={styles.notificationHeader}>
                                <Text
                                    style={[
                                        styles.notificationTitle,
                                        { color: getNotificationColor(notification.type) },
                                    ]}
                                >
                                    {notification.title}
                                </Text>
                                {!notification.isRead && <View style={styles.unreadDot} />}
                            </View>
                            <Text style={styles.notificationDescription} numberOfLines={2}>
                                {notification.description}
                            </Text>
                            <Text style={styles.notificationTime}>{notification.time}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Earlier Section */}
                <Text style={styles.sectionLabel}>EARLIER</Text>
                {NOTIFICATIONS.filter(n => !n.time.includes('hour')).map(notification => (
                    <TouchableOpacity
                        key={notification.id}
                        style={[
                            styles.notificationCard,
                            !notification.isRead && styles.notificationUnread,
                        ]}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: getNotificationColor(notification.type) + '20' },
                            ]}
                        >
                            <Text style={styles.icon}>{getNotificationIcon(notification.type)}</Text>
                        </View>
                        <View style={styles.notificationContent}>
                            <View style={styles.notificationHeader}>
                                <Text
                                    style={[
                                        styles.notificationTitle,
                                        { color: getNotificationColor(notification.type) },
                                    ]}
                                >
                                    {notification.title}
                                </Text>
                                {!notification.isRead && <View style={styles.unreadDot} />}
                            </View>
                            <Text style={styles.notificationDescription} numberOfLines={2}>
                                {notification.description}
                            </Text>
                            <Text style={styles.notificationTime}>{notification.time}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={styles.bottomSpacing} />
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
    settingsButton: {
        paddingHorizontal: spacing.sm,
    },
    settingsIcon: {
        fontSize: 24,
    },
    markReadButton: {
        paddingHorizontal: spacing.sm,
    },
    markReadText: {
        color: colors.primary,
        fontSize: typography.caption,
        fontWeight: typography.medium,
    },
    unreadBadge: {
        backgroundColor: colors.primary + '20',
        marginHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 8,
        marginBottom: spacing.md,
    },
    unreadText: {
        color: colors.primary,
        fontSize: typography.caption,
        fontWeight: typography.medium,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    sectionLabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontWeight: typography.semibold,
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    notificationUnread: {
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    icon: {
        fontSize: 18,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: typography.bodySmall,
        fontWeight: typography.semibold,
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
    },
    notificationDescription: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        lineHeight: 18,
        marginBottom: 4,
    },
    notificationTime: {
        color: colors.textMuted,
        fontSize: typography.caption - 1,
    },
    bottomSpacing: {
        height: spacing.xxl,
    },
});
