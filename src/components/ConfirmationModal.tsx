import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ActivityIndicator,
} from 'react-native';
import { Icon, IconName } from './Icon';
import { useTheme, fontFor } from '../theme';
import { Palette } from '../theme/palette';

interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'success' | 'error' | 'warning' | 'info';
    showCancelButton?: boolean;
    loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    visible,
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'info',
    showCancelButton = true,
    loading = false,
}) => {
    const { colors, typography } = useTheme();
    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const iconMap: Record<string, { icon: IconName; tint: string; tintBg: string; confirmBg: string }> = {
        success: { icon: 'check', tint: colors.gain, tintBg: colors.gainSoft, confirmBg: colors.accent },
        error:   { icon: 'x-circle', tint: colors.loss, tintBg: colors.lossSoft, confirmBg: colors.loss },
        warning: { icon: 'alert-triangle', tint: colors.warn, tintBg: colors.warnSoft, confirmBg: colors.accent },
        info:    { icon: 'info', tint: colors.accent, tintBg: colors.accentSoft, confirmBg: colors.accent },
    };
    const { icon, tint, tintBg, confirmBg } = iconMap[type];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <TouchableWithoutFeedback onPress={onCancel}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.card}>
                            <View style={[styles.iconWrap, { backgroundColor: tintBg }]}>
                                <Icon name={icon} size="lg" color={tint} />
                            </View>

                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.message}>{message}</Text>

                            <View style={styles.buttons}>
                                {showCancelButton && (
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={onCancel}
                                        disabled={loading}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.cancelText}>{cancelText}</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.confirmBtn, { backgroundColor: confirmBg }]}
                                    onPress={onConfirm}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={type === 'error' ? '#FFFFFF' : colors.accentInk} />
                                    ) : (
                                        <Text style={[
                                            styles.confirmText,
                                            { color: type === 'error' ? '#FFFFFF' : colors.accentInk },
                                        ]}>
                                            {confirmText}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const makeStyles = (c: Palette, t: ReturnType<typeof useTheme>['typography']) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
        },
        card: {
            width: '100%',
            backgroundColor: c.surface,
            borderRadius: 20,
            paddingVertical: 24,
            paddingHorizontal: 20,
            borderWidth: 1,
            borderColor: c.border,
        },
        iconWrap: {
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
        },
        title: {
            color: c.ink1,
            fontSize: 18,
            fontFamily: fontFor('bold'),
            letterSpacing: -0.3,
            marginBottom: 6,
        },
        message: {
            color: c.ink2,
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 20,
        },
        buttons: { flexDirection: 'row', gap: 10 },
        cancelBtn: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.borderStrong,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
        },
        cancelText: {
            color: c.ink1,
            fontSize: 14,
            fontFamily: fontFor('semibold'),
        },
        confirmBtn: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
        },
        confirmText: {
            fontSize: 14,
            fontFamily: fontFor('semibold'),
        },
    });
