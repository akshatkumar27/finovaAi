import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing } from '../../constants';
import { Header, Button, AnimatedMascot } from '../../components';
import { MainStackParamList } from '../../navigation/MainTabNavigator';
import { api } from '../../services';
import { formatNumberInput } from '../../utils/formatNumber';
import { formatCurrency } from '../../utils';
import { useCurrency } from '../../context/CurrencyContext';

// Time duration options in months
const DURATION_OPTIONS = [
    { label: '6 months', value: 6 },
    { label: '1 year', value: 12 },
    { label: '2 years', value: 24 },
    { label: '3 years', value: 36 },
    { label: '5 years', value: 60 },
];

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type EditGoalRouteProp = RouteProp<MainStackParamList, 'EditGoal'>;

export const EditGoalScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<EditGoalRouteProp>();
    const { currencySymbol } = useCurrency();
    console.log("-->", route.params)
    // Initialize state
    const [name, setName] = useState(route.params?.name || 'Emergency fund');

    // Helper to sanitize initial numeric values
    const sanitizeInitialValue = (val: number | string | undefined, fallback: string) => {
        if (val === undefined || val === null) return fallback;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        // Round to nearest integer and format
        return formatNumberInput(Math.round(num).toString());
    };

    const [target, setTarget] = useState(sanitizeInitialValue(route.params?.target, '5000'));
    const [selectedDuration, setSelectedDuration] = useState<number | 'custom'>('custom');
    const [customMonths, setCustomMonths] = useState(route.params?.achieveIn?.toString() || '24');
    const [monthlyContribution, setMonthlyContribution] = useState(
        sanitizeInitialValue(route.params?.monthlyContribution, '500')
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [targetError, setTargetError] = useState<string | null>(null);
    const [monthlyContributionError, setMonthlyContributionError] = useState<string | null>(null);
    const [isContributionManuallyEdited, setIsContributionManuallyEdited] = useState(false);
    const [contributionDay, setContributionDay] = useState(() => {
        const dateStr = route.params?.contributionDay;
        if (dateStr) {
            const day = new Date(dateStr).getDate();
            return isNaN(day) ? new Date().getDate() : day;
        }
        return new Date().getDate();
    });
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const dateStr = route.params?.contributionDay;
        if (dateStr) {
            const m = new Date(dateStr).getMonth();
            return isNaN(m) ? new Date().getMonth() : m;
        }
        return new Date().getMonth();
    });
    const [selectedYear, setSelectedYear] = useState(() => {
        const dateStr = route.params?.contributionDay;
        if (dateStr) {
            const y = new Date(dateStr).getFullYear();
            return isNaN(y) ? new Date().getFullYear() : y;
        }
        return new Date().getFullYear();
    });
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

    const goalId = route.params?.goalId;
    const savedAmount = route.params?.savedAmount || 0;
    const availableForNewGoals = route.params?.availableForNewGoals || 0;
    const initialMonthlyContribution = parseFloat(route.params?.monthlyContribution?.toString() || '0');

    // Store initial values to detect changes
    const initialName = useRef(route.params?.name || 'Emergency fund');
    const initialTarget = useRef(sanitizeInitialValue(route.params?.target, '5000'));
    const initialContribution = useRef(sanitizeInitialValue(route.params?.monthlyContribution, '500'));
    const initialAchieveIn = useRef(parseInt(route.params?.achieveIn?.toString() || '0'));
    const initialContributionDay = useRef((() => {
        const dateStr = route.params?.contributionDay;
        if (dateStr) {
            const day = new Date(dateStr).getDate();
            return isNaN(day) ? 1 : day;
        }
        return 1;
    })());

    // Derived achieveInMonths
    const achieveInMonths = selectedDuration === 'custom'
        ? (parseInt(customMonths) || 0)
        : selectedDuration;

    const targetAmount = parseInt(target.replace(/,/g, '')) || 0;
    const contributionAmount = parseInt(monthlyContribution.replace(/,/g, '')) || 0;

    // Derived state for budget check
    const netChange = contributionAmount - initialMonthlyContribution;
    const isBudgetExceeded = netChange > availableForNewGoals;

    // Has anything actually changed from the initial values?
    const hasChanges =
        name !== initialName.current ||
        target !== initialTarget.current ||
        monthlyContribution !== initialContribution.current ||
        achieveInMonths !== initialAchieveIn.current ||
        contributionDay !== initialContributionDay.current;

    const isSaveDisabled = isLoading || !!targetError || !!monthlyContributionError || isBudgetExceeded || !hasChanges;

    // Load initial duration selection
    React.useEffect(() => {
        const initialMonths = parseInt(route.params?.achieveIn?.toString() || '0');
        if (initialMonths > 0) {
            const matchedOption = DURATION_OPTIONS.find(opt => opt.value === initialMonths);
            if (matchedOption) {
                setSelectedDuration(matchedOption.value);
                setCustomMonths('');
            } else {
                setSelectedDuration('custom');
                setCustomMonths(initialMonths.toString());
            }
        }
    }, [route.params?.achieveIn]);

    // Auto-calculate monthly contribution when target or duration changes
    React.useEffect(() => {
        if (!isContributionManuallyEdited && targetAmount > 0 && achieveInMonths > 0) {
            const calculated = Math.ceil(targetAmount / achieveInMonths);
            setMonthlyContribution(formatNumberInput(calculated.toString()));

            // Clear errors if auto-calculated
            if (monthlyContributionError) setMonthlyContributionError(null);
        }
    }, [targetAmount, achieveInMonths, isContributionManuallyEdited]);


    const handleTargetChange = (text: string) => {
        const formatted = formatNumberInput(text);
        setTarget(formatted);
        const newTarget = parseInt(formatted.replace(/,/g, '')) || 0;

        // Target validation
        if (newTarget > 0 && newTarget < savedAmount) {
            setTargetError(`Target amount cannot be less than saved amount (£${savedAmount})`);
        } else {
            setTargetError(null);
        }

        // Re-validate monthly contribution against new target
        if (newTarget > 0 && contributionAmount > newTarget) {
            setMonthlyContributionError('Monthly contribution cannot exceed target amount');
        } else if (monthlyContributionError === 'Monthly contribution cannot exceed target amount') {
            setMonthlyContributionError(null);
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

    const handleCustomMonthsChange = (value: string) => {
        setCustomMonths(value);
        setIsContributionManuallyEdited(false);
    };

    const handleMonthlyContributionChange = (text: string) => {
        const formatted = formatNumberInput(text);
        setMonthlyContribution(formatted);
        setIsContributionManuallyEdited(true);

        const newMonthly = parseInt(formatted.replace(/,/g, '')) || 0;

        // Validation: Max limit
        if (targetAmount > 0 && newMonthly > targetAmount) {
            setMonthlyContributionError('Monthly contribution cannot exceed target amount');
        } else {
            setMonthlyContributionError(null);
        }

        // Validation: Budget check (Net Change)
        // Handled by derived state isBudgetExceeded

        // Auto-calculate Duration (Achieve In) based on new contribution
        if (newMonthly > 0 && targetAmount > 0) {
            const calculatedMonths = Math.ceil(targetAmount / newMonthly);
            if (calculatedMonths > 0 && calculatedMonths <= 600) {
                setSelectedDuration('custom');
                setCustomMonths(calculatedMonths.toString());
            }
        }
    }

    // Calendar helpers
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const maxMonth = todayMonth + 1 > 11 ? 0 : todayMonth + 1;
    const maxYear = todayMonth + 1 > 11 ? todayYear + 1 : todayYear;

    const canGoNext = !(calendarMonth === maxMonth && calendarYear === maxYear);
    const canGoPrev = !(calendarMonth === todayMonth && calendarYear === todayYear);

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getCalendarDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const isDateDisabled = (day: number, month: number, year: number): boolean => {
        const d = new Date(year, month, day);
        const t = new Date(todayYear, todayMonth, todayDate);
        return d < t;
    };

    const handleCalendarPrev = () => {
        if (!canGoPrev) return;
        if (calendarMonth === 0) {
            setCalendarMonth(11);
            setCalendarYear(calendarYear - 1);
        } else {
            setCalendarMonth(calendarMonth - 1);
        }
    };

    const handleCalendarNext = () => {
        if (!canGoNext) return;
        if (calendarMonth === 11) {
            setCalendarMonth(0);
            setCalendarYear(calendarYear + 1);
        } else {
            setCalendarMonth(calendarMonth + 1);
        }
    };

    const handleDateSelect = (day: number) => {
        setContributionDay(day);
        setSelectedMonth(calendarMonth);
        setSelectedYear(calendarYear);
        setCalendarVisible(false);
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getCalendarDaysInMonth(calendarYear, calendarMonth);
        const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
        const rows: React.ReactNode[] = [];

        rows.push(
            <View key="weekdays" style={calendarStyles.weekRow}>
                {WEEKDAYS.map(d => (
                    <Text key={d} style={calendarStyles.weekDayText}>{d}</Text>
                ))}
            </View>
        );

        let cells: React.ReactNode[] = [];
        for (let i = 0; i < firstDay; i++) {
            cells.push(<View key={`empty-${i}`} style={calendarStyles.dayCell} />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const disabled = isDateDisabled(day, calendarMonth, calendarYear);
            const isSelected = day === contributionDay && calendarMonth === selectedMonth && calendarYear === selectedYear;

            cells.push(
                <TouchableOpacity
                    key={day}
                    style={[
                        calendarStyles.dayCell,
                        isSelected && calendarStyles.dayCellSelected,
                        disabled && calendarStyles.dayCellDisabled,
                    ]}
                    onPress={() => !disabled && handleDateSelect(day)}
                    disabled={disabled}
                    activeOpacity={0.6}
                >
                    <Text
                        style={[
                            calendarStyles.calDayText,
                            isSelected && calendarStyles.dayTextSelected,
                            disabled && calendarStyles.dayTextDisabled,
                        ]}
                    >
                        {day}
                    </Text>
                </TouchableOpacity>
            );

            if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
                while (cells.length < 7) {
                    cells.push(<View key={`pad-${cells.length}`} style={calendarStyles.dayCell} />);
                }
                rows.push(
                    <View key={`row-${day}`} style={calendarStyles.weekRow}>
                        {cells}
                    </View>
                );
                cells = [];
            }
        }

        return rows;
    };

    const handleSave = async () => {
        if (!goalId) {
            console.error('No goal ID provided');
            return;
        }

        let isValid = true;

        // Validation - Target
        if (targetAmount <= 0 || targetAmount < savedAmount) {
            setTargetError(`Target amount cannot be less than saved amount (£${savedAmount})`);
            isValid = false;
        }

        // Validation - Monthly Contribution
        if (contributionAmount <= 0) {
            setMonthlyContributionError('Please enter a valid amount');
            isValid = false;
        } else if (contributionAmount > targetAmount) {
            setMonthlyContributionError('Monthly contribution cannot exceed target amount');
            isValid = false;
        }

        // Validation - Budget
        const netChange = contributionAmount - initialMonthlyContribution;
        if (netChange > availableForNewGoals) {
            Toast.show({
                type: 'error',
                text1: 'Budget Exceeded',
                text2: `You only have ${currencySymbol}${availableForNewGoals} available for increases.`,
            });
            isValid = false;
        }

        if (!isValid) return;

        setIsLoading(true);
        try {
            // Build contribution start date from selected calendar day
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
                Toast.show({
                    type: 'success',
                    text1: 'Goal Updated',
                    text2: 'Your goal has been successfully updated.',
                });
                navigation.goBack();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Update Failed',
                    text2: 'Failed to update goal. Please try again.',
                });
            }
        } catch (error) {
            console.error('Error updating goal:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'An error occurred while updating the goal.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        if (!goalId) return;
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await api.delete(`/api/goals/${goalId}`);
            if (response.data.success) {
                DeviceEventEmitter.emit('refreshGoals');
                setShowDeleteModal(false);
                Toast.show({
                    type: 'success',
                    text1: 'Goal Deleted',
                    text2: 'Your goal has been successfully deleted.',
                });
                navigation.goBack();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Delete Failed',
                    text2: 'Failed to delete goal. Please try again.',
                });
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'An error occurred while deleting the goal.',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <Header
                        title="Edit your goal"
                        rightElement={
                            <TouchableOpacity
                                style={styles.trashButton}
                                onPress={handleDelete}
                                disabled={isLoading}
                            >
                                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                                    <Path d="M3 6h18" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" />
                                    <Path d="M8 6V4h8v2" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    <Path d="M19 6l-1 14H6L5 6" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    <Path d="M10 11v6M14 11v6" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" />
                                </Svg>
                            </TouchableOpacity>
                        }
                    />

                    {/* Form Card */}
                    <View style={styles.formCard}>
                        {/* Name Field */}
                        <View style={{ marginBottom: spacing.lg }}>
                            <Text style={styles.fieldLabel}>Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Target Field */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.rowFieldContainer}>
                                <Text style={styles.fieldLabel}>Target</Text>
                                <View style={styles.compactInput}>
                                    <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                                    <TextInput
                                        style={styles.compactInputText2}
                                        value={target}
                                        onChangeText={handleTargetChange}
                                        keyboardType="number-pad"
                                        placeholder="5000"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                            </View>
                            {targetError && <Text style={styles.errorText}>{targetError}</Text>}
                        </View>

                        {/* Achieve In Field */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.fieldLabel}>Achieve in</Text>
                            <View style={styles.durationContainer}>
                                {DURATION_OPTIONS.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.durationOption,
                                            selectedDuration === option.value && styles.durationOptionSelected,
                                        ]}
                                        onPress={() => handleDurationSelect(option.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.durationText,
                                                selectedDuration === option.value && styles.durationTextSelected,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {/* Custom Option */}
                                <TouchableOpacity
                                    style={[
                                        styles.durationOption,
                                        selectedDuration === 'custom' && styles.durationOptionSelected,
                                    ]}
                                    onPress={handleCustomSelect}
                                >
                                    <Text
                                        style={[
                                            styles.durationText,
                                            selectedDuration === 'custom' && styles.durationTextSelected,
                                        ]}
                                    >
                                        Custom
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Custom months input */}
                            {selectedDuration === 'custom' && (
                                <View style={styles.customInputContainer}>
                                    <TextInput
                                        style={styles.customMonthsInput}
                                        value={customMonths}
                                        onChangeText={handleCustomMonthsChange}
                                        keyboardType="number-pad"
                                        placeholder="Enter months"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                    <Text style={styles.customMonthsLabel}>{customMonths === '1' ? 'month' : 'months'}</Text>
                                </View>
                            )}
                        </View>

                        {/* Monthly Contribution Field */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.rowFieldContainer}>
                                <Text style={styles.fieldLabel}>Monthly contribution</Text>
                                <View style={[styles.compactInput, styles.highlightedInput,]}>
                                    <Text style={[styles.currencyPrefix, styles.highlightedText]}>{currencySymbol}</Text>
                                    <TextInput
                                        style={[styles.compactInputText, styles.highlightedText]}
                                        value={monthlyContribution}
                                        onChangeText={handleMonthlyContributionChange}
                                        keyboardType="number-pad"
                                        placeholder="500"
                                    />
                                </View>
                            </View>
                            {monthlyContributionError && <Text style={styles.errorText}>{monthlyContributionError}</Text>}

                            {/* Budget Exceeded Mascot Warning */}
                            {isBudgetExceeded && !monthlyContributionError && (
                                <View style={styles.mascotContainer}>
                                    <AnimatedMascot
                                        text={`You only have ${currencySymbol}${availableForNewGoals} available for increases.`}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Contribution Day Picker */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.fieldLabel}>Contribution day of month</Text>
                            <TouchableOpacity
                                style={calendarStyles.dayPickerCard}
                                onPress={() => {
                                    setCalendarMonth(todayMonth);
                                    setCalendarYear(todayYear);
                                    setCalendarVisible(true);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={calendarStyles.dayPickerLeft}>
                                    <View style={calendarStyles.dateCircle}>
                                        <Text style={calendarStyles.dateCircleText}>{contributionDay}</Text>
                                        <View style={calendarStyles.ordinalBadge}>
                                            <Text style={calendarStyles.ordinalText}>
                                                {contributionDay === 1 ? 'st' : contributionDay === 2 ? 'nd' : contributionDay === 3 ? 'rd' : 'th'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={calendarStyles.dayPickerTextContainer}>
                                        <Text style={calendarStyles.dayPickerValue}>Of every month</Text>
                                        <Text style={calendarStyles.dayPickerHint}>Tap to change</Text>
                                    </View>
                                </View>
                                <Text style={calendarStyles.changeText}>›</Text>
                            </TouchableOpacity>
                            <View style={calendarStyles.noteContainer}>
                                <Text style={calendarStyles.noteIcon}>Note: </Text>
                                <Text style={calendarStyles.noteText}>
                                    Your first contribution starts on{' '}
                                    <Text style={calendarStyles.noteHighlight}>
                                        {contributionDay} {MONTH_NAMES[selectedMonth]} {selectedYear}
                                    </Text>
                                </Text>
                            </View>
                        </View>

                        {/* Calendar Modal */}
                        <Modal
                            visible={calendarVisible}
                            transparent
                            animationType="fade"
                            onRequestClose={() => setCalendarVisible(false)}
                        >
                            <View style={calendarStyles.modalOverlay}>
                                <View style={calendarStyles.modalContent}>
                                    <Text style={calendarStyles.modalTitle}>Select Contribution Day</Text>
                                    <Text style={calendarStyles.modalSubtitle}>Pick a future date for your monthly contribution</Text>

                                    {/* Month navigation */}
                                    <View style={calendarStyles.monthNav}>
                                        <TouchableOpacity
                                            onPress={handleCalendarPrev}
                                            style={[calendarStyles.navBtn, !canGoPrev && calendarStyles.navBtnDisabled]}
                                            disabled={!canGoPrev}
                                        >
                                            <Text style={[calendarStyles.navBtnText, !canGoPrev && calendarStyles.navBtnTextDisabled]}>‹</Text>
                                        </TouchableOpacity>
                                        <Text style={calendarStyles.monthLabel}>
                                            {MONTH_NAMES[calendarMonth]} {calendarYear}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={handleCalendarNext}
                                            style={[calendarStyles.navBtn, !canGoNext && calendarStyles.navBtnDisabled]}
                                            disabled={!canGoNext}
                                        >
                                            <Text style={[calendarStyles.navBtnText, !canGoNext && calendarStyles.navBtnTextDisabled]}>›</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Calendar grid */}
                                    {renderCalendarGrid()}

                                    {/* Close button */}
                                    <TouchableOpacity
                                        style={calendarStyles.closeBtn}
                                        onPress={() => setCalendarVisible(false)}
                                    >
                                        <Text style={calendarStyles.closeBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>

                        {/* Save Button */}
                        <Button
                            title={isLoading ? 'Saving...' : 'Save'}
                            onPress={handleSave}
                            disabled={isLoading}
                            style={{ marginTop: spacing.xl }}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalIcon}>🗑️</Text>
                        <Text style={styles.modalTitle}>Delete Goal</Text>
                        <Text style={styles.modalMessage}>
                            Are you sure you want to delete{' '}
                            <Text style={styles.modalGoalName}>{name}</Text>?
                            {' '}This action cannot be undone.
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalDeleteBtn}
                                onPress={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={styles.modalDeleteText}>Delete</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        // paddingHorizontal: spacing.lg,
    },

    formCard: {
        // backgroundColor: colors.cardBackground,
        // borderRadius: 16,
        // borderWidth: 1,
        borderColor: colors.border,
        // padding: spacing.lg,
        marginTop: spacing.md,
        marginHorizontal: spacing.lg,
    },
    fieldContainer: {
        // marginBottom: spacing.lg,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    fieldLabel: {
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
        marginBottom: spacing.sm,
    },
    textInput: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
        fontSize: typography.body,
    },
    rowFieldContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        marginTop: spacing.md,
    },
    compactInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        maxWidth: 150,
    },
    compactInputText: {
        color: colors.textPrimary,
        fontSize: typography.body,
        textAlign: 'right',
        minWidth: 60,
        paddingVertical: 0,
        flex: 1,
    },
    compactInputText2: {
        color: colors.textPrimary,
        fontSize: typography.body,
        paddingHorizontal: spacing.md,
        paddingVertical: 0,
        minWidth: 60,
        flex: 1,
    },
    currencyPrefix: {
        color: colors.textSecondary,
        fontSize: typography.body,
        marginRight: spacing.xs,
    },
    highlightedInput: {
        backgroundColor: colors.primary + '10',
        borderColor: colors.primary + '40',
    },
    highlightedText: {
        color: colors.primary,
    },
    durationContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    durationOption: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.border,
    },
    durationOptionSelected: {
        backgroundColor: colors.primary + '20',
        borderColor: colors.primary,
    },
    durationText: {
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
        fontWeight: typography.medium,
    },
    durationTextSelected: {
        color: colors.primary,
    },
    customInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    customMonthsInput: {
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 8,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
        fontSize: typography.body,
        width: 100,
        textAlign: 'center',
    },
    customMonthsLabel: {
        color: colors.textSecondary,
        fontSize: typography.body,
        marginLeft: spacing.sm,
    },
    inputError: {
        borderColor: colors.error,
    },
    errorText: {
        color: colors.error,
        fontSize: typography.caption,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    mascotContainer: {
        marginTop: spacing.md,
        alignItems: 'center',
    },
    trashButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Delete Confirmation Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    modalCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: spacing.xl,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2a4a',
    },
    modalIcon: {
        fontSize: 40,
        marginBottom: spacing.md,
    },
    modalTitle: {
        color: colors.textPrimary,
        fontSize: typography.h3,
        fontWeight: typography.bold as any,
        marginBottom: spacing.sm,
    },
    modalMessage: {
        color: colors.textSecondary,
        fontSize: typography.body,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    modalGoalName: {
        color: colors.textPrimary,
        fontWeight: typography.semibold as any,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
    },
    modalCancelText: {
        color: colors.textSecondary,
        fontSize: typography.body,
        fontWeight: typography.medium as any,
    },
    modalDeleteBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: '#ef4444',
    },
    modalDeleteText: {
        color: '#fff',
        fontSize: typography.body,
        fontWeight: typography.semibold as any,
    },
});

