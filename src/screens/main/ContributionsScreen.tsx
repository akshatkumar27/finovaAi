import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
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
import { colors, typography, spacing } from '../../constants';
import { MainStackParamList } from '../../navigation/MainTabNavigator';
import { BackButton, ConfirmationModal, SkeletonLoader, AnimatedMascot, Header } from '../../components';
import api from '../../services/api';
import { formatCompactCurrency } from '../../utils';
import { useCurrency } from '../../context/CurrencyContext';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type ContributionsRouteProp = RouteProp<MainStackParamList, 'Contributions'>;

interface ContributionItem {
    id: string;
    paymentNumber: number;
    amount: number;
    totalValue: number;
    status: 'paid' | 'pending' | 'upcoming';
    date: string;
    monthKey?: string; // e.g. "Feb 2026"
    rawDate?: string; // Original date string for comparison
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

    const goalId = route.params?.goalId || '';
    const goalName = route.params?.goalName || 'Goal';
    const monthlyContribution = Math.floor(route.params?.monthlyContribution || 0);
    const targetAmount = route.params?.targetAmount || 0;
    const achieveInMonths = route.params?.achieveInMonths || 12;
    const goalCreatedAt = route.params?.goalCreatedAt || '';
    const contributionStartDate = (() => {
        const dateStr = route.params?.contributionDay;
        if (dateStr) {
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    })();
    const contributionDay = (() => {
        if (contributionStartDate) {
            return contributionStartDate.getDate();
        }
        return 1;
    })();

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [contributions, setContributions] = useState<ContributionItem[]>([]);
    const [totalPaid, setTotalPaid] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContribution, setEditedContribution] = useState(monthlyContribution);
    // State for inline editing of past contributions
    // State for Edit Modal
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedContribution, setSelectedContribution] = useState<ContributionItem | null>(null);
    const [editModalValue, setEditModalValue] = useState<string>('');
    const [editError, setEditError] = useState<string>('');
    const [modalState, setModalState] = useState<ModalState>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
        showCancelButton: true,
        onConfirm: () => { },
    });

    const STEP_AMOUNT = 500;

    // Recalculate months when contribution changes
    const effectiveMonths = editedContribution > 0
        ? Math.ceil(targetAmount / editedContribution)
        : achieveInMonths;

    // Compute estimated completion date based on actual remaining amount.
    // This accounts for partial payments — e.g. paying ₹150 when ₹300 is due
    // means the remaining balance is higher, so the goal takes longer.
    const completionDate = (() => {
        const remaining = Math.max(0, targetAmount - totalPaid);
        const monthsLeft = editedContribution > 0
            ? Math.ceil(remaining / editedContribution)
            : effectiveMonths;
        const base = new Date();
        base.setMonth(base.getMonth() + monthsLeft);
        return base.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    })();

    const handleContributionInputChange = (text: string) => {
        const value = parseInt(text.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(value)) {
            // Clamp: can't exceed original
            setEditedContribution(Math.max(0, Math.min(value, monthlyContribution)));
        } else if (text === '') {
            setEditedContribution(0);
        }
    };

    const handleContributionBlur = () => {
        if (editedContribution < 0) {
            setEditedContribution(0);
        }
    };

    const handleConfirmContribution = () => {
        if (editedContribution < 0) {
            setEditedContribution(0);
        }
        setIsEditing(false);
    };

    // Fetch contributions from API
    useFocusEffect(
        useCallback(() => {
            fetchContributions();
        }, [goalId])
    );

    const fetchContributions = async () => {
        try {
            setIsLoading(true);
            const response = await api.post('/api/contributions/list', {
                goal_id: goalId,
            });
            console.log(response.data);

            // Store total paid from API
            const apiTotal = parseFloat(response.data.total) || 0;
            setTotalPaid(apiTotal);

            // Each paid contribution is its own row
            const rawContributions = response.data.contributions || [];

            // Sort by date ascending
            const sortedContributions = [...rawContributions].sort((a: any, b: any) =>
                new Date(a.contributed_at).getTime() - new Date(b.contributed_at).getTime()
            );

            let runningTotal = 0;
            const paidContributions: ContributionItem[] = sortedContributions.map((item: any, index: number) => {
                const amount = parseFloat(item.amount) || 0;
                runningTotal += amount;
                const date = new Date(item.contributed_at);
                const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                return {
                    id: item.id || `paid-${index + 1}`,
                    paymentNumber: index + 1,
                    amount: amount,
                    totalValue: runningTotal,
                    status: 'paid' as const,
                    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    monthKey: monthKey,
                    rawDate: item.contributed_at || '',
                };
            });

            // Calculate remaining upcoming contributions
            const paidCount = paidContributions.length;
            const remainingCount = Math.max(0, achieveInMonths - paidCount);

            // Use last paid date as base for upcoming dates
            const lastPaidDate = paidCount > 0
                ? new Date(paidContributions[paidCount - 1].rawDate || new Date())
                : new Date();

            const upcomingContributions: ContributionItem[] = Array.from({ length: remainingCount }, (_, index) => {
                const paymentNum = paidCount + index + 1;
                const upcomingDate = new Date(lastPaidDate);

                // If no contributions yet, start from current month (index 0)
                // If contributions exist, start from next month after last payment (index + 1)
                const monthOffset = paidCount === 0 ? index : index + 1;
                upcomingDate.setMonth(upcomingDate.getMonth() + monthOffset);

                const formattedDate = upcomingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const monthKey = upcomingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                return {
                    id: `upcoming-${paymentNum}`,
                    paymentNumber: paymentNum,
                    amount: editedContribution,
                    totalValue: apiTotal + (editedContribution * (index + 1)),
                    status: index === 0 ? 'pending' as const : 'upcoming' as const,
                    date: formattedDate,
                    monthKey: monthKey,
                };
            });

            // Combine paid + upcoming
            setContributions([...paidContributions, ...upcomingContributions]);
        } catch (error) {
            console.error('Failed to fetch contributions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    function getNextPaymentDate(monthsAhead: number): string {
        const date = new Date();
        date.setMonth(date.getMonth() + monthsAhead);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Helper: get the last day of a given month/year
    const getLastDayOfMonth = (year: number, month: number): number => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Helper: get the effective contribution day for a given month/year.
    // Clamps contributionDay to the last day if the month has fewer days.
    // Examples:
    //   contributionDay=31, Feb 2026 (28 days) → 28
    //   contributionDay=31, Feb 2028 (leap, 29 days) → 29
    //   contributionDay=31, Apr (30 days) → 30
    //   contributionDay=31, Jan (31 days) → 31
    //   contributionDay=30, Feb → 28/29
    const getEffectiveDay = (year: number, month: number): number => {
        return Math.min(contributionDay, getLastDayOfMonth(year, month));
    };

    // Core helper: find the earliest due date that hasn't been paid.
    // Walks month-by-month from the contribution start date, checking
    // the paid contributions array for each month. This ensures missed
    // payments from earlier months are never skipped.
    const getNextUnpaidDueDate = (): Date => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // If start date is in the future, that's the next due date
        if (contributionStartDate) {
            const startDateOnly = new Date(
                contributionStartDate.getFullYear(),
                contributionStartDate.getMonth(),
                contributionStartDate.getDate(),
            );
            if (startDateOnly > todayStart) {
                return startDateOnly;
            }
        }

        // Determine the starting month to check
        let startYear: number, startMonth: number;
        if (contributionStartDate) {
            startYear = contributionStartDate.getFullYear();
            startMonth = contributionStartDate.getMonth();
        } else if (goalCreatedAt) {
            const created = new Date(goalCreatedAt);
            startYear = created.getFullYear();
            startMonth = created.getMonth();
        } else {
            startYear = today.getFullYear();
            startMonth = today.getMonth();
        }

        const paidContributions = contributions.filter(c => c.status === 'paid');

        let year = startYear;
        let month = startMonth;

        // Walk month-by-month and find the first unpaid month
        // Safety limit to avoid infinite loop
        for (let i = 0; i < achieveInMonths + 12; i++) {
            const effectiveDay = getEffectiveDay(year, month);
            const dueDate = new Date(year, month, effectiveDay);

            // Check if there's a paid contribution for this month
            const isPaidForMonth = paidContributions.some(c => {
                if (!c.rawDate) return false;
                const paidDate = new Date(c.rawDate);
                return paidDate.getMonth() === month && paidDate.getFullYear() === year;
            });

            if (!isPaidForMonth) {
                return dueDate;
            }

            // Move to next month
            month += 1;
            if (month > 11) {
                month = 0;
                year += 1;
            }
        }

        // Fallback: return the next month's due date
        const effectiveDay = getEffectiveDay(year, month);
        return new Date(year, month, effectiveDay);
    };

    // Calculate days until the next unpaid due date
    const calculateDaysUntilPayment = (): number => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const nextDue = getNextUnpaidDueDate();
        const nextDueStart = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());

        // If due date is today or in the past, return 0 (it's already due/overdue)
        if (nextDueStart <= todayStart) {
            return 0;
        }

        const diffTime = nextDueStart.getTime() - todayStart.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Check payment status based on the next unpaid due date
    const getPaymentStatus = (): { enabled: boolean; hasPaidThisMonth: boolean } => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const nextDue = getNextUnpaidDueDate();
        const nextDueStart = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());

        const paidContributions = contributions.filter(c => c.status === 'paid');

        // If the next unpaid due date is in the future, payment is not due yet
        if (nextDueStart > todayStart) {
            // If there are paid contributions, user is "up to date" (show Contributed ✅)
            // If no contributions yet (new goal, start date in future), show Upcoming ⏰
            const isUpToDate = paidContributions.length > 0;
            return { enabled: false, hasPaidThisMonth: isUpToDate };
        }

        // Due date is today or in the past → payment is due/overdue
        return { enabled: true, hasPaidThisMonth: false };
    };

    const upcomingPayment = contributions.find(c => c.status === 'pending') || contributions.find(c => c.status === 'upcoming');
    const daysUntilPayment = calculateDaysUntilPayment();
    const { enabled: paymentEnabled, hasPaidThisMonth } = getPaymentStatus();

    // Format the overdue/due date (the next unpaid due date)
    const getMissedDateFormatted = (): string => {
        const nextDue = getNextUnpaidDueDate();
        return nextDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Format the next upcoming due date
    const getNextUpcomingDateFormatted = (): string => {
        const nextDue = getNextUnpaidDueDate();
        return nextDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isCurrentMonth = (dateString?: string) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

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

        // Validation
        if (isNaN(newAmount)) {
            setEditError('Please enter a valid amount');
            return;
        }



        if (newAmount > monthlyContribution) {
            setEditError(`Cannot exceed monthly contribution of ${formatCompactCurrency(monthlyContribution, currencySymbol)}`);
            return;
        }

        // Call API
        try {
            setIsSaving(true);
            await api.post('/api/contributions/update', {
                contribution_id: selectedContribution.id,
                amount: newAmount,
                note: 'Updated monthly savings',
            });

            // Success & Refresh
            handleCloseEditModal();
            fetchContributions();
            DeviceEventEmitter.emit('refreshGoals');

            setModalState({
                visible: true,
                type: 'success',
                title: 'Success!',
                message: 'Contribution updated successfully!',
                showCancelButton: false,
                onConfirm: closeModal,
            });

        } catch (error) {
            console.error('Failed to update contribution:', error);
            setModalState({
                visible: true,
                type: 'error',
                title: 'Update Failed',
                message: 'Could not update contribution. Please try again.',
                showCancelButton: false,
                onConfirm: closeModal,
            });
        } finally {
            setIsSaving(false);
        }
    };


    const closeModal = () => {
        setModalState(prev => ({ ...prev, visible: false }));
    };

    const handleSaveContribution = () => {
        if (!paymentEnabled) {
            Toast.show({
                type: 'error',
                text1: 'Not Due Yet',
                text2: 'Your monthly contribution is not due yet.',
            });
            return;
        }

        if (isSaving) return;

        setModalState({
            visible: true,
            type: 'warning',
            title: 'Confirm Savings',
            message: `Are you sure you want to save ${formatCompactCurrency(editedContribution, currencySymbol)} towards your "${goalName}" goal?`,
            showCancelButton: true,
            onConfirm: saveContribution,
        });
    };

    const saveContribution = async () => {
        closeModal();
        try {
            setIsSaving(true);
            await api.post('/api/contributions', {
                goal_id: goalId,
                amount: editedContribution,
                note: 'Monthly savings deposit',
            });
            // Refresh contributions list to update button state
            await fetchContributions();
            DeviceEventEmitter.emit('refreshGoals');
            setModalState({
                visible: true,
                type: 'success',
                title: 'Success!',
                message: 'Your contribution has been saved successfully!',
                showCancelButton: false,
                onConfirm: closeModal,
            });
        } catch (error) {
            console.error('Failed to save contribution:', error);
            setModalState({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to save contribution. Please try again.',
                showCancelButton: false,
                onConfirm: closeModal,
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Only paid contributions are shown in history
    const paidHistory = contributions.filter(c => c.status === 'paid');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            {/* Confirmation Modal */}
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

            {/* Edit Contribution Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCloseEditModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Contribution</Text>
                        <Text style={styles.modalSubtitle}>
                            Enter a new amount for {selectedContribution?.monthKey}
                        </Text>

                        <View style={styles.modalInputContainer}>
                            <Text style={styles.modalCurrencyPrefix}>{currencySymbol}</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editModalValue}
                                onChangeText={(text) => {
                                    setEditModalValue(text);
                                    setEditError('');
                                }}
                                keyboardType="number-pad"
                                autoFocus
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {editError ? (
                            <Text style={styles.modalErrorText}>{editError}</Text>
                        ) : null}

                        <Text style={styles.modalHintText}>
                            Max allowed: {formatCompactCurrency(monthlyContribution, currencySymbol)}
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={handleCloseEditModal}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleSaveEdit}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalButtonTextSave}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


            {/* Header */}
            <Header title={goalName} />

            {isLoading ? (
                <View style={styles.content}>
                    {/* Upcoming Card Skeleton */}
                    <SkeletonLoader
                        height={200}
                        borderRadius={20}
                        style={{ marginBottom: spacing.lg, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginTop: spacing.md }}
                    />

                    {/* Summary Card Skeleton */}
                    <SkeletonLoader
                        height={150}
                        borderRadius={16}
                        style={{ marginBottom: spacing.xl, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    />

                    {/* List Section Title Skeleton */}
                    <SkeletonLoader
                        width={150}
                        height={24}
                        style={{ marginBottom: spacing.md, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    />

                    {/* List Items Skeleton */}
                    {[1, 2, 3].map((key) => (
                        <SkeletonLoader
                            key={key}
                            height={70}
                            borderRadius={12}
                            style={{ marginBottom: spacing.sm, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                        />
                    ))}
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Payment Card - Dynamic based on paid state */}
                    <View style={styles.upcomingCardPulse}>
                        <View style={styles.pulseGlowEffect} />
                        {hasPaidThisMonth ? (
                            <View style={styles.pulseRow}>
                                <View style={styles.pulseLeftCol}>
                                    <View style={[styles.timerBadge, { backgroundColor: 'rgba(34, 197, 94, 0.2)', marginBottom: 8 }]}>
                                        <Text style={styles.timerIcon}>✅</Text>
                                        <Text style={[styles.timerText, { color: '#22c55e' }]}>Contributed</Text>
                                    </View>
                                    <Text style={styles.pulseTitle}>Next Due</Text>
                                    <Text style={styles.pulseSubtitle}>
                                        {getNextUpcomingDateFormatted()}
                                    </Text>
                                </View>
                                <View style={styles.pulseRightCol}>
                                    <Text style={styles.pulseAmount}>
                                        {formatCompactCurrency(contributions.filter(c => c.status === 'paid').slice(-1)[0]?.amount || editedContribution, currencySymbol)}
                                    </Text>
                                    {upcomingPayment && (
                                        <Text style={styles.pulseNextDueText}>
                                            Next: {formatCompactCurrency(editedContribution, currencySymbol)} on {upcomingPayment.date}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ) : (
                            <View>
                                <View style={styles.pulseRow}>
                                    <View style={styles.pulseLeftCol}>
                                        {paymentEnabled ? (
                                            <View style={[styles.timerBadge, { backgroundColor: 'rgba(245, 158, 11, 0.2)', marginBottom: 8 }]}>
                                                <Text style={styles.timerIcon}>⚠️</Text>
                                                <Text style={[styles.timerText, { color: '#f59e0b' }]}>Pending</Text>
                                            </View>
                                        ) : (
                                            <View style={[styles.timerBadge, { marginBottom: 8 }]}>
                                                <Text style={styles.timerIcon}>⏰</Text>
                                                <Text style={styles.timerText}>{daysUntilPayment} {daysUntilPayment === 1 ? 'day' : 'days'} left</Text>
                                            </View>
                                        )}
                                        <Text style={styles.pulseTitle}>{paymentEnabled ? 'Payment Due' : 'Upcoming Due'}</Text>
                                        <Text style={styles.pulseSubtitle}>{paymentEnabled ? getMissedDateFormatted() : getNextUpcomingDateFormatted()}</Text>
                                    </View>

                                    <View style={styles.pulseRightCol}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.pulseAmount}>{formatCompactCurrency(editedContribution, currencySymbol)}</Text>
                                            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} activeOpacity={0.7} style={{ marginLeft: 8, marginTop: -4 }}>
                                                <Text style={styles.editIconBtn}>✎</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {!isEditing && (
                                            <TouchableOpacity
                                                style={[styles.pulsePayBtn, (!paymentEnabled || isSaving) && styles.pulsePayBtnDisabled]}
                                                onPress={handleSaveContribution}
                                            >
                                                {isSaving ? (
                                                    <ActivityIndicator size="small" color={colors.background} />
                                                ) : (
                                                    <Text style={styles.pulsePayBtnText}>
                                                        {paymentEnabled ? 'Pay Now' : 'Not Due'}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                {/* Inline contribution editor */}
                                {isEditing && (
                                    <View style={styles.pulseEditorContainer}>
                                        <View style={styles.contributionInputContainer}>
                                            <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                                            <TextInput
                                                style={styles.contributionInput}
                                                value={editedContribution > 0 ? editedContribution.toString() : ''}
                                                onChangeText={handleContributionInputChange}
                                                onBlur={handleContributionBlur}
                                                keyboardType="number-pad"
                                                selectTextOnFocus
                                                autoFocus
                                            />
                                        </View>
                                        <TouchableOpacity style={styles.pulseConfirmBtn} onPress={handleConfirmContribution}>
                                            <Text style={styles.pulseConfirmBtnText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>



                    <View style={styles.pulseSummaryCard}>
                        <View style={styles.summaryGlowEffect} />
                        {/* Progress Header */}
                        <View style={styles.progressHeader}>
                            <View style={styles.progressTitleGroup}>
                                <View style={styles.progressIconBadge}>
                                    <Text style={styles.progressIcon}>🎯</Text>
                                </View>
                                <Text style={styles.progressLabel}>Goal Progress</Text>
                            </View>
                            <View style={styles.progressPercentBadge}>
                                <Text style={styles.progressPercent}>
                                    {targetAmount > 0 ? Math.min(100, Math.round((totalPaid / targetAmount) * 100)) : 0}%
                                </Text>
                            </View>
                        </View>

                        {/* Progress Bar Container */}
                        <View style={styles.pulseProgressSection}>
                            <View style={styles.progressBarBackground}>
                                <View
                                    style={[
                                        styles.pulseProgressBarFill,
                                        { width: `${targetAmount > 0 ? Math.min(100, (totalPaid / targetAmount) * 100) : 0}%` },
                                    ]}
                                />
                            </View>
                            <View style={styles.progressAmounts}>
                                <Text style={styles.progressSaved}>{formatCompactCurrency(totalPaid, currencySymbol)} saved</Text>
                                <Text style={styles.progressTarget}>Goal: {formatCompactCurrency(targetAmount, currencySymbol)}</Text>
                            </View>
                        </View>

                        <View style={styles.summaryDividerHorizontal} />

                        {/* Stats Details Row */}
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryGlassItem}>
                                <Text style={styles.summaryValue}>{completionDate}</Text>
                                <Text style={styles.summaryLabel}>Completion</Text>
                            </View>
                            <View style={styles.summaryGlassItem}>
                                <Text style={styles.summaryValue}>{formatCompactCurrency(targetAmount, currencySymbol)}</Text>
                                <Text style={styles.summaryLabel}>Target</Text>
                            </View>
                            <View style={styles.summaryGlassItem}>
                                <Text style={[styles.summaryValue, editedContribution !== monthlyContribution && styles.editedValue]}>
                                    {effectiveMonths}
                                </Text>
                                <Text style={styles.summaryLabel}>Months Left</Text>
                            </View>
                            <View style={styles.summaryGlassItem}>
                                <Text style={[styles.summaryValue, editedContribution !== monthlyContribution && styles.editedValue]}>
                                    {formatCompactCurrency(editedContribution, currencySymbol)}
                                </Text>
                                <Text style={styles.summaryLabel}>Monthly</Text>
                            </View>
                        </View>
                    </View>


                    {/* Contribution History */}
                    {paidHistory.length > 0 && (
                        <View style={styles.historySection}>
                            <Text style={styles.sectionTitle}>Contribution History</Text>
                            {paidHistory.map((item) => {
                                const canEdit = isCurrentMonth(item.rawDate);
                                return (
                                    <View key={item.id} style={styles.historyItem}>
                                        <View style={styles.historyDot}>
                                            <Text style={{ fontSize: 16 }}>💳</Text>
                                        </View>
                                        <View style={styles.historyContent}>
                                            <View style={styles.historyRow}>
                                                <Text style={styles.historyMonth}>{item.monthKey}</Text>
                                                <Text style={styles.historyAmount}>{formatCompactCurrency(item.amount, currencySymbol)}</Text>
                                            </View>
                                            <View style={styles.historyRowSub}>
                                                <Text style={styles.historyDate}>{item.date}</Text>
                                                {canEdit && (
                                                    <TouchableOpacity
                                                        onPress={() => handleOpenEditModal(item)}
                                                        style={styles.historyEditBtn}
                                                    >
                                                        <Text style={styles.historyEditBtnText}>Edit</Text>
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
        paddingHorizontal: spacing.lg,
    },
    // Pulse Style Card
    upcomingCardPulse: {
        backgroundColor: '#1a2a3a',
        borderRadius: 20,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: '#2a4a6a',
        marginTop: spacing.md,
        overflow: 'hidden',
        position: 'relative',
    },
    pulseGlowEffect: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        top: -50,
        right: -30,
        zIndex: -1,
    },
    pulseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pulseLeftCol: {
        flex: 1,
        alignItems: 'flex-start',
    },
    pulseRightCol: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '33', // 20% opacity primary color
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    timerIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    timerText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: typography.bold,
    },
    pulseTitle: {
        color: colors.textMuted,
        fontSize: typography.caption,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    pulseSubtitle: {
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
    },
    pulseAmount: {
        color: colors.textPrimary,
        fontSize: 32,
        fontWeight: typography.bold,
        letterSpacing: -1,
    },
    editIconBtn: {
        fontSize: 20,
        color: colors.primary,
        opacity: 0.8,
    },
    pulseNextDueText: {
        color: colors.textMuted,
        fontSize: typography.caption,
        marginTop: 4,
    },
    pulsePayBtn: {
        backgroundColor: '#22c55e',
        paddingVertical: 10,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        marginTop: spacing.sm,
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    pulsePayBtnDisabled: {
        opacity: 0.6,
        shadowOpacity: 0,
        elevation: 0,
    },
    pulsePayBtnText: {
        color: '#fff',
        fontSize: typography.bodySmall,
        fontWeight: typography.bold,
    },
    pulseEditorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    pulseConfirmBtn: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: spacing.xl,
        marginLeft: spacing.md,
    },
    pulseConfirmBtnText: {
        color: colors.background,
        fontSize: typography.bodySmall,
        fontWeight: typography.bold,
    },

    // Sub-Pulse Summary Card
    pulseSummaryCard: {
        backgroundColor: '#1a2a3a',
        borderRadius: 20,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: '#2a4a6a',
        overflow: 'hidden',
        position: 'relative',
    },
    summaryGlowEffect: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        bottom: -40,
        left: -40,
        zIndex: -1,
    },
    summaryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.sm,
    },
    summaryGlassItem: {
        width: '48%',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        marginBottom: spacing.xs,
    },
    summaryValue: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.bold,
        marginBottom: 4,
    },
    summaryLabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
    },
    progressSection: {
        marginBottom: spacing.md,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    progressTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressIconBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    progressIcon: {
        fontSize: 14,
    },
    progressLabel: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.bold,
    },
    progressPercentBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    progressPercent: {
        color: '#22c55e',
        fontSize: typography.bodySmall,
        fontWeight: typography.bold,
    },
    pulseProgressSection: {
        marginBottom: spacing.md,
    },
    progressBarBackground: {
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    pulseProgressBarFill: {
        height: '100%',
        backgroundColor: '#22c55e',
        borderRadius: 6,
    },
    progressAmounts: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    progressSaved: {
        color: '#22c55e',
        fontSize: typography.bodySmall,
        fontWeight: typography.bold,
    },
    progressTarget: {
        color: colors.textSecondary,
        fontSize: typography.caption,
    },
    summaryDividerHorizontal: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginVertical: spacing.lg,
    },
    // History section
    historySection: {
        marginBottom: spacing.xxl,
    },
    sectionTitle: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
        marginBottom: spacing.md,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        backgroundColor: "rgba(255,255,255,0.02)",
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    historyDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        marginRight: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyContent: {
        flex: 1,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    historyRowSub: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyMonth: {
        color: colors.textPrimary,
        fontSize: typography.bodySmall,
        fontWeight: typography.semibold,
    },
    historyAmount: {
        color: '#22c55e',
        fontSize: typography.bodySmall,
        fontWeight: typography.bold,
    },
    historyDate: {
        color: colors.textMuted,
        fontSize: typography.caption,
    },
    historyEditBtn: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary + '60',
    },
    historyEditBtnText: {
        color: colors.primary,
        fontSize: typography.caption,
        fontWeight: typography.semibold,
    },
    // Contribution editor styles
    editableAmount: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    editIcon: {
        fontSize: 16,
    },
    editButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    editButtonText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    editedValue: {
        color: colors.primary,
    },
    editorContainer: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    editorTitle: {
        display: 'none',
    },
    contributionInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "rgba(0,0,0,0.2)",
        borderWidth: 1.5,
        borderColor: colors.primary + '30',
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        flex: 1,
    },
    currencyPrefix: {
        color: colors.primary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
        marginRight: spacing.xs,
    },
    contributionInput: {
        color: colors.textPrimary,
        fontSize: typography.h3,
        fontWeight: typography.bold,
        flex: 1,
        textAlign: 'left',
        paddingVertical: 0,
    },
    editorInfo: {
        display: 'none',
    },
    editorInfoText: {
        display: 'none',
    },
    editorHighlight: {
        display: 'none',
    },
    editorHint: {
        display: 'none',
    },
    confirmButton: {
        display: 'none',
    },
    confirmButtonText: {
        display: 'none',
    },
    inlineEditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inlineEditInput: {
        backgroundColor: colors.inputBackground,
        color: colors.textPrimary,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        width: 80,
        height: 32,
        marginRight: 8,
        fontSize: 14,
        textAlign: 'right',
    },
    inlineEditActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inlineActionButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    inlineActionCancel: {
        backgroundColor: colors.error,
    },
    inlineActionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    editRowButton: {
        marginTop: spacing.md,
        paddingVertical: 8,
        backgroundColor: colors.inputBackground,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editRowButtonText: {
        fontSize: 12,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.cardBackground,
        borderRadius: 20,
        padding: spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalTitle: {
        fontSize: typography.h3,
        fontWeight: typography.bold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    modalSubtitle: {
        fontSize: typography.bodySmall,
        color: colors.textMuted,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    modalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        width: '100%',
    },
    modalCurrencyPrefix: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        marginRight: spacing.sm,
    },
    modalInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        paddingVertical: 0,
    },
    modalErrorText: {
        color: colors.error,
        fontSize: typography.caption,
        marginBottom: spacing.sm,
        alignSelf: 'flex-start',
    },
    modalHintText: {
        color: colors.textMuted,
        fontSize: typography.caption,
        marginBottom: spacing.xl,
        alignSelf: 'flex-start',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonCancel: {
        backgroundColor: colors.inputBackground,
    },
    modalButtonSave: {
        backgroundColor: colors.primary,
    },
    modalButtonTextCancel: {
        color: colors.textSecondary,
        fontWeight: typography.bold,
    },
    modalButtonTextSave: {
        color: '#000',
        fontWeight: typography.bold,
    },
    editButtonIcon: {
        fontSize: 16,
        color: colors.textSecondary,
    },
});
