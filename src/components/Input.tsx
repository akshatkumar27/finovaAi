import React from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
} from 'react-native';
import { colors, typography } from '../constants';

interface InputProps extends TextInputProps {
    label?: string;
    icon?: React.ReactNode;
    containerStyle?: ViewStyle;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    icon,
    containerStyle,
    error,
    ...textInputProps
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, !!error && styles.inputError]}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    style={styles.input}
                    placeholderTextColor={colors.textMuted}
                    {...textInputProps}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        fontWeight: typography.medium,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
    },
    inputError: {
        borderColor: colors.error,
    },
    iconContainer: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: typography.body,
        paddingVertical: 16,
    },
    errorText: {
        color: colors.error,
        fontSize: typography.caption,
        marginTop: 4,
    },
});
