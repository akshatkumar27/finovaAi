import React, { useMemo } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { useTheme } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    /** @deprecated kept for backward compatibility; ignored in v3 */
    showArrow?: boolean;
    variant?: ButtonVariant;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    style,
    textStyle,
    variant = 'primary',
}) => {
    const { colors, typography } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                button: {
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    minHeight: 52,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                primary: { backgroundColor: colors.accent },
                secondary: { backgroundColor: colors.accentSoft },
                ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderStrong },
                danger: { backgroundColor: colors.loss },
                disabled: { opacity: 0.45 },
                text: {
                    fontSize: typography.body,
                    fontWeight: typography.weightSemibold,
                    letterSpacing: -0.1,
                },
                textPrimary: { color: colors.accentInk },
                textSecondary: { color: colors.accent },
                textGhost: { color: colors.ink1 },
                textDanger: { color: '#FFFFFF' },
            }),
        [colors, typography],
    );

    const variantStyle = styles[variant];
    const textVariantStyle =
        variant === 'primary'
            ? styles.textPrimary
            : variant === 'secondary'
                ? styles.textSecondary
                : variant === 'ghost'
                    ? styles.textGhost
                    : styles.textDanger;

    const spinnerColor = variant === 'primary' || variant === 'danger' ? colors.accentInk : colors.accent;

    return (
        <TouchableOpacity
            style={[styles.button, variantStyle, (disabled || loading) && styles.disabled, style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.85}
        >
            {loading ? (
                <ActivityIndicator color={spinnerColor} />
            ) : (
                <Text style={[styles.text, textVariantStyle, textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};