const calendarStyles = StyleSheet.create({
    dayPickerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1.5,
        borderColor: colors.primary + '25',
        marginTop: spacing.sm,
    },
    dayPickerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dateCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary + '18',
        borderWidth: 1.5,
        borderColor: colors.primary + '50',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    dateCircleText: {
        color: colors.primary,
        fontSize: 20,
        fontWeight: typography.bold as any,
        lineHeight: 24,
    },
    ordinalBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.primary,
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 1,
        minWidth: 18,
        alignItems: 'center',
    },
    ordinalText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: typography.bold as any,
    },
    dayPickerTextContainer: {
        flex: 1,
    },
    dayPickerValue: {
        color: colors.textPrimary,
        fontSize: typography.bodySmall,
        fontWeight: typography.medium as any,
    },
    dayPickerHint: {
        color: colors.textMuted,
        fontSize: typography.caption - 1,
        marginTop: 3,
    },
    changeText: {
        color: colors.primary,
        fontSize: 22,
        fontWeight: typography.bold as any,
        marginLeft: spacing.sm,
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm + 2,
        paddingHorizontal: spacing.xs,
    },
    noteIcon: {
        fontSize: 13,
        marginRight: spacing.xs,
        color: colors.textMuted,
    },
    noteText: {
        color: colors.textMuted,
        fontSize: typography.caption - 1,
        flex: 1,
    },
    noteHighlight: {
        color: colors.primary,
        fontWeight: typography.semibold as any,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: spacing.lg,
        width: '100%',
        borderWidth: 1,
        borderColor: '#2a2a4a',
    },
    modalTitle: {
        color: colors.textPrimary,
        fontSize: typography.h3,
        fontWeight: typography.bold as any,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    modalSubtitle: {
        color: colors.textMuted,
        fontSize: typography.caption,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    navBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.cardBackground,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navBtnDisabled: {
        opacity: 0.3,
    },
    navBtnText: {
        color: colors.textPrimary,
        fontSize: 24,
        fontWeight: typography.bold as any,
        lineHeight: 28,
    },
    navBtnTextDisabled: {
        color: colors.textMuted,
    },
    monthLabel: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold as any,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.xs,
    },
    weekDayText: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontWeight: typography.semibold as any,
        width: 40,
        textAlign: 'center',
    },
    dayCell: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 2,
    },
    dayCellSelected: {
        backgroundColor: colors.primary + '30',
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    dayCellDisabled: {
        opacity: 0.25,
    },
    calDayText: {
        color: colors.textPrimary,
        fontSize: typography.bodySmall,
        fontWeight: typography.medium as any,
    },
    dayTextSelected: {
        color: colors.primary,
        fontWeight: typography.bold as any,
    },
    dayTextDisabled: {
        color: colors.textMuted,
    },
    closeBtn: {
        marginTop: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.cardBackground,
        alignItems: 'center',
    },
    closeBtnText: {
        color: colors.textSecondary,
        fontSize: typography.body,
        fontWeight: typography.semibold as any,
    },
});

