import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
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
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackButton, AnimatedMascot, Header } from '../../components';
import { colors, typography, spacing } from '../../constants';
import { api } from '../../services/api';
import { formatNumberInput } from '../../utils/formatNumber';
import { useCurrency } from '../../context/CurrencyContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setFinancialData } from '../../store/slices/financialDataSlice';

export const EditFinancialDetailsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { currencySymbol } = useCurrency();
    const dispatch = useAppDispatch();
    const financialData = useAppSelector(state => state.financialData);

    // Initial data from Redux
    const initialData = {
        monthly_income: financialData.monthlyIncome,
        monthly_expenses: financialData.monthlyExpenses,
        monthly_emi: financialData.monthlyEmi,
        emi_outstanding: financialData.emiOutstanding,
        monthly_investment: financialData.monthlyInvestment,
    };

    const [form, setForm] = useState({
        monthly_income: formatNumberInput(initialData.monthly_income?.toString() || ''),
        monthly_expenses: formatNumberInput(initialData.monthly_expenses?.toString() || ''),
        monthly_emi: formatNumberInput(initialData.monthly_emi?.toString() || ''),
        emi_outstanding: formatNumberInput(initialData.emi_outstanding?.toString() || ''),
        monthly_investment: formatNumberInput(initialData.monthly_investment?.toString() || ''),
    });

    const [errors, setErrors] = useState({
        monthly_income: '',
        monthly_expenses: '',
        monthly_emi: '',
        monthly_investment: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isValid, setIsValid] = useState(true);

    // Real-time validation
    useEffect(() => {
        const income = parseInt(form.monthly_income.replace(/[^0-9]/g, ''), 10) || 0;
        const expenses = parseInt(form.monthly_expenses.replace(/[^0-9]/g, ''), 10) || 0;
        const emi = parseInt(form.monthly_emi.replace(/[^0-9]/g, ''), 10) || 0;
        const investment = parseInt(form.monthly_investment.replace(/[^0-9]/g, ''), 10) || 0;

        const newErrors = {
            monthly_income: '',
            monthly_expenses: '',
            monthly_emi: '',
            monthly_investment: '',
        };
        let valid = true;

        if (income <= 0 && form.monthly_income !== '') {
            newErrors.monthly_income = 'Income must be greater than 0';
            valid = false;
        }

        if (expenses > income) {
            newErrors.monthly_expenses = `Exceeds income`;
            valid = false;
        }

        if (expenses + emi > income) {
            newErrors.monthly_emi = `Total expenses + EMI exceed income`;
            valid = false;
        }

        const totalOutgoing = expenses + emi + investment;
        if (totalOutgoing > income) {
            newErrors.monthly_investment = `Total allocation exceeds income`;
            valid = false;
        }

        setErrors(newErrors);
        setIsValid(valid && income > 0);
    }, [form]);

    const hasErrors = !isValid || Object.values(errors).some(e => e !== '');

    // Detect if form has changed from initial prefilled values
    const hasChanges =
        (parseInt(form.monthly_income.replace(/[^0-9]/g, ''), 10) || 0) !== (initialData.monthly_income || 0) ||
        (parseInt(form.monthly_expenses.replace(/[^0-9]/g, ''), 10) || 0) !== (initialData.monthly_expenses || 0) ||
        (parseInt(form.monthly_emi.replace(/[^0-9]/g, ''), 10) || 0) !== (initialData.monthly_emi || 0) ||
        (parseInt(form.emi_outstanding.replace(/[^0-9]/g, ''), 10) || 0) !== (initialData.emi_outstanding || 0) ||
        (parseInt(form.monthly_investment.replace(/[^0-9]/g, ''), 10) || 0) !== (initialData.monthly_investment || 0);

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [field]: formatNumberInput(value) }));
    };

    const handleSave = async () => {
        if (!hasChanges) {
            Toast.show({
                type: 'info',
                text1: 'No Changes',
                text2: 'You have not made any changes to your financial details.',
            });
            return;
        }

        if (!isValid) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Inputs',
                text2: 'Please check the form for errors before saving.',
            });
            return;
        }

        setIsSaving(true);
        try {
            const income = parseInt(form.monthly_income.replace(/[^0-9]/g, ''), 10) || 0;
            const expenses = parseInt(form.monthly_expenses.replace(/[^0-9]/g, ''), 10) || 0;
            const emi = parseInt(form.monthly_emi.replace(/[^0-9]/g, ''), 10) || 0;
            const outstanding = parseInt(form.emi_outstanding.replace(/[^0-9]/g, ''), 10) || 0;
            const investment = parseInt(form.monthly_investment.replace(/[^0-9]/g, ''), 10) || 0;

            const updatedOnboarding = {
                monthly_income: income,
                monthly_expenses: expenses,
                monthly_emi: emi,
                emi_outstanding: outstanding,
                monthly_investment: investment,
            };

            // Update AsyncStorage
            // First get existing to preserve other fields if any (though currently we have full object)
            // But let's overwrite for safety if format matches
            await AsyncStorage.setItem('onboardingData', JSON.stringify(updatedOnboarding));

            // Call API
            const payload = {
                monthly_income: income,
                monthly_expenses: expenses,
                monthly_emi: emi,
                emi_outstanding: outstanding,
                monthly_savings: investment,
            };

            await api.put('/api/user/financial-profile', payload);

            dispatch(setFinancialData({
                monthlyIncome: income,
                monthlyExpenses: expenses,
                monthlyEmi: emi,
                emiOutstanding: outstanding,
                monthlyInvestment: investment,
            }));

            Toast.show({
                type: 'success',
                text1: 'Profile Updated',
                text2: 'Your financial details have been saved.',
            });

            navigation.goBack();
        } catch (error) {
            console.error('Error updating financials:', error);
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: 'Could not sync with server, but local data is updated.',
            });
            navigation.goBack();
        } finally {
            setIsSaving(false);
            DeviceEventEmitter.emit('refreshGoals');

        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <Header title="Edit Financials" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Monthly Income</Text>
                        <View style={[styles.inputContainer, !!errors.monthly_income && styles.inputError]}>
                            <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                            <TextInput
                                style={styles.inputField}
                                value={form.monthly_income}
                                onChangeText={(text) => handleChange('monthly_income', text)}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        {!!errors.monthly_income && <Text style={styles.errorText}>{errors.monthly_income}</Text>}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Monthly Expenses</Text>
                        <View style={[styles.inputContainer, !!errors.monthly_expenses && styles.inputError]}>
                            <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                            <TextInput
                                style={styles.inputField}
                                value={form.monthly_expenses}
                                onChangeText={(text) => handleChange('monthly_expenses', text)}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        {!!errors.monthly_expenses && <Text style={styles.errorText}>{errors.monthly_expenses}</Text>}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Monthly EMI</Text>
                        <View style={[styles.inputContainer, !!errors.monthly_emi && styles.inputError]}>
                            <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                            <TextInput
                                style={styles.inputField}
                                value={form.monthly_emi}
                                onChangeText={(text) => handleChange('monthly_emi', text)}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        {!!errors.monthly_emi && <Text style={styles.errorText}>{errors.monthly_emi}</Text>}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>EMI Outstanding</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                            <TextInput
                                style={styles.inputField}
                                value={form.emi_outstanding}
                                onChangeText={(text) => handleChange('emi_outstanding', text)}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Monthly Investment</Text>
                        <View style={[styles.inputContainer, !!errors.monthly_investment && styles.inputError]}>
                            <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                            <TextInput
                                style={styles.inputField}
                                value={form.monthly_investment}
                                onChangeText={(text) => handleChange('monthly_investment', text)}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        {!!errors.monthly_investment && <Text style={styles.errorText}>{errors.monthly_investment}</Text>}
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                { (
                    <AnimatedMascot
                        text="Updating your financials may affect your existing goals. Please revisit them after saving to keep things on track."
                        mascotWidth={50}
                        mascotHeight={100}
                        arrowTopRatio={0.35}
                    />
                )}
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
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
    formGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
        marginBottom: spacing.xs,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        color: '#ef4444',
        fontSize: typography.caption,
        marginTop: 4,
    },
    currencyPrefix: {
        color: colors.textPrimary,
        fontSize: typography.h3,
        fontWeight: typography.bold,
        marginRight: spacing.sm,
    },
    inputField: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: typography.h3,
        fontWeight: typography.bold,
        padding: 0,
    },
    footer: {
        padding: spacing.lg,
        // borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: typography.body,
        fontWeight: 'bold',
    },
});
