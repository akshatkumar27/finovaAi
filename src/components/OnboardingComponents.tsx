import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../constants';

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

const styles = StyleSheet.create({
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    optionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '15',
    },
    icon: {
        fontSize: 20,
        marginRight: 12,
    },
    label: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.medium,
    },
    labelSelected: {
        color: colors.primary,
    },
    sublabel: {
        color: colors.textMuted,
        fontSize: typography.caption,
        marginLeft: 8,
    },
    checkmark: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: typography.bold,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 8,
        marginBottom: 8,
    },
    chipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipLabel: {
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
        fontWeight: typography.medium,
    },
    chipLabelSelected: {
        color: colors.textPrimary,
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
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterButtonDisabled: {
        opacity: 0.3,
    },
    counterButtonText: {
        color: colors.textPrimary,
        fontSize: 24,
        fontWeight: '300',
    },
    counterValue: {
        color: colors.textPrimary,
        fontSize: 48,
        fontWeight: typography.bold,
        marginHorizontal: 32,
    },
});
