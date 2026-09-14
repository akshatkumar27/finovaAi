import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Platform,
    TouchableOpacity,
    KeyboardAvoidingView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { api } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Button, BackButton, Icon } from '../../components';
import { MainStackParamList } from '../../navigation/MainTabNavigator';
import { formatCompactCurrency } from '../../utils';
import { formatNumberInput, formatCompactNumber } from '../../utils/formatNumber';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { updateUser } from '../../store/slices/authSlice';
import { useTheme, fontFor } from '../../theme';
import { Palette } from '../../theme/palette';

const DURATION_OPTIONS = [
    { label: '6 mo', value: 6 },
    { label: '1 yr', value: 12 },
    { label: '2 yr', value: 24 },
    { label: '3 yr', value: 36 },
    { label: '5 yr', value: 60 },
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ordinal = (d: number) => (d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th');

export const AddGoalScreen: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<MainStackParamList, 'AddGoal'>>();
    const currencySymbol = useSelector((state: RootState) => state.settings.appCurrency);
    const user = useSelector((state: RootState) => state.auth.user);
    const { colors, typography } = useTheme();

    const availableForNewGoals = route.params?.availableForNewGoals;
    const suggestionName = route.params?.suggestionName;
    const suggestionTarget = route.params?.suggestionTarget;
    const suggestionMonths = route.params?.suggestionMonths;
    const suggestionDescription = route.params?.suggestionDescription;

    const isPreset = DURATION_OPTIONS.some((d) => d.value === suggestionMonths);
    const [name, setName] = useState(suggestionName || '');
    const [target, setTarget] = useState(suggestionTarget ? formatNumberInput(suggestionTarget.toString()) : '');
    const [selectedDuration, setSelectedDuration] = useState<number | 'custom'>(
        suggestionMonths ? (isPreset ? suggestionMonths : 'custom') : 12,
    );
    const [customMonths, setCustomMonths] = useState(suggestionMonths && !isPreset ? String(suggestionMonths) : '');
    const [monthlyContribution, setMonthlyContribution] = useState('');
    const [contributionDay, setContributionDay] = useState(new Date().getDate());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [isLoading, setIsLoading] = useState(false);
    const [isContributionManuallyEdited, setIsContributionManuallyEdited] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const achieveInMonths = selectedDuration === 'custom' ? (parseInt(customMonths) || 0) : selectedDuration;
    const targetAmount = parseInt(target.replace(/,/g, '')) || 0;
    const contributionAmount = parseInt(monthlyContribution.replace(/,/g, '')) || 0;
    const exceedsBudget = availableForNewGoals !== undefined && contributionAmount > availableForNewGoals;

    useEffect(() => {
        if (!isContributionManuallyEdited && targetAmount > 0 && achieveInMonths > 0) {
            const calc = Math.ceil(targetAmount / achieveInMonths);
            setMonthlyContribution(formatNumberInput(calc.toString()));
        }
    }, [targetAmount, achieveInMonths, isContributionManuallyEdited]);

    const handleContributionChange = (value: string) => {
        const formatted = formatNumberInput(value);
        let contribution = parseInt(formatted.replace(/,/g, '')) || 0;
        let final = formatted;
        if (targetAmount > 0 && contribution > targetAmount) {
            contribution = targetAmount;
            final = formatNumberInput(targetAmount.toString());
        }
        setMonthlyContribution(final);
        setIsContributionManuallyEdited(true);
        if (contribution > 0 && targetAmount > 0) {
            const months = Math.ceil(targetAmount / contribution);
            if (months > 0 && months <= 600) {
                setSelectedDuration('custom');
                setCustomMonths(months.toString());
            }
        }
    };

    const handleDurationSelect = (value: number) => {
        setSelectedDuration(value);
        setCustomMonths('');
        setIsContributionManuallyEdited(false);
    };
    const handleCustomSelect = () => {
        setSelectedDuration('custom');
        setIsContributionManuallyEdited(false);
    };

    // ── Calendar helpers ──────────────────────────────────────────────────
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

    const handleSaveGoal = async () => {
        if (!name.trim()) { toast.error('Missing name', { description: 'Give this goal a name.' }); return; }
        if (!target.trim() || targetAmount <= 0) { toast.error('Missing target', { description: 'Enter a target amount.' }); return; }
        if (achieveInMonths <= 0) { toast.error('Invalid duration', { description: 'Enter how long you\'ll save for.' }); return; }
        if (exceedsBudget) {
            toast.error('Too high', { description: `Can't exceed ${formatCompactCurrency(availableForNewGoals ?? 0, currencySymbol)}/mo available.` });
            return;
        }

        setIsLoading(true);
        try {
            const startDate = new Date(selectedYear, selectedMonth, contributionDay);
            const yyyy = startDate.getFullYear();
            const mm = String(startDate.getMonth() + 1).padStart(2, '0');
            const dd = String(startDate.getDate()).padStart(2, '0');
            const contributionStartDate = `${yyyy}-${mm}-${dd}`;
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const payload = {
                name: name.trim(),
                target_amount: targetAmount,
                achieve_in_months: achieveInMonths,
                monthly_contribution: contributionAmount,
                contribution_start_date: contributionStartDate,
                timezone,
            };
            await api.post('/api/goals', payload);
            try {
                if (user?.isNewUser) {
                    dispatch(updateUser({ isNewUser: false }));
                    await AsyncStorage.removeItem('onboarding_progress_data');
                }
            } catch (e) { console.error('user update failed', e); }
            navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
        } catch (error) {
            console.error('Save goal error:', error);
            toast.error('Error', { description: 'Failed to save your goal.' });
        } finally { setIsLoading(false); }
    };

    // ── Calendar grid renderer ────────────────────────────────────────────
    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
        const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
        const rows: React.ReactNode[] = [];
        rows.push(
            <View key="weekdays" style={styles.calWeek}>
                {WEEKDAYS.map((d) => (
                    <Text key={d} style={styles.calWeekDay}>{d}</Text>
                ))}
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
                    <View style={[
                        styles.calDay,
                        selected && styles.calDaySelected,
                        disabled && styles.calDayDisabled,
                    ]}>
                        <Text style={[
                            styles.calDayText,
                            selected && styles.calDayTextSelected,
                            disabled && styles.calDayTextDisabled,
                        ]}>{day}</Text>
                    </View>
                </TouchableOpacity>,
            );
            if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
                while (cells.length < 7) cells.push(<View key={`p-${cells.length}`} style={styles.calCell} />);
                rows.push(<View key={`row-${day}`} style={styles.calWeek}>{cells}</View>);
                cells = [];
            }
        }
        return rows;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>New goal</Text>
                <View style={{ width: 34 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {!!suggestionDescription && (
                        <View style={styles.tipCard}>
                            <Text style={styles.tipText}>{suggestionDescription}</Text>
                        </View>
                    )}

                    {availableForNewGoals !== undefined && availableForNewGoals > 0 && (
                        <View style={styles.budgetCard}>
                            <View>
                                <Text style={styles.budgetLabel}>MONTHLY AVAILABLE</Text>
                                <Text style={styles.budgetAmount}>{currencySymbol}{formatCompactNumber(availableForNewGoals)}</Text>
                            </View>
                            <Text style={styles.budgetSub}>after your other goals</Text>
                        </View>
                    )}

                    <Text style={styles.inputLabel}>GOAL NAME</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Emergency fund"
                        placeholderTextColor={colors.ink3}
                    />

                    <Text style={styles.inputLabel}>TARGET AMOUNT</Text>
                    <View style={styles.moneyInput}>
                        <Text style={styles.moneySymbol}>{currencySymbol}</Text>
                        <TextInput
                            style={styles.moneyText}
                            value={target}
                            onChangeText={(text) => setTarget(formatNumberInput(text))}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={colors.ink3}
                        />
                    </View>

                    <Text style={styles.inputLabel}>ACHIEVE IN</Text>
                    <View style={styles.chipRow}>
                        {DURATION_OPTIONS.map((option) => {
                            const active = selectedDuration === option.value;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => handleDurationSelect(option.value)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity
                            style={[styles.chip, selectedDuration === 'custom' && styles.chipActive]}
                            onPress={handleCustomSelect}
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
                                autoFocus={!customMonths}
                            />
                            <Text style={styles.customLabel}>{customMonths === '1' ? 'month' : 'months'}</Text>
                        </View>
                    )}

                    <Text style={styles.inputLabel}>MONTHLY CONTRIBUTION</Text>
                    <View style={[styles.moneyInput, styles.moneyInputAccent]}>
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
                    {exceedsBudget && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>
                                Exceeds your {formatCompactCurrency(availableForNewGoals ?? 0, currencySymbol)}/mo budget for new goals.
                            </Text>
                        </View>
                    )}

                    <Text style={styles.inputLabel}>CONTRIBUTION DAY</Text>
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
                            <Text style={styles.dayPickerHint}>Starting {MONTH_NAMES[selectedMonth]} {selectedYear}</Text>
                        </View>
                        <Icon name="chevron-right" color="ink3" size="lg" />
                    </TouchableOpacity>

                    <Modal visible={calendarVisible} transparent animationType="fade" onRequestClose={() => setCalendarVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalCard}>
                                <Text style={styles.modalTitle}>Start date</Text>
                                <Text style={styles.modalSub}>Pick a day for your monthly contribution.</Text>

                                <View style={styles.calNav}>
                                    <TouchableOpacity onPress={handleCalendarPrev} style={[styles.calNavBtn, !canGoPrev && styles.calNavBtnOff]} disabled={!canGoPrev}>
                                        <Icon name="chevron-left" color={canGoPrev ? "ink1" : "ink3"} size="lg" />
                                    </TouchableOpacity>
                                    <Text style={styles.calMonthLabel}>{MONTH_NAMES[calendarMonth]} {calendarYear}</Text>
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
                    <Button title="Create goal" onPress={handleSaveGoal} loading={isLoading} disabled={isLoading} />
                </View>
            </KeyboardAvoidingView>
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

        scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 4 },

        tipCard: {
            backgroundColor: c.accentSoft, borderRadius: 12,
            padding: 12, marginBottom: 8,
        },
        tipText: { color: c.accent, fontSize: 13, lineHeight: 18 },

        budgetCard: {
            backgroundColor: c.surface, borderRadius: 16,
            borderWidth: 1, borderColor: c.border,
            padding: 14, marginBottom: 8,
            flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
        },
        budgetLabel: { color: c.ink3, fontSize: 11, letterSpacing: 1.2, fontFamily: fontFor('semibold') },
        budgetAmount: { color: c.ink1, fontSize: 20, fontFamily: fontFor('bold'), letterSpacing: -0.4, marginTop: 2, fontVariant: ['tabular-nums'] },
        budgetSub: { color: c.ink3, fontSize: 11 },

        inputLabel: { color: c.ink2, fontSize: 12, fontFamily: fontFor('medium'), letterSpacing: 0.4, marginTop: 12, marginBottom: 6 },
        input: {
            backgroundColor: c.surfaceAlt,
            borderRadius: 12,
            paddingHorizontal: 16, paddingVertical: 14,
            fontSize: 15, color: c.ink1, borderWidth: 1, borderColor: 'transparent',
        },
        moneyInput: {
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: c.surfaceAlt,
            borderRadius: 12, paddingHorizontal: 16, minHeight: 52,
            borderWidth: 1, borderColor: 'transparent',
        },
        moneyInputAccent: { backgroundColor: c.accentSoft },
        moneySymbol: { color: c.ink1, fontSize: 20, fontFamily: fontFor('bold'), marginRight: 4 },
        moneyText: {
            flex: 1, color: c.ink1, fontSize: 20, fontFamily: fontFor('bold'),
            letterSpacing: -0.4, fontVariant: ['tabular-nums'], padding: 0,
        },

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
        customField: { flex: 1, color: c.ink1, fontSize: 15, padding: 0, fontVariant: ['tabular-nums'] },
        customLabel: { color: c.ink3, fontSize: 13 },

        errorBanner: { marginTop: 8, backgroundColor: c.lossSoft, borderRadius: 10, padding: 10 },
        errorText: { color: c.loss, fontSize: 13 },

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

        // Calendar modal
        modalOverlay: {
            flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
        },
        modalCard: {
            backgroundColor: c.surface, borderRadius: 20, padding: 20, width: '100%',
            borderWidth: 1, borderColor: c.border,
        },
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
        modalClose: {
            marginTop: 16, alignItems: 'center', paddingVertical: 12,
            borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong,
        },
        modalCloseText: { color: c.ink1, fontSize: 14, fontFamily: fontFor('semibold') },
    });
