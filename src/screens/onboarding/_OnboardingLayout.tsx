import React, { useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button, BackButton } from '../../components';
import { useTheme, fontFor } from '../../theme';
import { Palette } from '../../theme/palette';
import { useAppSelector } from '../../store/hooks';
import { formatMoney } from '../../utils/formatMoney';

export type OnboardingAmountProps = {
    step: number;                        // 1..5
    totalSteps?: number;                 // default 5
    title: string;                       // "Monthly income, roughly."
    helper?: string;                     // sub-copy
    amount: string;                      // formatted number as string ("1,20,000")
    onAmountChange: (v: string) => void;
    chipPresets?: (string | number)[];   // numeric presets (raw)
    onChipPress?: (value: number) => void;
    error?: string;
    footerHint?: string;                 // small caption above button
    continueLabel?: string;              // default "Continue"
    continueDisabled?: boolean;
    continueLoading?: boolean;
    onContinue: () => void;
    onSkip?: () => void;
    /** Custom footer if you need something above the button (e.g. income display) */
    footerAbove?: React.ReactNode;
};

export const OnboardingAmountScreen: React.FC<OnboardingAmountProps> = ({
    step,
    totalSteps = 5,
    title,
    helper,
    amount,
    onAmountChange,
    chipPresets,
    onChipPress,
    error,
    footerHint,
    continueLabel = 'Continue',
    continueDisabled,
    continueLoading,
    onContinue,
    onSkip,
    footerAbove,
}) => {
    const navigation = useNavigation();
    const { colors, typography } = useTheme();
    const currencySymbol = useAppSelector((state) => state.settings.appCurrency);

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.stepBar}>
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <View key={i} style={[styles.stepDot, i < step && styles.stepDotDone]} />
                ))}
            </View>

            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.stepCap}>STEP {step} OF {totalSteps}</Text>
                {onSkip ? (
                    <TouchableOpacity onPress={onSkip} activeOpacity={0.7} style={styles.skipBtn}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: 42 }} />}
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <Text style={styles.title}>{title}</Text>
                    {!!helper && <Text style={styles.helper}>{helper}</Text>}

                    <View style={styles.heroCard}>
                        <Text style={styles.heroCap}>{currencySymbol === '₹' ? 'INR' : currencySymbol}</Text>
                        <View style={styles.amountRow}>
                            <Text style={styles.heroSymbol}>{currencySymbol}</Text>
                            <TextInput
                                style={[styles.heroInput, !!error && { color: colors.loss }]}
                                value={amount}
                                onChangeText={onAmountChange}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={colors.ink3}
                            />
                        </View>
                    </View>

                    {!!error && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {!!chipPresets && chipPresets.length > 0 && (
                        <View style={styles.chipRow}>
                            {chipPresets.map((raw, idx) => {
                                const num = typeof raw === 'number' ? raw : parseInt(String(raw).replace(/,/g, ''), 10);
                                const label = typeof raw === 'string' ? raw : formatMoney(num, { compact: true });
                                const isActive = amount.replace(/,/g, '') === String(num);
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.chip, isActive && styles.chipActive]}
                                        onPress={() => onChipPress?.(num)}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    {footerAbove}
                    {!!footerHint && <Text style={styles.footerHint}>{footerHint}</Text>}
                    <Button
                        title={continueLabel}
                        onPress={onContinue}
                        loading={continueLoading}
                        disabled={continueDisabled}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const makeStyles = (c: Palette, t: ReturnType<typeof useTheme>['typography']) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: c.canvas },
        stepBar: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, paddingTop: 8 },
        stepDot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: c.surfaceAlt },
        stepDotDone: { backgroundColor: c.accent },

        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6,
        },
        back: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
        backArrow: { color: c.ink1, fontSize: 18, marginTop: -2 },
        stepCap: { color: c.ink3, fontSize: 11, letterSpacing: 1.4, fontFamily: fontFor('semibold') },
        skipBtn: { paddingVertical: 6, paddingHorizontal: 6 },
        skipText: { color: c.accent, fontSize: 13, fontFamily: fontFor('medium') },

        scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
        title: { color: c.ink1, fontSize: 22, fontFamily: fontFor('bold'), letterSpacing: -0.4 },
        helper: { color: c.ink2, fontSize: 13, marginTop: 6, lineHeight: 18 },

        heroCard: {
            marginTop: 20,
            backgroundColor: c.surface,
            borderWidth: 1, borderColor: c.border,
            borderRadius: 20,
            paddingVertical: 20, paddingHorizontal: 16,
            alignItems: 'center',
        },
        heroCap: { color: c.ink3, fontSize: 11, letterSpacing: 1.2, fontFamily: fontFor('semibold') },
        amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
        heroSymbol: { color: c.ink1, fontSize: 36, lineHeight: 44, fontFamily: fontFor('bold'), letterSpacing: -1, marginRight: 4, includeFontPadding: false },
        heroInput: {
            color: c.ink1,
            fontSize: 36,
            lineHeight: 44,
            fontFamily: fontFor('bold'),
            letterSpacing: -1,
            minWidth: 60,
            padding: 0,
            fontVariant: ['tabular-nums'],
            includeFontPadding: false,
            textAlignVertical: 'center',
        },

        errorBanner: {
            marginTop: 12,
            backgroundColor: c.lossSoft,
            borderRadius: 10,
            paddingVertical: 10, paddingHorizontal: 12,
        },
        errorText: { color: c.loss, fontSize: 13, lineHeight: 18 },

        chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
        chip: {
            paddingVertical: 8, paddingHorizontal: 14,
            backgroundColor: c.surfaceAlt,
            borderRadius: 999,
        },
        chipActive: { backgroundColor: c.accent },
        chipText: { color: c.ink2, fontSize: 13, fontFamily: fontFor('medium'), fontVariant: ['tabular-nums'] },
        chipTextActive: { color: c.accentInk },

        footer: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
        footerHint: { color: c.ink3, fontSize: 12, textAlign: 'center', lineHeight: 18 },
    });
