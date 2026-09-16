import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { toast } from 'sonner-native';
import { api } from '../../services/api';
import { formatNumberInput } from '../../utils/formatNumber';
import { formatMoney } from '../../utils/formatMoney';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { shallowEqual } from 'react-redux';
import { setFinancialData } from '../../store/slices/financialDataSlice';
import { useTheme, fontFor } from '../../theme';
import { Palette } from '../../theme/palette';
import { BackButton } from '../../components';

type FieldKey = 'monthly_income' | 'monthly_expenses' | 'monthly_emi' | 'emi_outstanding' | 'monthly_investment';

export const EditFinancialDetailsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const currencySymbol = useAppSelector((state) => state.settings.appCurrency);
    const { colors, typography } = useTheme();
    const dispatch = useAppDispatch();
    const financialData = useAppSelector((state) => state.financialData, shallowEqual);

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const initial = {
        monthly_income: financialData.monthlyIncome,
        monthly_expenses: financialData.monthlyExpenses,
        monthly_emi: financialData.monthlyEmi,
        emi_outstanding: financialData.emiOutstanding,
        monthly_investment: financialData.monthlyInvestment,
    };

    const [form, setForm] = useState({
        monthly_income: formatNumberInput(initial.monthly_income?.toString() || ''),
        monthly_expenses: formatNumberInput(initial.monthly_expenses?.toString() || ''),
        monthly_emi: formatNumberInput(initial.monthly_emi?.toString() || ''),
        emi_outstanding: formatNumberInput(initial.emi_outstanding?.toString() || ''),
        monthly_investment: formatNumberInput(initial.monthly_investment?.toString() || ''),
    });

    const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isValid, setIsValid] = useState(true);

    const asNum = (v: string) => parseInt(v.replace(/[^0-9]/g, ''), 10) || 0;

    useEffect(() => {
        const income = asNum(form.monthly_income);
        const expenses = asNum(form.monthly_expenses);
        const emi = asNum(form.monthly_emi);
        const investment = asNum(form.monthly_investment);
        const next: Partial<Record<FieldKey, string>> = {};
        let valid = true;
        if (income <= 0 && form.monthly_income !== '') { next.monthly_income = 'Income must be greater than 0'; valid = false; }
        if (expenses > income) { next.monthly_expenses = 'Exceeds income'; valid = false; }
        if (expenses + emi > income) { next.monthly_emi = 'Expenses + EMI exceed income'; valid = false; }
        if (expenses + emi + investment > income) { next.monthly_investment = 'Total allocation exceeds income'; valid = false; }
        setErrors(next);
        setIsValid(valid && income > 0);
    }, [form]);

    const hasChanges =
        asNum(form.monthly_income) !== (initial.monthly_income || 0) ||
        asNum(form.monthly_expenses) !== (initial.monthly_expenses || 0) ||
        asNum(form.monthly_emi) !== (initial.monthly_emi || 0) ||
        asNum(form.emi_outstanding) !== (initial.emi_outstanding || 0) ||
        asNum(form.monthly_investment) !== (initial.monthly_investment || 0);

    const handleChange = (field: FieldKey, value: string) => {
        setForm((prev) => ({ ...prev, [field]: formatNumberInput(value) }));
    };

    const handleSave = async () => {
        if (!hasChanges) { toast('No changes', { description: 'Nothing to save yet.' }); return; }
        if (!isValid) { toast.error('Fix errors', { description: 'Some fields need attention.' }); return; }

        setIsSaving(true);
        try {
            const income = asNum(form.monthly_income);
            const expenses = asNum(form.monthly_expenses);
            const emi = asNum(form.monthly_emi);
            const outstanding = asNum(form.emi_outstanding);
            const investment = asNum(form.monthly_investment);
            const updated = { monthly_income: income, monthly_expenses: expenses, monthly_emi: emi, emi_outstanding: outstanding, monthly_investment: investment };
            
            await api.put('/api/user/financial-profile', {
                monthly_income: income, monthly_expenses: expenses, monthly_emi: emi, emi_outstanding: outstanding, monthly_savings: investment,
            });
            dispatch(setFinancialData({
                monthlyIncome: income, monthlyExpenses: expenses, monthlyEmi: emi, emiOutstanding: outstanding, monthlyInvestment: investment,
            }));
            toast.success('Saved', { description: 'Your financial details are updated.' });
            navigation.goBack();
        } catch (error) {
            console.error('Error updating financials:', error);
            toast.error('Sync failed', { description: 'Local saved; server sync will retry.' });
            navigation.goBack();
        } finally {
            setIsSaving(false);
            DeviceEventEmitter.emit('refreshGoals');
        }
    };

    const income = asNum(form.monthly_income);
    const expenses = asNum(form.monthly_expenses);
    const emi = asNum(form.monthly_emi);
    const investment = asNum(form.monthly_investment);
    const available = Math.max(0, income - expenses - emi);
    const unassigned = Math.max(0, available - investment);

    const fields: { key: FieldKey; label: string }[] = [
        { key: 'monthly_income', label: 'MONTHLY INCOME' },
        { key: 'monthly_expenses', label: 'MONTHLY EXPENSES' },
        { key: 'monthly_emi', label: 'MONTHLY EMI' },
        { key: 'emi_outstanding', label: 'EMI OUTSTANDING' },
        { key: 'monthly_investment', label: 'MONTHLY INVESTMENT' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Financial details</Text>
                <View style={{ width: 34 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {income > 0 && (
                        <View style={styles.summary}>
                            <Text style={styles.summaryCap}>AVAILABLE TO ALLOCATE</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summarySymbol}>{currencySymbol}</Text>
                                <Text style={styles.summaryValue}>{formatMoney(available).slice(1)}</Text>
                                <Text style={styles.summarySub}>/month</Text>
                            </View>
                            <View style={styles.summaryBar}>
                                {expenses > 0 && <View style={[styles.barSeg, { flex: expenses, backgroundColor: colors.loss }]} />}
                                {emi > 0 && <View style={[styles.barSeg, { flex: emi, backgroundColor: colors.warn }]} />}
                                {available > 0 && <View style={[styles.barSeg, { flex: available, backgroundColor: colors.gain }]} />}
                            </View>
                            <View style={styles.legendRow}>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.loss }]} /><Text style={styles.legendText}>Expenses</Text></View>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warn }]} /><Text style={styles.legendText}>EMI</Text></View>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.gain }]} /><Text style={styles.legendText}>Available</Text></View>
                            </View>
                            {available > 0 && (investment > 0 || unassigned > 0) && (
                                <Text style={styles.summarySplit}>
                                    {investment > 0 ? `${formatMoney(investment)} to investment · ` : ''}
                                    {`${formatMoney(unassigned)} unassigned`}
                                </Text>
                            )}
                        </View>
                    )}

                    {fields.map((f) => (
                        <View key={f.key} style={styles.field}>
                            <Text style={styles.label}>{f.label}</Text>
                            <View style={[styles.input, !!errors[f.key] && styles.inputError]}>
                                <Text style={styles.currency}>{currencySymbol}</Text>
                                <TextInput
                                    style={styles.inputText}
                                    value={form[f.key]}
                                    onChangeText={(text) => handleChange(f.key, text)}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                    placeholderTextColor={colors.ink3}
                                />
                            </View>
                            {!!errors[f.key] && <Text style={styles.errorText}>{errors[f.key]}</Text>}
                        </View>
                    ))}

                    <View style={styles.noteCard}>
                        <Text style={styles.noteText}>Changes to your financials may shift your goal timelines. Revisit them after saving.</Text>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveBtn, (isSaving || !hasChanges) && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                        activeOpacity={0.85}
                    >
                        {isSaving ? <ActivityIndicator color={colors.accentInk} /> : <Text style={styles.saveBtnText}>Save changes</Text>}
                    </TouchableOpacity>
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

        scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },

        summary: {
            backgroundColor: c.surface, borderRadius: 20,
            borderWidth: 1, borderColor: c.border,
            padding: 18, marginBottom: 20,
        },
        summaryCap: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontFamily: fontFor('semibold') },
        summaryRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
        summarySymbol: { color: c.ink1, fontSize: 22, fontFamily: fontFor('bold'), marginRight: 4, includeFontPadding: false, },
        summaryValue: { color: c.ink1, fontSize: 30, fontFamily: fontFor('bold'), letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
        summarySub: { color: c.ink3, fontSize: 12, marginLeft: 6 },
        summarySplit: { color: c.ink3, fontSize: 12, marginTop: 10, letterSpacing: 0.1 },
        summaryBar: { height: 8, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', marginTop: 14 },
        barSeg: { height: '100%' },
        legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
        legendItem: { flexDirection: 'row', alignItems: 'center' },
        legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
        legendText: { color: c.ink2, fontSize: 12 },

        field: { marginBottom: 14 },
        label: { color: c.ink2, fontSize: 12, fontFamily: fontFor('medium'), letterSpacing: 0.4, marginBottom: 6 },
        input: {
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: c.surfaceAlt, borderRadius: 12,
            paddingHorizontal: 16, minHeight: 52,
            borderWidth: 1, borderColor: 'transparent',
        },
        inputError: { borderColor: c.loss, backgroundColor: c.lossSoft },
        currency: { color: c.ink1, fontSize: 18, fontFamily: fontFor('semibold'), marginRight: 4, includeFontPadding: false, },
        inputText: {
            flex: 1, color: c.ink1, fontSize: 18, fontFamily: fontFor('semibold'),
            fontVariant: ['tabular-nums'], padding: 0,
        },
        errorText: { color: c.loss, fontSize: 12, marginTop: 4 },

        noteCard: {
            backgroundColor: c.warnSoft, borderRadius: 12,
            padding: 12, marginTop: 12,
        },
        noteText: { color: c.warn, fontSize: 12, lineHeight: 18 },

        footer: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8, backgroundColor: c.canvas },
        saveBtn: {
            backgroundColor: c.accent, paddingVertical: 14, borderRadius: 12,
            alignItems: 'center', justifyContent: 'center', minHeight: 52,
        },
        saveBtnDisabled: { opacity: 0.5 },
        saveBtnText: { color: c.accentInk, fontSize: 14, fontFamily: fontFor('semibold') },
    });
