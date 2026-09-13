import React, { useMemo, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { Palette } from '../theme/palette';

interface OTPInputProps {
    value: string;
    onChangeText: (text: string) => void;
    length?: number;
}

export const OTPInput: React.FC<OTPInputProps> = ({ value, onChangeText, length = 6 }) => {
    const inputRef = useRef<TextInput>(null);
    const digits = value.split('');
    const { colors, typography } = useTheme();
    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const handleChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
        onChangeText(cleaned);
    };

    return (
        <Pressable onPress={() => inputRef.current?.focus()}>
            <View style={styles.container}>
                {Array.from({ length }).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.box,
                            index === value.length && styles.boxActive,
                            !!digits[index] && styles.boxFilled,
                        ]}
                    >
                        <Text style={styles.digit}>{digits[index] || ''}</Text>
                    </View>
                ))}
            </View>
            <TextInput
                ref={inputRef}
                style={styles.hidden}
                value={value}
                onChangeText={handleChange}
                keyboardType="number-pad"
                maxLength={length}
                autoFocus
            />
        </Pressable>
    );
};

const makeStyles = (c: Palette, t: ReturnType<typeof useTheme>['typography']) =>
    StyleSheet.create({
        container: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
        box: {
            flex: 1,
            aspectRatio: 0.75,
            maxWidth: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'transparent',
            backgroundColor: c.surfaceAlt,
            justifyContent: 'center',
            alignItems: 'center',
        },
        boxActive: { borderColor: c.accent, backgroundColor: c.surface },
        boxFilled: { borderColor: c.border, backgroundColor: c.surface },
        digit: {
            color: c.ink1,
            fontSize: 22,
            fontWeight: t.weightBold,
            letterSpacing: -0.5,
        },
        hidden: { position: 'absolute', opacity: 0, height: 0, width: 0 },
    });
