import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { typography } from '../constants';
import { useTheme } from '../theme';
import { Palette } from '../theme/palette';
import { fontFor } from '../theme/tokens';

const makeStyles = (colors: Palette) =>
    StyleSheet.create({
        option: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
        },
        optionSelected: {
            borderColor: colors.accent,
            backgroundColor: colors.accentSoft,
        },
        icon: {
            fontSize: 20,
            marginRight: 12,
        },
        label: {
            flex: 1,
            color: colors.ink1,
            fontSize: typography.body,
            fontWeight: typography.medium,
        },
        labelSelected: {
            color: colors.accent,
        },
        sublabel: {
            color: colors.ink2,
            fontSize: typography.caption,
            marginLeft: 8,
        },
        checkmark: {
            color: colors.accent,
            fontSize: 18,
            fontWeight: typography.bold,
        },
        chip: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            marginRight: 8,
            marginBottom: 8,
        },
        chipSelected: {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
        },
        chipLabel: {
            color: colors.ink2,
            fontSize: typography.bodySmall,
            fontWeight: typography.medium,
        },
        chipLabelSelected: {
            color: colors.accentInk,
        },
        counterContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        counterButton: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
        },
        counterButtonDisabled: {
            opacity: 0.3,
        },
        counterButtonText: {
            color: colors.ink1,
            fontSize: 24,
            fontFamily: fontFor('regular'),
        },
        counterValue: {
            color: colors.ink1,
            fontSize: 48,
            fontWeight: typography.bold,
            marginHorizontal: 32,
        },
    });

const useStyles = () => {
    const { colors } = useTheme();
    return useMemo(() => makeStyles(colors), [colors]);
};

interface SelectOptionProps {
    icon?: string;
    label: string;
    sublabel?: string;
    selected: boolean;
    onPress: () => void;
    style?: ViewStyle;
}

export const SelectOption: React.FC<SelectOptionProps> = ({
    icon,
    label,
    sublabel,
    selected,
    onPress,
    style,
}) => {
    const styles = useStyles();
    return (
        <TouchableOpacity
            style={[styles.option, selected && styles.optionSelected, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
            {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
            {selected && (
                <Text style={styles.checkmark}>✓</Text>
            )}
        </TouchableOpacity>
    );
};

interface ChipOptionProps {
    label: string;
    selected: boolean;
    onPress: () => void;
}

export const ChipOption: React.FC<ChipOptionProps> = ({
    label,
    selected,
    onPress,
}) => {
    const styles = useStyles();
    return (
        <TouchableOpacity
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
        </TouchableOpacity>
    );
};

interface CounterProps {
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
    min?: number;
    max?: number;
}

export const Counter: React.FC<CounterProps> = ({
    value,
    onIncrement,
    onDecrement,
    min = 0,
    max = 10,
}) => {
    const styles = useStyles();
    return (
        <TouchableOpacity style={styles.counterContainer}>
            <TouchableOpacity
                style={[styles.counterButton, value <= min && styles.counterButtonDisabled]}
                onPress={onDecrement}
                disabled={value <= min}
            >
                <Text style={styles.counterButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{value}</Text>
            <TouchableOpacity
                style={[styles.counterButton, value >= max && styles.counterButtonDisabled]}
                onPress={onIncrement}
                disabled={value >= max}
            >
                <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
};
