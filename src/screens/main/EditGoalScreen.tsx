import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Modal,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { toast } from 'sonner-native';
import { toastError } from '../../utils/toastError';
import { formatMoney } from '../../utils/formatMoney';
import { Button, BackButton, Icon } from '../../components';
import { MainStackParamList } from '../../navigation/MainTabNavigator';
import { api } from '../../services';
import { formatNumberInput } from '../../utils/formatNumber';
import { parseISODate } from '../../utils/parseISODate';
import { useAppSelector } from '../../store/hooks';
import { useTheme, fontFor } from '../../theme';
import { Palette } from '../../theme/palette';
import { formatDate } from '../../utils/formatDate';

const DURATION_OPTIONS = [
    { label: '6 mo', value: 6 },
    { label: '1 yr', value: 12 },
    { label: '2 yr', value: 24 },
    { label: '3 yr', value: 36 },
    { label: '5 yr', value: 60 },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ordinal = (d: number) => (d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th');

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type EditGoalRouteProp = RouteProp<MainStackParamList, 'EditGoal'>;

const sanitize = (val: number | string | undefined, fallback: string) => {
    if (val === undefined || val === null) return fallback;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return formatNumberInput(Math.round(num).toString());
};

export const EditGoalScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<EditGoalRouteProp>();
    const currencySymbol = useAppSelector((state) => state.settings.appCurrency);
    const { colors, typography } = useTheme();

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const goalId = route.params?.goalId;
    const savedAmount = route.params?.savedAmount || 0;
    const availableForNewGoals = route.params?.availableForNewGoals || 0;
    const initialMonthlyContribution = parseFloat(route.params?.monthlyContribution?.toString() || '0');

    const [name, setName] = useState(route.params?.name || 'Emergency fund');
    const [target, setTarget] = useState(sanitize(route.params?.target, '5000'));
    const [selectedDuration, setSelectedDuration] = useState<number | 'custom'>('custom');
    const [customMonths, setCustomMonths] = useState(route.params?.achieveIn?.toString() || '24');
    const [monthlyContribution, setMonthlyContribution] = useState(sanitize(route.params?.monthlyContribution, '500'));
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [targetError, setTargetError] = useState<string | null>(null);
    const [monthlyContributionError, setMonthlyContributionError] = useState<string | null>(null);
    const [isContributionManuallyEdited, setIsContributionManuallyEdited] = useState(false);

    const [contributionDay, setContributionDay] = useState(() => {
        const s = route.params?.contributionDay;
        const parsed = s ? parseISODate(s) : null;
        return parsed ? parsed.getDate() : new Date().getDate();
    });
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const s = route.params?.contributionDay;
        const parsed = s ? parseISODate(s) : null;
        return parsed ? parsed.getMonth() : new Date().getMonth();
    });
    const [selectedYear, setSelectedYear] = useState(() => {
        const s = route.params?.contributionDay;
        const parsed = s ? parseISODate(s) : null;
        return parsed ? parsed.getFullYear() : new Date().getFullYear();
    });
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

    const initialName = useRef(route.params?.name || 'Emergency fund');
    const initialTarget = useRef(sanitize(route.params?.target, '5000'));
    const initialContribution = useRef(sanitize(route.params?.monthlyContribution, '500'));
    const initialAchieveIn = useRef(parseInt(route.params?.achieveIn?.toString() || '0'));
    const initialContributionDay = useRef((() => {
        const s = route.params?.contributionDay;
        const parsed = s ? parseISODate(s) : null;
        return parsed ? parsed.getDate() : 1;
    })());

    const achieveInMonths = selectedDuration === 'custom' ? (parseInt(customMonths) || 0) : selectedDuration;
    const targetAmount = parseInt(target.replace(/,/g, '')) || 0;
    const contributionAmount = parseInt(monthlyContribution.replace(/,/g, '')) || 0;
    const netChange = contributionAmount - initialMonthlyContribution;
    const isBudgetExceeded = netChange > availableForNewGoals;

    const hasChanges =
        name !== initialName.current ||
        target !== initialTarget.current ||
        monthlyContribution !== initialContribution.current ||
        achieveInMonths !== initialAchieveIn.current ||
        contributionDay !== initialContributionDay.current;

    const isSaveDisabled = isLoading || !!targetError || !!monthlyContributionError || isBudgetExceeded || !hasChanges;

    useEffect(() => {
        const initialMonths = parseInt(route.params?.achieveIn?.toString() || '0');
        if (initialMonths > 0) {
            const matched = DURATION_OPTIONS.find((o) => o.value === initialMonths);
            if (matched) { setSelectedDuration(matched.value); setCustomMonths(''); }
            else { setSelectedDuration('custom'); setCustomMonths(initialMonths.toString()); }
        }
    }, [route.params?.achieveIn]);

    useEffect(() => {
        if (!isContributionManuallyEdited && targetAmount > 0 && achieveInMonths > 0) {
            const calc = Math.ceil(targetAmount / achieveInMonths);
            setMonthlyContribution(formatNumberInput(calc.toString()));
            if (monthlyContributionError) setMonthlyContributionError(null);
        }
    }, [targetAmount, achieveInMonths, isContributionManuallyEdited]);

    const handleTargetChange = (text: string) => {
        const formatted = formatNumberInput(text);
        setTarget(formatted);
        const newTarget = parseInt(formatted.replace(/,/g, '')) || 0;
        if (newTarget > 0 && newTarget < savedAmount) {
            setTargetError(`Target can't be less than saved (${formatMoney(savedAmount)}).`);
        } else { setTargetError(null); }
        if (newTarget > 0 && contributionAmount > newTarget) {
            setMonthlyContributionError('Contribution exceeds target.');
        } else if (monthlyContributionError === 'Contribution exceeds target.') {
            setMonthlyContributionError(null);
        }
    };

    const handleContributionChange = (text: string) => {
        const formatted = formatNumberInput(text);
        setMonthlyContribution(formatted);
        setIsContributionManuallyEdited(true);
        const newMonthly = parseInt(formatted.replace(/,/g, '')) || 0;
        if (targetAmount > 0 && newMonthly > targetAmount) {
            setMonthlyContributionError('Contribution exceeds target.');
        } else { setMonthlyContributionError(null); }
        if (newMonthly > 0 && targetAmount > 0) {
            const months = Math.ceil(targetAmount / newMonthly);
            if (months > 0 && months <= 600) {
                setSelectedDuration('custom');
                setCustomMonths(months.toString());
            }
        }
    };

    // ── Calendar helpers ──────────────────────────────────────────
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    const maxMonth = todayMonth + 1 > 11 ? 0 : todayMonth + 1;
    const maxYear = todayMonth + 1 > 11 ? todayYear + 1 : todayYear;
    const canGoNext = !(calendarMonth === maxMonth && calendarYear === maxYear);
    const canGoPrev = !(calendarMonth === todayMonth && calendarYear === todayYear);
    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();
    const isDateDisabled = (day: number, month: number, year: number) => {
        const d = new Date(year, month, day);
        const t = new Date(todayYear, todayMonth, todayDate);
        return d < t;
    };
    const handleCalendarPrev = () => {
        if (!canGoPrev) return;
        if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
        else { setCalendarMonth(calendarMonth - 1); }
    };
    const handleCalendarNext = () => {
        if (!canGoNext) return;
        if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
        else { setCalendarMonth(calendarMonth + 1); }
    };
    const handleDateSelect = (day: number) => {
        setContributionDay(day);
        setSelectedMonth(calendarMonth);
        setSelectedYear(calendarYear);
        setCalendarVisible(false);
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
        const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
        const rows: React.ReactNode[] = [];
        rows.push(
            <View key="wk" style={styles.calWeek}>
                {WEEKDAYS.map((d) => <Text key={d} style={styles.calWeekDay}>{d}</Text>)}
            </View>,
        );
        let cells: React.ReactNode[] = [];
        for (let i = 0; i < firstDay; i++) cells.push(<View key={`e-${i}`} style={styles.calCell} />);
        for (let day = 1; day <= daysInMonth; day++) {
            const disabled = isDateDisabled(day, calendarMonth, calendarYear);
            const selected = day === contributionDay && calendarMonth === selectedMonth && calendarYear === selectedYear;
            cells.push(
                <TouchableOpacity
                    key={day}
                    style={styles.calCell}
                    onPress={() => !disabled && handleDateSelect(day)}
                    disabled={disabled}
                    activeOpacity={0.6}
                >
                    <View style={[styles.calDay, selected && styles.calDaySelected, disabled && styles.calDayDisabled]}>
                        <Text style={[styles.calDayText, selected && styles.calDayTextSelected, disabled && styles.calDayTextDisabled]}>{day}</Text>
                    </View>
                </TouchableOpacity>,
            );
            if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
                while (cells.length < 7) cells.push(<View key={`p-${cells.length}`} style={styles.calCell} />);
                rows.push(<View key={`r-${day}`} style={styles.calWeek}>{cells}</View>);
                cells = [];
            }
        }
        return rows;
    };

    const handleSave = async () => {
        if (!goalId) return;
        let ok = true;
        if (targetAmount <= 0 || targetAmount < savedAmount) {
            setTargetError(`Target can't be less than saved (${formatMoney(savedAmount)}).`);
            ok = false;
        }
        if (contributionAmount <= 0) { setMonthlyContributionError('Enter a valid amount.'); ok = false; }
        else if (contributionAmount > targetAmount) { setMonthlyContributionError('Contribution exceeds target.'); ok = false; }
        if (netChange > availableForNewGoals) {
            toast.error('Budget exceeded', { description: `Only ${formatMoney(availableForNewGoals)} available for increases.` });
            ok = false;
        }
        if (!ok) return;
        setIsLoading(true);
        try {
            const startDate = new Date(selectedYear, selectedMonth, contributionDay);
            const yyyy = startDate.getFullYear();
            const mm = String(startDate.getMonth() + 1).padStart(2, '0');
            const dd = String(startDate.getDate()).padStart(2, '0');
            const contributionStartDate = `${yyyy}-${mm}-${dd}`;
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const payload = {
                name,
                target_amount: targetAmount,
                achieve_in_months: achieveInMonths,
                monthly_contribution: contributionAmount,
                contribution_start_date: contributionStartDate,
                timezone,
            };
            const response = await api.put(`/api/goals/${goalId}`, payload);
            if (response.data.success) {
                DeviceEventEmitter.emit('refreshGoals');
                toast.success('Saved', { description: 'Goal updated.' });
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error updating goal:', error);
            toastError(error, { context: 'Update failed' });
        } finally { setIsLoading(false); }
    };

    const confirmDelete = async () => {
        if (!goalId) return;
        setIsDeleting(true);
        try {
            const response = await api.delete(`/api/goals/${goalId}`);
            if (response.data.success) {
                DeviceEventEmitter.emit('refreshGoals');
                setShowDeleteModal(false);
                toast.success('Deleted', { description: 'Goal removed.' });
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
            toastError(error, { context: 'Delete failed' });
        } finally { setIsDeleting(false); }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Edit goal</Text>
                <TouchableOpacity style={styles.trashBtn} onPress={() => setShowDeleteModal(true)} disabled={isLoading} activeOpacity={0.7}>
                    <Icon name="trash-2" color="loss" size="md" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>GOAL NAME</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Goal name"
                        placeholderTextColor={colors.ink3}
                    />

                    <Text style={styles.label}>GOAL AMOUNT</Text>
                    <View style={[styles.moneyInput, !!targetError && styles.errorField]}>
                        <Text style={styles.moneySymbol}>{currencySymbol}</Text>
                        <TextInput
                            style={styles.moneyText}
                            value={target}
                            onChangeText={handleTargetChange}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={colors.ink3}
                        />
                    </View>
                    {!!targetError && <Text style={styles.errorText}>{targetError}</Text>}

                    <Text style={styles.label}>ACHIEVE IN</Text>
                    <View style={styles.chipRow}>
                        {DURATION_OPTIONS.map((option) => {
                            const active = selectedDuration === option.value;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => { setSelectedDuration(option.value); setCustomMonths(''); setIsContributionManuallyEdited(false); }}
                                    activeOpacity={0.85}
                                >
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity
                            style={[styles.chip, selectedDuration === 'custom' && styles.chipActive]}
                            onPress={() => { setSelectedDuration('custom'); setIsContributionManuallyEdited(false); }}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.chipText, selectedDuration === 'custom' && styles.chipTextActive]}>Custom</Text>
                        </TouchableOpacity>
                    </View>
                    {selectedDuration === 'custom' && (
                        <View style={styles.customInput}>
                            <TextInput
                                style={styles.customField}
                                value={customMonths}
                                onChangeText={(v) => { setCustomMonths(v); setIsContributionManuallyEdited(false); }}
                                keyboardType="number-pad"
                                placeholder="12"
                                placeholderTextColor={colors.ink3}
                            />
                            <Text style={styles.customLabel}>{customMonths === '1' ? 'month' : 'months'}</Text>
                        </View>
                    )}

                    <Text style={styles.label}>MONTHLY CONTRIBUTION</Text>
                    <View style={[styles.moneyInput, styles.moneyInputAccent, !!monthlyContributionError && styles.errorField]}>
                        <Text style={[styles.moneySymbol, { color: colors.accent }]}>{currencySymbol}</Text>
                        <TextInput
                            style={[styles.moneyText, { color: colors.accent }]}
                            value={monthlyContribution}
                            onChangeText={handleContributionChange}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={colors.accent}
                        />
                    </View>
                    {!!monthlyContributionError && <Text style={styles.errorText}>{monthlyContributionError}</Text>}
                    {isBudgetExceeded && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorBannerText}>
                                Only {formatMoney(availableForNewGoals)} available for increases.
                            </Text>
                        </View>
                    )}

                    <Text style={styles.label}>CONTRIBUTION DAY</Text>
                    <TouchableOpacity
                        style={styles.dayPicker}
                        onPress={() => {
                            setCalendarMonth(todayMonth);
                            setCalendarYear(todayYear);
                            setCalendarVisible(true);
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.dayCircle}>
                            <Text style={styles.dayCircleNum}>{contributionDay}</Text>
                            <Text style={styles.dayCircleOrd}>{ordinal(contributionDay)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.dayPickerVal}>Every month</Text>
                            <Text style={styles.dayPickerHint}>{formatDate(new Date(selectedYear, selectedMonth, 1), 'calendarHeader')}</Text>
                        </View>
                        <Icon name="chevron-right" color="ink3" size="lg" />
                    </TouchableOpacity>

                    <Modal visible={calendarVisible} transparent animationType="fade" onRequestClose={() => setCalendarVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalCard}>
                                <Text style={styles.modalTitle}>Contribution day</Text>
                                <Text style={styles.modalSub}>Pick a future date.</Text>
                                <View style={styles.calNav}>
                                    <TouchableOpacity onPress={handleCalendarPrev} style={[styles.calNavBtn, !canGoPrev && styles.calNavBtnOff]} disabled={!canGoPrev}>
                                        <Icon name="chevron-left" color={canGoPrev ? "ink1" : "ink3"} size="lg" />
                                    </TouchableOpacity>
                                    <Text style={styles.calMonthLabel}>{formatDate(new Date(calendarYear, calendarMonth, 1), 'calendarHeader')}</Text>
                                    <TouchableOpacity onPress={handleCalendarNext} style={[styles.calNavBtn, !canGoNext && styles.calNavBtnOff]} disabled={!canGoNext}>
                                        <Icon name="chevron-right" color={canGoNext ? "ink1" : "ink3"} size="lg" />
                                    </TouchableOpacity>
                                </View>
                                {renderCalendarGrid()}
                                <TouchableOpacity style={styles.modalClose} onPress={() => setCalendarVisible(false)}>
                                    <Text style={styles.modalCloseText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </ScrollView>

                <View style={styles.footer}>
                    <Button title="Save changes" onPress={handleSave} loading={isLoading} disabled={isSaveDisabled} />
                </View>
            </KeyboardAvoidingView>

            <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Delete goal?</Text>
                        <Text style={styles.modalSub}>This can't be undone. Your saved amount stays in your budget.</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDeleteModal(false)} disabled={isDeleting}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirm} onPress={confirmDelete} disabled={isDeleting}>
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
        headerTitle: { color: c.ink1, fontSize: 15, fontFamily: fontFor('semibold') },
        trashBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.lossSoft, alignItems: 'center', justifyContent: 'center' },

        scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },

        label: { color: c.ink2, fontSize: 12, fontFamily: fontFor('medium'), letterSpacing: 0.4, marginTop: 12, marginBottom: 6 },
        input: {
            backgroundColor: c.surfaceAlt, borderRadius: 12,
            paddingHorizontal: 16, paddingVertical: 14,
            fontSize: 15, color: c.ink1,
            borderWidth: 1, borderColor: 'transparent',
        },
        moneyInput: {
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: c.surfaceAlt, borderRadius: 12,
            paddingHorizontal: 16, minHeight: 52,
            borderWidth: 1, borderColor: 'transparent',
        },
        moneyInputAccent: { backgroundColor: c.accentSoft },
        errorField: { borderColor: c.loss },
        moneySymbol: { color: c.ink1, fontSize: 20, fontFamily: fontFor('bold'), marginRight: 4, includeFontPadding: false, },
        moneyText: {
            flex: 1, color: c.ink1, fontSize: 20, fontFamily: fontFor('bold'),
            letterSpacing: -0.4, fontVariant: ['tabular-nums'], padding: 0,
        },
        errorText: { color: c.loss, fontSize: 12, marginTop: 4 },
        errorBanner: { marginTop: 6, backgroundColor: c.lossSoft, borderRadius: 10, padding: 10 },
        errorBannerText: { color: c.loss, fontSize: 13 },

        chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
        chip: {
            paddingVertical: 8, paddingHorizontal: 14,
            backgroundColor: c.surfaceAlt, borderRadius: 999,
        },
        chipActive: { backgroundColor: c.accent },
        chipText: { color: c.ink2, fontSize: 13, fontFamily: fontFor('medium') },
        chipTextActive: { color: c.accentInk },

        customInput: {
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: c.surfaceAlt, borderRadius: 12, paddingHorizontal: 16,
            minHeight: 48, marginTop: 8,
        },
        customField: { flex: 1, color: c.ink1, fontSize: 15, padding: 0, fontVariant: ['tabular-nums'], includeFontPadding: false, textAlignVertical: 'center', },
        customLabel: { color: c.ink3, fontSize: 13 },

        dayPicker: {
            flexDirection: 'row', alignItems: 'center', gap: 14,
            backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border,
            padding: 14,
        },
        dayCircle: {
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center',
            flexDirection: 'row',
        },
        dayCircleNum: { color: c.accent, fontSize: 22, fontFamily: fontFor('bold'), letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
        dayCircleOrd: { color: c.accent, fontSize: 10, fontFamily: fontFor('semibold'), marginTop: -8, marginLeft: 1 },
        dayPickerVal: { color: c.ink1, fontSize: 14, fontFamily: fontFor('semibold') },
        dayPickerHint: { color: c.ink3, fontSize: 12, marginTop: 2 },
        chevron: { color: c.ink3, fontSize: 22 },

        footer: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },

        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
        modalCard: { backgroundColor: c.surface, borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: c.border },
        modalTitle: { color: c.ink1, fontSize: 18, fontFamily: fontFor('bold'), letterSpacing: -0.3 },
        modalSub: { color: c.ink2, fontSize: 13, marginTop: 4, marginBottom: 16 },
        calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
        calNavBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
        calNavBtnOff: { opacity: 0.4 },
        calNavArrow: { color: c.ink1, fontSize: 20, lineHeight: 20 },
        calNavArrowOff: { color: c.ink3 },
        calMonthLabel: { color: c.ink1, fontSize: 15, fontFamily: fontFor('semibold') },
        calWeek: { flexDirection: 'row', marginBottom: 6 },
        calWeekDay: { flex: 1, color: c.ink3, fontSize: 11, fontFamily: fontFor('semibold'), textAlign: 'center', letterSpacing: 0.4 },
        calCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
        calDay: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
        calDaySelected: { backgroundColor: c.accent },
        calDayDisabled: { opacity: 0.3 },
        calDayText: { color: c.ink1, fontSize: 14, fontVariant: ['tabular-nums'] },
        calDayTextSelected: { color: c.accentInk, fontFamily: fontFor('semibold') },
        calDayTextDisabled: { color: c.ink3 },
        modalClose: { marginTop: 16, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong },
        modalCloseText: { color: c.ink1, fontSize: 14, fontFamily: fontFor('semibold') },
        modalButtons: { flexDirection: 'row', gap: 10, marginTop: 0 },
        modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong, alignItems: 'center' },
        modalCancelText: { color: c.ink1, fontSize: 14, fontFamily: fontFor('semibold') },
        modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: c.loss, alignItems: 'center' },
        modalConfirmText: { color: '#FFFFFF', fontSize: 14, fontFamily: fontFor('semibold') },
    });
