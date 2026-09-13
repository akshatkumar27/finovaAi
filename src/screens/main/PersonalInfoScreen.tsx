import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { formatCurrency } from '../../utils';
import { api } from '../../services/api';
import { notificationService } from '../../services/NotificationService';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearFinancialData } from '../../store/slices/financialDataSlice';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../theme';
import { Palette } from '../../theme/palette';

interface UserData { name?: string; email?: string; age?: string }

export const PersonalInfoScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const { colors, typography } = useTheme();
    const { currencySymbol } = useCurrency();
    const [user, setUser] = useState<UserData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const financialData = useAppSelector((state) => state.financialData);

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => loadData());
        return unsubscribe;
    }, [navigation]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) setUser(JSON.parse(userData));
        } catch (error) {
            console.error('Error loading personal info:', error);
        } finally { setIsLoading(false); }
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            const fcmToken = await notificationService.getFCMToken();
            if (fcmToken) {
                await api.delete('/api/notifications/unregister-token', { data: { fcm_token: fcmToken } });
            }
            await api.post('/api/user/delete');
            await AsyncStorage.clear();
            dispatch(clearFinancialData());
            setDeleteModalVisible(false);
            Toast.show({ type: 'success', text1: 'Account deleted', text2: 'Your account is gone.' });
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
        } catch (error) {
            console.error('Error deleting account:', error);
            setIsDeleting(false);
            setDeleteModalVisible(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete. Please try again.' });
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    const accountRows = [
        { label: 'Full name', value: user.name || '—' },
        { label: 'Email', value: user.email || '—' },
        { label: 'Age', value: user.age ? `${user.age}` : '—' },
    ];
    const financialRows = [
        { label: 'Monthly income', value: financialData.monthlyIncome ? formatCurrency(financialData.monthlyIncome, currencySymbol) : '—' },
        { label: 'Monthly expenses', value: financialData.monthlyExpenses ? formatCurrency(financialData.monthlyExpenses, currencySymbol) : '—' },
        { label: 'Monthly EMI', value: financialData.monthlyEmi ? formatCurrency(financialData.monthlyEmi, currencySymbol) : '—' },
        { label: 'EMI outstanding', value: financialData.emiOutstanding ? formatCurrency(financialData.emiOutstanding, currencySymbol) : '—' },
        { label: 'Monthly investment', value: financialData.monthlyInvestment ? formatCurrency(financialData.monthlyInvestment, currencySymbol) : '—' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Personal info</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHead}>ACCOUNT</Text>
                <View style={styles.card}>
                    {accountRows.map((row, i) => (
                        <View key={row.label}>
                            <View style={styles.kv}>
                                <Text style={styles.kvKey}>{row.label}</Text>
                                <Text style={styles.kvValue} numberOfLines={1}>{row.value}</Text>
                            </View>
                            {i < accountRows.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                <View style={styles.sectionHeadRow}>
                    <Text style={styles.sectionHead}>FINANCIAL DETAILS</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('EditFinancialDetails')} activeOpacity={0.7}>
                        <Text style={styles.editLink}>Edit</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.card}>
                    {financialRows.map((row, i) => (
                        <View key={row.label}>
                            <View style={styles.kv}>
                                <Text style={styles.kvKey}>{row.label}</Text>
                                <Text style={styles.kvValueMono}>{row.value}</Text>
                            </View>
                            {i < financialRows.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.dangerBtn} onPress={() => setDeleteModalVisible(true)} activeOpacity={0.85}>
                    <Text style={styles.dangerText}>Delete account</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal transparent visible={deleteModalVisible} animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Delete account?</Text>
                        <Text style={styles.modalMessage}>
                            This is permanent. All your data will be removed and can't be recovered.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => setDeleteModalVisible(false)}
                                disabled={isDeleting}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirm}
                                onPress={handleConfirmDelete}
                                disabled={isDeleting}
                                activeOpacity={0.85}
                            >
                                {isDeleting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalConfirmText}>Delete</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

        scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
        sectionHead: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontWeight: t.weightSemibold, marginTop: 8, paddingHorizontal: 2 },
        sectionHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
        editLink: { color: c.accent, fontSize: 13, fontWeight: t.weightMedium },

        card: { backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16 },
        kv: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
        kvKey: { color: c.ink2, fontSize: 13 },
        kvValue: { color: c.ink1, fontSize: 14, fontWeight: t.weightMedium, maxWidth: '60%' },
        kvValueMono: { color: c.ink1, fontSize: 14, fontWeight: t.weightSemibold, fontVariant: ['tabular-nums'] },
        divider: { height: 1, backgroundColor: c.border },

        dangerBtn: {
            marginTop: 20, paddingVertical: 14,
            borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong,
            alignItems: 'center',
        },
        dangerText: { color: c.loss, fontSize: 14, fontWeight: t.weightSemibold },

        modalOverlay: {
            flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
        },
        modalCard: {
            backgroundColor: c.surface, borderRadius: 20,
            paddingVertical: 24, paddingHorizontal: 20, width: '100%',
            borderWidth: 1, borderColor: c.border,
        },
        modalTitle: { color: c.ink1, fontSize: 18, fontWeight: t.weightBold, marginBottom: 6 },
        modalMessage: { color: c.ink2, fontSize: 14, lineHeight: 20, marginBottom: 20 },
        modalButtons: { flexDirection: 'row', gap: 10 },
        modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong, alignItems: 'center' },
        modalCancelText: { color: c.ink1, fontSize: 14, fontWeight: t.weightSemibold },
        modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: c.loss, alignItems: 'center' },
        modalConfirmText: { color: '#FFFFFF', fontSize: 14, fontWeight: t.weightSemibold },
    });
