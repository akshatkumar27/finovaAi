import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Modal,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainTabNavigator';
import { ConfirmationModal, SkeletonLoader, BackButton, Icon, IconName } from '../../components';
import api from '../../services/api';
import { formatCompactCurrency } from '../../utils';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../theme';
import { Palette } from '../../theme/palette';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type ContributionsRouteProp = RouteProp<MainStackParamList, 'Contributions'>;

interface ContributionItem {
    id: string;
    paymentNumber: number;
    amount: number;
    totalValue: number;
    status: 'paid' | 'pending' | 'upcoming';
    date: string;
    monthKey?: string;
    rawDate?: string;
}

interface ModalState {
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    showCancelButton: boolean;
    onConfirm: () => void;
}



export const ContributionsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ContributionsRouteProp>();
    const { currencySymbol } = useCurrency();
    const { colors, typography } = useTheme();

    const goalId = route.params?.goalId || '';
    const goalName = route.params?.goalName || 'Goal';
    const monthlyContribution = Math.floor(route.params?.monthlyContribution || 0);
    const targetAmount = route.params?.targetAmount || 0;
    const achieveInMonths = route.params?.achieveInMonths || 12;
    const goalCreatedAt = route.params?.goalCreatedAt || '';
    const contributionStartDate = (() => {
        const s = route.params?.contributionDay;
        if (!s) return null;
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    })();
    const contributionDay = contributionStartDate ? contributionStartDate.getDate() : 1;

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [contributions, setContributions] = useState<ContributionItem[]>([]);
    const [totalPaid, setTotalPaid] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContribution, setEditedContribution] = useState(monthlyContribution);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedContribution, setSelectedContribution] = useState<ContributionItem | null>(null);
    const [editModalValue, setEditModalValue] = useState<string>('');
    const [editError, setEditError] = useState<string>('');
    const [modalState, setModalState] = useState<ModalState>({
        visible: false, type: 'info', title: '', message: '', showCancelButton: true, onConfirm: () => {},
    });

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const effectiveMonths = editedContribution > 0 ? Math.ceil(targetAmount / editedContribution) : achieveInMonths;
    const completionDate = (() => {
        const remaining = Math.max(0, targetAmount - totalPaid);
        const monthsLeft = editedContribution > 0 ? Math.ceil(remaining / editedContribution) : effectiveMonths;
        const base = new Date();
        base.setMonth(base.getMonth() + monthsLeft);
        return base.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    })();

    const handleContributionInputChange = (text: string) => {
        const value = parseInt(text.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(value)) setEditedContribution(Math.max(0, Math.min(value, monthlyContribution)));
        else if (text === '') setEditedContribution(0);
    };

    useFocusEffect(useCallback(() => { fetchContributions(); /* eslint-disable-next-line */ }, [goalId]));

    const fetchContributions = async () => {
        try {
            setIsLoading(true);
            const response = await api.post('/api/contributions/list', { goal_id: goalId });
            const apiTotal = parseFloat(response.data.total) || 0;
            setTotalPaid(apiTotal);

            const raw = response.data.contributions || [];
            const sorted = [...raw].sort((a: any, b: any) => new Date(a.contributed_at).getTime() - new Date(b.contributed_at).getTime());

            let runningTotal = 0;
            const paidContributions: ContributionItem[] = sorted.map((item: any, index: number) => {
                const amount = parseFloat(item.amount) || 0;
                runningTotal += amount;
                const date = new Date(item.contributed_at);
                return {
                    id: item.id || `paid-${index + 1}`,
                    paymentNumber: index + 1,
                    amount,
                    totalValue: runningTotal,
                    status: 'paid' as const,
                    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    monthKey: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    rawDate: item.contributed_at || '',
                };
            });

            const paidCount = paidContributions.length;
            const remainingCount = Math.max(0, achieveInMonths - paidCount);
            const lastPaidDate = paidCount > 0 ? new Date(paidContributions[paidCount - 1].rawDate || new Date()) : new Date();

            const upcomingContributions: ContributionItem[] = Array.from({ length: remainingCount }, (_, index) => {
                const paymentNum = paidCount + index + 1;
                const upcomingDate = new Date(lastPaidDate);
                const monthOffset = paidCount === 0 ? index : index + 1;
                upcomingDate.setMonth(upcomingDate.getMonth() + monthOffset);
                return {
                    id: `upcoming-${paymentNum}`,
                    paymentNumber: paymentNum,
                    amount: editedContribution,
                    totalValue: apiTotal + editedContribution * (index + 1),
                    status: index === 0 ? 'pending' as const : 'upcoming' as const,
                    date: upcomingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    monthKey: upcomingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                };
            });

            setContributions([...paidContributions, ...upcomingContributions]);
        } catch (error) {
            console.error('Failed to fetch contributions:', error);
        } finally { setIsLoading(false); }
    };

    // ── Payment status ─────────────────────────────────────────────
    const getLastDayOfMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getEffectiveDay = (year: number, month: number) => Math.min(contributionDay, getLastDayOfMonth(year, month));

    const getNextUnpaidDueDate = (): Date => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (contributionStartDate) {
            const startOnly = new Date(contributionStartDate.getFullYear(), contributionStartDate.getMonth(), contributionStartDate.getDate());
            if (startOnly > todayStart) return startOnly;
        }
        let startYear: number, startMonth: number;
        if (contributionStartDate) { startYear = contributionStartDate.getFullYear(); startMonth = contributionStartDate.getMonth(); }
        else if (goalCreatedAt) { const c = new Date(goalCreatedAt); startYear = c.getFullYear(); startMonth = c.getMonth(); }
        else { startYear = today.getFullYear(); startMonth = today.getMonth(); }
        const paid = contributions.filter(c => c.status === 'paid');
        let year = startYear;
        let month = startMonth;
        for (let i = 0; i < achieveInMonths + 12; i++) {
            const day = getEffectiveDay(year, month);
            const dueDate = new Date(year, month, day);
            const isPaidForMonth = paid.some(c => {
                if (!c.rawDate) return false;
                const pd = new Date(c.rawDate);
                return pd.getMonth() === month && pd.getFullYear() === year;
            });
            if (!isPaidForMonth) return dueDate;
            month += 1;
            if (month > 11) { month = 0; year += 1; }
        }
        return new Date(year, month, getEffectiveDay(year, month));
    };

    const calculateDaysUntilPayment = () => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const nextDue = getNextUnpaidDueDate();
        const nextDueStart = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());
        if (nextDueStart <= todayStart) return 0;
        return Math.ceil((nextDueStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getPaymentStatus = () => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const nextDue = getNextUnpaidDueDate();
        const nextDueStart = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());
        const paid = contributions.filter(c => c.status === 'paid');
        if (nextDueStart > todayStart) return { enabled: false, hasPaidThisMonth: paid.length > 0 };
        return { enabled: true, hasPaidThisMonth: false };
    };

    const upcomingPayment = contributions.find(c => c.status === 'pending') || contributions.find(c => c.status === 'upcoming');
    const daysUntilPayment = calculateDaysUntilPayment();
    const { enabled: paymentEnabled, hasPaidThisMonth } = getPaymentStatus();
    const getNextDueFormatted = () => getNextUnpaidDueDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const isCurrentMonth = (dateString?: string) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        const t = new Date();
        return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
    };

    const closeModal = () => setModalState((p) => ({ ...p, visible: false }));

    const handleOpenEditModal = (item: ContributionItem) => {
        setSelectedContribution(item);
        setEditModalValue(Math.floor(item.amount).toString());
        setEditError('');
        setEditModalVisible(true);
    };
    const handleCloseEditModal = () => {
        setEditModalVisible(false);
        setSelectedContribution(null);
        setEditModalValue('');
        setEditError('');
    };

    const handleSaveEdit = async () => {
        if (!selectedContribution) return;
        const newAmount = parseFloat(editModalValue);
        if (isNaN(newAmount)) { setEditError('Enter a valid amount'); return; }
        if (newAmount > monthlyContribution) {
            setEditError(`Can't exceed ${formatCompactCurrency(monthlyContribution, currencySymbol)}`);
            return;
        }
        try {
            setIsSaving(true);
            await api.post('/api/contributions/update', {
                contribution_id: selectedContribution.id,
                amount: newAmount,
                note: 'Updated monthly savings',
            });
            handleCloseEditModal();
            fetchContributions();
            DeviceEventEmitter.emit('refreshGoals');
            setModalState({ visible: true, type: 'success', title: 'Updated', message: 'Contribution updated.', showCancelButton: false, onConfirm: closeModal });
        } catch (error) {
            console.error('Failed to update contribution:', error);
            setModalState({ visible: true, type: 'error', title: 'Update failed', message: 'Could not update. Try again.', showCancelButton: false, onConfirm: closeModal });
        } finally { setIsSaving(false); }
    };

    const handleSaveContribution = () => {
        if (!paymentEnabled) { Toast.show({ type: 'error', text1: 'Not due yet', text2: 'This contribution isn\'t due yet.' }); return; }
        if (isSaving) return;
        setModalState({
            visible: true, type: 'warning', title: 'Confirm payment',
            message: `Save ${formatCompactCurrency(editedContribution, currencySymbol)} toward "${goalName}"?`,
            showCancelButton: true, onConfirm: saveContribution,
        });
    };

    const saveContribution = async () => {
        closeModal();
        try {
            setIsSaving(true);
            await api.post('/api/contributions', { goal_id: goalId, amount: editedContribution, note: 'Monthly savings deposit' });
            await fetchContributions();
            DeviceEventEmitter.emit('refreshGoals');
            setModalState({ visible: true, type: 'success', title: 'Saved', message: 'Contribution recorded.', showCancelButton: false, onConfirm: closeModal });
        } catch (error) {
            console.error('Failed to save contribution:', error);
            setModalState({ visible: true, type: 'error', title: 'Error', message: 'Failed to save. Try again.', showCancelButton: false, onConfirm: closeModal });
        } finally { setIsSaving(false); }
    };

    const paidHistory = contributions.filter((c) => c.status === 'paid');
    const progressPct = targetAmount > 0 ? Math.min(100, Math.round((totalPaid / targetAmount) * 100)) : 0;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ConfirmationModal
                visible={modalState.visible}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                showCancelButton={modalState.showCancelButton}
                confirmText={modalState.showCancelButton ? 'Yes' : 'OK'}
                cancelText="No"
                onConfirm={modalState.onConfirm}
                onCancel={closeModal}
            />

            {/* Edit contribution modal */}
            <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={handleCloseEditModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Edit contribution</Text>
                        <Text style={styles.modalSub}>Update amount for {selectedContribution?.monthKey}</Text>

                        <View style={styles.modalInputRow}>
                            <Text style={styles.modalSymbol}>{currencySymbol}</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editModalValue}
                                onChangeText={(text) => { setEditModalValue(text); setEditError(''); }}
                                keyboardType="number-pad"
                                autoFocus
                                placeholder="0"
                                placeholderTextColor={colors.ink3}
                            />
                        </View>
                        {editError ? <Text style={styles.modalErrorText}>{editError}</Text> : null}
                        <Text style={styles.modalHint}>Max {formatCompactCurrency(monthlyContribution, currencySymbol)}</Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancel} onPress={handleCloseEditModal}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirm} onPress={handleSaveEdit}>
                                {isSaving ? <ActivityIndicator color={colors.accentInk} /> : <Text style={styles.modalConfirmText}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle} numberOfLines={1}>{goalName}</Text>
                <View style={{ width: 34 }} />
            </View>

            {isLoading ? (
                <View style={styles.scroll}>
                    <SkeletonLoader height={140} borderRadius={20} style={{ marginBottom: 14, backgroundColor: colors.surfaceAlt }} />
                    <SkeletonLoader height={180} borderRadius={20} style={{ marginBottom: 14, backgroundColor: colors.surfaceAlt }} />
                    <SkeletonLoader height={22} width={160} style={{ marginBottom: 12, backgroundColor: colors.surfaceAlt }} />
                    {[1, 2, 3].map((k) => (
                        <SkeletonLoader key={k} height={64} borderRadius={12} style={{ marginBottom: 8, backgroundColor: colors.surfaceAlt }} />
                    ))}
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Payment card */}
                    <View style={styles.paymentCard}>
                        {hasPaidThisMonth ? (
                            <View style={styles.paymentRow}>
                                <View style={{ flex: 1 }}>
                                    <View style={[styles.badge, styles.badgeGain]}>
                                        <Icon name="check" color="gain" size="sm" />
                                        <Text style={[styles.badgeText, { color: colors.gain }]}>Contributed</Text>
                                    </View>
                                    <Text style={styles.paymentTitle}>Next due</Text>
                                    <Text style={styles.paymentSub}>{getNextDueFormatted()}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.amountBig}>
                                        {formatCompactCurrency(contributions.filter(c => c.status === 'paid').slice(-1)[0]?.amount || editedContribution, currencySymbol)}
                                    </Text>
                                    {upcomingPayment && (
                                        <Text style={styles.paymentHint}>
                                            Next: {formatCompactCurrency(editedContribution, currencySymbol)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ) : (
                            <View>
                                <View style={styles.paymentRow}>
                                    <View style={{ flex: 1 }}>
                                        {paymentEnabled ? (
                                            <View style={[styles.badge, styles.badgeWarn]}>
                                                <Icon name="alert-triangle" color="warn" size="sm" />
                                                <Text style={[styles.badgeText, { color: colors.warn }]}>Pending</Text>
                                            </View>
                                        ) : (
                                            <View style={[styles.badge, styles.badgeNeutral]}>
                                                <Icon name="clock" color="ink2" size="sm" />
                                                <Text style={[styles.badgeText, { color: colors.ink2 }]}>{daysUntilPayment} {daysUntilPayment === 1 ? 'day' : 'days'} left</Text>
                                            </View>
                                        )}
                                        <Text style={styles.paymentTitle}>{paymentEnabled ? 'Payment due' : 'Upcoming due'}</Text>
                                        <Text style={styles.paymentSub}>{getNextDueFormatted()}</Text>
                                    </View>

                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.amountBig}>{formatCompactCurrency(editedContribution, currencySymbol)}</Text>
                                            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} activeOpacity={0.7} style={{ marginLeft: 8, marginTop: -4 }}>
                                                <Icon name="pencil" color="ink3" size="md" />
                                            </TouchableOpacity>
                                        </View>
                                        {!isEditing && (
                                            <TouchableOpacity
                                                style={[styles.payBtn, (!paymentEnabled || isSaving) && styles.payBtnDisabled]}
                                                onPress={handleSaveContribution}
                                                disabled={!paymentEnabled || isSaving}
                                            >
                                                {isSaving ? <ActivityIndicator color={colors.accentInk} /> : <Text style={styles.payBtnText}>{paymentEnabled ? 'Pay now' : 'Not due'}</Text>}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                {isEditing && (
                                    <View style={styles.editorRow}>
                                        <View style={styles.editorInput}>
                                            <Text style={styles.editorSymbol}>{currencySymbol}</Text>
                                            <TextInput
                                                style={styles.editorField}
                                                value={editedContribution > 0 ? editedContribution.toString() : ''}
                                                onChangeText={handleContributionInputChange}
                                                keyboardType="number-pad"
                                                selectTextOnFocus
                                                autoFocus
                                            />
                                        </View>
                                        <TouchableOpacity style={styles.editorDone} onPress={() => setIsEditing(false)}>
                                            <Text style={styles.editorDoneText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Progress summary */}
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>GOAL PROGRESS</Text>
                            <View style={styles.progressPct}><Text style={styles.progressPctText}>{progressPct}%</Text></View>
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                        </View>
                        <View style={styles.progressAmounts}>
                            <Text style={styles.progressSaved}>{formatCompactCurrency(totalPaid, currencySymbol)} saved</Text>
                            <Text style={styles.progressTarget}>of {formatCompactCurrency(targetAmount, currencySymbol)}</Text>
                        </View>

                        <View style={styles.dividerH} />

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{completionDate}</Text>
                                <Text style={styles.statLabel}>Completion</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{formatCompactCurrency(targetAmount, currencySymbol)}</Text>
                                <Text style={styles.statLabel}>Target</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, editedContribution !== monthlyContribution && { color: colors.accent }]}>{effectiveMonths}</Text>
                                <Text style={styles.statLabel}>Months left</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, editedContribution !== monthlyContribution && { color: colors.accent }]}>
                                    {formatCompactCurrency(editedContribution, currencySymbol)}
                                </Text>
                                <Text style={styles.statLabel}>Monthly</Text>
                            </View>
                        </View>
                    </View>

                    {/* History */}
                    {paidHistory.length > 0 && (
                        <View>
                            <Text style={styles.sectionHead}>CONTRIBUTION HISTORY</Text>
                            {paidHistory.map((item) => {
                                const canEdit = isCurrentMonth(item.rawDate);
                                return (
                                    <View key={item.id} style={styles.historyCard}>
                                        <View style={styles.historyIcon}>
                                            <Icon name="check" color="gain" size="md" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.historyTopRow}>
                                                <Text style={styles.historyMonth}>{item.monthKey}</Text>
                                                <Text style={styles.historyAmount}>+{formatCompactCurrency(item.amount, currencySymbol)}</Text>
                                            </View>
                                            <View style={styles.historyBottomRow}>
                                                <Text style={styles.historyDate}>{item.date}</Text>
                                                {canEdit && (
                                                    <TouchableOpacity onPress={() => handleOpenEditModal(item)}>
                                                        <Text style={styles.historyEdit}>Edit</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            )}
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
        headerTitle: { color: c.ink1, fontSize: 15, fontWeight: t.weightSemibold, flex: 1, textAlign: 'center', marginHorizontal: 10 },

        scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },

        // Payment card
        paymentCard: {
            backgroundColor: c.surface, borderRadius: 20,
            borderWidth: 1, borderColor: c.border, padding: 18,
            marginBottom: 14,
        },
        paymentRow: { flexDirection: 'row', alignItems: 'flex-start' },
        badge: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start',
            marginBottom: 8,
        },
        badgeGain: { backgroundColor: c.gainSoft },
        badgeWarn: { backgroundColor: c.warnSoft },
        badgeNeutral: { backgroundColor: c.surfaceAlt },
        badgeText: { fontSize: 12, fontWeight: t.weightSemibold },

        paymentTitle: { color: c.ink1, fontSize: 15, fontWeight: t.weightSemibold, marginTop: 2 },
        paymentSub: { color: c.ink3, fontSize: 12, marginTop: 2 },

        amountBig: { color: c.ink1, fontSize: 22, fontWeight: t.weightBold, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
        paymentHint: { color: c.ink3, fontSize: 11, marginTop: 4 },
        editIcon: { color: c.ink3, fontSize: 18 },

        payBtn: {
            backgroundColor: c.accent, borderRadius: 999,
            paddingHorizontal: 18, paddingVertical: 8, marginTop: 8, minHeight: 34,
            alignItems: 'center', justifyContent: 'center',
        },
        payBtnDisabled: { backgroundColor: c.surfaceAlt },
        payBtnText: { color: c.accentInk, fontSize: 13, fontWeight: t.weightSemibold },

        editorRow: {
            flexDirection: 'row', gap: 10, marginTop: 12,
            alignItems: 'center',
        },
        editorInput: {
            flex: 1, flexDirection: 'row', alignItems: 'center',
            backgroundColor: c.surfaceAlt, borderRadius: 12,
            paddingHorizontal: 14, minHeight: 44,
        },
        editorSymbol: { color: c.ink1, fontSize: 16, fontWeight: t.weightSemibold, marginRight: 4 },
        editorField: { flex: 1, color: c.ink1, fontSize: 16, fontVariant: ['tabular-nums'], padding: 0 },
        editorDone: { backgroundColor: c.accent, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
        editorDoneText: { color: c.accentInk, fontSize: 13, fontWeight: t.weightSemibold },

        // Progress card
        progressCard: {
            backgroundColor: c.surface, borderRadius: 20,
            borderWidth: 1, borderColor: c.border, padding: 18,
            marginBottom: 14,
        },
        progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
        progressLabel: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontWeight: t.weightSemibold },
        progressPct: { backgroundColor: c.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
        progressPctText: { color: c.accent, fontSize: 12, fontWeight: t.weightSemibold, fontVariant: ['tabular-nums'] },
        progressTrack: { height: 8, borderRadius: 999, backgroundColor: c.surfaceAlt, overflow: 'hidden' },
        progressFill: { height: '100%', borderRadius: 999, backgroundColor: c.accent },
        progressAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
        progressSaved: { color: c.ink1, fontSize: 13, fontWeight: t.weightSemibold, fontVariant: ['tabular-nums'] },
        progressTarget: { color: c.ink3, fontSize: 12 },
        dividerH: { height: 1, backgroundColor: c.border, marginVertical: 16 },

        statsRow: { flexDirection: 'row', flexWrap: 'wrap' },
        statItem: { width: '50%', marginBottom: 12 },
        statValue: { color: c.ink1, fontSize: 15, fontWeight: t.weightSemibold, fontVariant: ['tabular-nums'] },
        statLabel: { color: c.ink3, fontSize: 11, letterSpacing: 0.2, marginTop: 2 },

        // History
        sectionHead: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontWeight: t.weightSemibold, marginTop: 6, marginBottom: 10, paddingHorizontal: 2 },
        historyCard: {
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: c.surface, borderRadius: 14,
            borderWidth: 1, borderColor: c.border,
            padding: 12, marginBottom: 8,
        },
        historyIcon: {
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: c.gainSoft, alignItems: 'center', justifyContent: 'center',
        },
        historyTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        historyBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
        historyMonth: { color: c.ink1, fontSize: 14, fontWeight: t.weightSemibold },
        historyAmount: { color: c.gain, fontSize: 14, fontWeight: t.weightSemibold, fontVariant: ['tabular-nums'] },
        historyDate: { color: c.ink3, fontSize: 12 },
        historyEdit: { color: c.accent, fontSize: 12, fontWeight: t.weightMedium },

        // Modal
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
        modalCard: { backgroundColor: c.surface, borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: c.border },
        modalTitle: { color: c.ink1, fontSize: 18, fontWeight: t.weightBold, letterSpacing: -0.3 },
        modalSub: { color: c.ink2, fontSize: 13, marginTop: 4, marginBottom: 16 },
        modalInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surfaceAlt, borderRadius: 12, paddingHorizontal: 16, minHeight: 52 },
        modalSymbol: { color: c.ink1, fontSize: 20, fontWeight: t.weightBold, marginRight: 4 },
        modalInput: { flex: 1, color: c.ink1, fontSize: 20, fontWeight: t.weightBold, fontVariant: ['tabular-nums'], padding: 0 },
        modalErrorText: { color: c.loss, fontSize: 12, marginTop: 8 },
        modalHint: { color: c.ink3, fontSize: 12, marginTop: 8 },
        modalButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
        modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong, alignItems: 'center' },
        modalCancelText: { color: c.ink1, fontSize: 14, fontWeight: t.weightSemibold },
        modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center' },
        modalConfirmText: { color: c.accentInk, fontSize: 14, fontWeight: t.weightSemibold },
    });
