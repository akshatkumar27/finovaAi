import React, { useMemo, useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
} from 'react-native';
import { useTheme } from '../theme';

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
    onFocus,
    onBlur,
    ...textInputProps
}) => {
    const { colors, typography } = useTheme();
    const [focused, setFocused] = useState(false);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: { marginBottom: 16 },
                label: {
                    color: colors.ink2,
                    fontSize: typography.caption,
                    fontWeight: typography.weightMedium,
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                },
                field: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'transparent',
                    paddingHorizontal: 16,
                    minHeight: 52,
                },
                focused: {
                    borderColor: colors.accent,
                    backgroundColor: colors.surface,
                },
                errored: { borderColor: colors.loss },
                iconContainer: { marginRight: 12 },
                input: {
                    flex: 1,
                    color: colors.ink1,
                    fontSize: typography.body,
                    paddingVertical: 14,
                },
                errorText: { color: colors.loss, fontSize: typography.caption, marginTop: 4 },
            }),
        [colors, typography],
    );

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.field, focused && styles.focused, !!error && styles.errored]}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    style={styles.input}
                    placeholderTextColor={colors.ink3}
                    {...textInputProps}
                    onFocus={(e) => { setFocused(true); onFocus?.(e); }}
                    onBlur={(e) => { setFocused(false); onBlur?.(e); }}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};
