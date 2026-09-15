import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { notificationService } from '../../services/NotificationService';
import api from '../../services/api';
import { MainStackParamList } from '../../navigation/MainTabNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearFinancialData } from '../../store/slices/financialDataSlice';
import { logout } from '../../store/slices/authSlice';
import { useTheme, ThemeMode, fontFor } from '../../theme';
import { Palette } from '../../theme/palette';
import { Icon } from '../../components';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;



export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user) || {};
    const { colors, typography, mode, setMode } = useTheme();
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    
    const userName = user.name || '';
    const userEmail = user.email || '';

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const handleLogout = async () => {
        setLogoutModalVisible(false);
        try {
            const fcmToken = await notificationService.getFCMToken();
            if (fcmToken) {
                await api.delete('/api/notifications/unregister-token', { data: { fcm_token: fcmToken } });
            }
            await api.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout API error:', error);
        }
        try { await AsyncStorage.clear(); } catch (e) { console.error(e); }
        dispatch(clearFinancialData());
        dispatch(logout({ targetScreen: 'Login' }));
    };

    const initials = (() => {
        if (!userName) return 'U';
        const parts = userName.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return parts[0][0].toUpperCase();
    })();

    const themeOptions: { key: ThemeMode; label: string }[] = [
        { key: 'light', label: 'Light' },
        { key: 'dark', label: 'Dark' },
        { key: 'system', label: 'System' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Logout modal */}
            <Modal animationType="fade" transparent visible={logoutModalVisible} onRequestClose={() => setLogoutModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Sign out</Text>
                        <Text style={styles.modalMessage}>You'll need to sign in again to see your goals.</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setLogoutModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirm} onPress={handleLogout}>
                                <Text style={styles.modalConfirmText}>Sign out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.header}>
                <View style={{ width: 34 }} />
                <Text style={styles.headerTitle}>You</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                    <Text style={styles.userName}>{userName || 'User'}</Text>
                    <Text style={styles.userEmail}>{userEmail}</Text>
                </View>

                {/* Appearance */}
                <Text style={styles.sectionHead}>APPEARANCE</Text>
                <View style={styles.card}>
                    <View style={styles.appearanceRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>Theme</Text>
                            <Text style={styles.rowSub}>Choose how Finova looks</Text>
                        </View>
                        <View style={styles.seg}>
                            {themeOptions.map((opt) => {
                                const active = mode === opt.key;
                                return (
                                    <TouchableOpacity
                                        key={opt.key}
                                        onPress={() => setMode(opt.key)}
                                        style={[styles.segBtn, active && styles.segBtnActive]}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>{opt.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Account */}
                <Text style={styles.sectionHead}>ACCOUNT</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('PersonalInfo' as never)}>
                        <View style={styles.rowIconWrap}><Icon name="user" color="ink2" size="sm" /></View>
                        <View style={{ flex: 1 }}><Text style={styles.rowTitle}>Personal info</Text></View>
                        <Icon name="chevron-right" color="ink3" size="md" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('PrivacySecurity' as never)}>
                        <View style={styles.rowIconWrap}><Icon name="lock" color="ink2" size="sm" /></View>
                        <View style={{ flex: 1 }}><Text style={styles.rowTitle}>Privacy &amp; security</Text></View>
                        <Icon name="chevron-right" color="ink3" size="md" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('HelpSupport' as never)}>
                        <View style={styles.rowIconWrap}><Icon name="help-circle" color="ink2" size="sm" /></View>
                        <View style={{ flex: 1 }}><Text style={styles.rowTitle}>Help &amp; support</Text></View>
                        <Icon name="chevron-right" color="ink3" size="md" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.signOut} onPress={() => setLogoutModalVisible(true)} activeOpacity={0.85}>
                    <Text style={styles.signOutText}>Sign out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Finova AI · v1.0</Text>
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
        headerTitle: { color: c.ink1, fontSize: 15, fontFamily: fontFor('semibold'), letterSpacing: -0.2 },
        content: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },

        profileCard: {
            alignItems: 'center',
            backgroundColor: c.surface,
            borderRadius: 20,
            borderWidth: 1, borderColor: c.border,
            paddingVertical: 22, paddingHorizontal: 20,
            marginTop: 8,
        },
        avatar: {
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: c.accent,
            alignItems: 'center', justifyContent: 'center',
        },
        avatarText: { color: c.accentInk, fontSize: 24, fontFamily: fontFor('bold'), letterSpacing: -0.4 },
        userName: { color: c.ink1, fontSize: 16, fontFamily: fontFor('semibold'), marginTop: 10 },
        userEmail: { color: c.ink3, fontSize: 12, marginTop: 2 },

        sectionHead: {
            color: c.ink3,
            fontSize: 11, fontFamily: fontFor('semibold'), letterSpacing: 1.2,
            marginTop: 12, marginBottom: -4, paddingHorizontal: 4,
        },

        card: {
            backgroundColor: c.surface,
            borderRadius: 16,
            borderWidth: 1, borderColor: c.border,
            paddingHorizontal: 16,
        },
        appearanceRow: {
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 14,
        },
        row: {
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 12,
        },
        rowTitle: { color: c.ink1, fontSize: 14, fontFamily: fontFor('medium') },
        rowSub: { color: c.ink3, fontSize: 12, marginTop: 2 },
        rowIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
        divider: { height: 1, backgroundColor: c.border },

        seg: {
            flexDirection: 'row',
            backgroundColor: c.surfaceAlt,
            borderRadius: 10, padding: 3,
        },
        segBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
        segBtnActive: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
        segBtnText: { color: c.ink2, fontSize: 12, fontFamily: fontFor('medium') },
        segBtnTextActive: { color: c.ink1 },

        signOut: {
            marginTop: 12,
            paddingVertical: 14,
            borderRadius: 12,
            borderWidth: 1, borderColor: c.borderStrong,
            alignItems: 'center',
        },
        signOutText: { color: c.ink1, fontSize: 14, fontFamily: fontFor('semibold') },

        version: { color: c.ink3, fontSize: 11, textAlign: 'center', marginTop: 24 },

        modalOverlay: {
            flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
        },
        modalCard: {
            backgroundColor: c.surface, borderRadius: 20,
            paddingVertical: 24, paddingHorizontal: 20,
            width: '100%',
            borderWidth: 1, borderColor: c.border,
        },
        modalTitle: { color: c.ink1, fontSize: 18, fontFamily: fontFor('bold'), marginBottom: 6 },
        modalMessage: { color: c.ink2, fontSize: 14, lineHeight: 20, marginBottom: 20 },
        modalButtons: { flexDirection: 'row', gap: 10 },
        modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong, alignItems: 'center' },
        modalCancelText: { color: c.ink1, fontSize: 14, fontFamily: fontFor('semibold') },
        modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: c.loss, alignItems: 'center' },
        modalConfirmText: { color: '#FFFFFF', fontSize: 14, fontFamily: fontFor('semibold') },
    });
