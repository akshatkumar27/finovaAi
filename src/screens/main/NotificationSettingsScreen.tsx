import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BackButton, Header } from '../../components';
import { colors, typography, spacing } from '../../constants';
import { notificationService } from '../../services/NotificationService';
import Toast from 'react-native-toast-message';

export const NotificationSettingsScreen: React.FC = () => {
    const navigation = useNavigation();

    // Mock settings state
    const [pauseAll, setPauseAll] = useState(false);
    const [settings, setSettings] = useState({
        marketing: true,
        transaction: true,
        budget: true,
        goals: true,
        security: true,
    });

    const toggleSwitch = async (key: keyof typeof settings) => {
        if (!settings[key]) {
            // If turning on, ensure we have permissions
            await notificationService.requestUserPermission();
        }
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const SettingRow = ({
        icon,
        label,
        value,
        onValueChange,
        disabled = false
    }: {
        icon: string,
        label: string,
        value: boolean,
        onValueChange: (val: boolean) => void,
        disabled?: boolean
    }) => (
        <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, disabled && styles.disabledIcon]}>
                    <Text style={styles.iconText}>{icon}</Text>
                </View>
                <Text style={[styles.settingLabel, disabled && styles.disabledText]}>{label}</Text>
            </View>
            <Switch
                trackColor={{ false: colors.inputBackground, true: colors.primary }}
                thumbColor={'#fff'}
                ios_backgroundColor={colors.inputBackground}
                onValueChange={onValueChange}
                value={value}
                disabled={disabled}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <Header title="Notification Settings" />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Master Switch */}
                <View style={[styles.card, styles.masterCard]}>
                    <View style={styles.settingRow}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#ef444420' }]}>
                                <Text style={styles.iconText}>🔕</Text>
                            </View>
                            <View>
                                <Text style={styles.masterLabel}>Pause All</Text>
                                <Text style={styles.masterDescription}>Temporarily pause notifications</Text>
                            </View>
                        </View>
                        <Switch
                            trackColor={{ false: colors.inputBackground, true: colors.primary }}
                            thumbColor={'#fff'}
                            ios_backgroundColor={colors.inputBackground}
                            onValueChange={setPauseAll}
                            value={pauseAll}
                        />
                    </View>
                </View>

                {/* Categories */}
                <Text style={styles.sectionHeader}>CATEGORIES</Text>
                <View style={[styles.card, pauseAll && styles.disabledCard]}>
                    <SettingRow
                        icon="💡"
                        label="Tips & Recommendations"
                        value={settings.marketing}
                        onValueChange={() => toggleSwitch('marketing')}
                        disabled={pauseAll}
                    />
                    <View style={styles.divider} />
                    {/* <SettingRow
                        icon="💸"
                        label="Transaction Alerts"
                        value={settings.transaction}
                        onValueChange={() => toggleSwitch('transaction')}
                        disabled={pauseAll}
                    /> */}
                    <View style={styles.divider} />
                    <SettingRow
                        icon="🔔"
                        label="Budget Reminders"
                        value={settings.budget}
                        onValueChange={() => toggleSwitch('budget')}
                        disabled={pauseAll}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="🏆"
                        label="Goal Milestones"
                        value={settings.goals}
                        onValueChange={() => toggleSwitch('goals')}
                        disabled={pauseAll}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="🛡️"
                        label="Security Alerts"
                        value={settings.security}
                        onValueChange={() => toggleSwitch('security')}
                        disabled={pauseAll}
                    />
                </View>

                <Text style={styles.footerNote}>
                    Note: Critical security alerts may still be sent even if "Pause All" is enabled.
                </Text>

                {/* Test Notification Button */}
                 {/* <TouchableOpacity
                    style={styles.testButton}
                    onPress={async () => {
                        try {
                            await notificationService.displayNotification(
                                'Test Notification',
                                'This is a test notification from Finova!'
                            );
                        } catch (error: any) {
                            console.error('Notification Error:', error);
                            Toast.show({
                                type: 'error',
                                text1: 'Notification Failed',
                                text2: error.message || 'Check console for details',
                            });
                        }
                    }}
                >
                    <Text style={styles.testButtonText}>Send Test Notification</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.testButton, { marginTop: -spacing.xl, borderColor: colors.primary, backgroundColor: 'transparent' }]}
                    onPress={async () => {
                        const token = await notificationService.getFCMToken();
                        if (token) {
                            console.log('FCM Token:', token);
                            Alert.alert('FCM Token', token);
                        } else {
                            Toast.show({
                                type: 'error',
                                text1: 'Token Error',
                                text2: 'Could not retrieve token',
                            });
                        }
                    }}
                >
                    <Text style={styles.testButtonText}>Get FCM Token</Text>
                </TouchableOpacity>  */}

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
    sectionHeader: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        fontWeight: typography.bold,
        marginBottom: spacing.sm,
        marginTop: spacing.xl,
        paddingLeft: spacing.xs,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        overflow: 'hidden',
    },
    masterCard: {
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
    },
    disabledCard: {
        opacity: 0.5,
        pointerEvents: 'none',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    disabledIcon: {
        backgroundColor: colors.background,
    },
    iconText: {
        fontSize: 20,
    },
    settingLabel: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.medium,
        flex: 1,
    },
    disabledText: {
        color: colors.textMuted,
    },
    masterLabel: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.bold,
    },
    masterDescription: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.inputBackground,
        marginLeft: 70, // Align with text start (40 icon + 16 margin + 14 padding ~ 70)
    },
    footerNote: {
        color: colors.textMuted,
        fontSize: typography.caption,
        textAlign: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.xxl, // Increased for button
        paddingHorizontal: spacing.lg,
    },
    testButton: {
        backgroundColor: colors.inputBackground,
        marginHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    testButtonText: {
        color: colors.primary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
    },
});
