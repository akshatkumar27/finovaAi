import React, { useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { colors, typography } from '../constants';

interface OTPInputProps {
    value: string;
    onChangeText: (text: string) => void;
    length?: number;
}

export const OTPInput: React.FC<OTPInputProps> = ({
    value,
    onChangeText,
    length = 6,
}) => {
    const inputRef = useRef<TextInput>(null);
    const digits = value.split('');

    const handlePress = () => {
        inputRef.current?.focus();
    };

    const handleChange = (text: string) => {
        // Only allow numbers and limit to length
        const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
        onChangeText(cleaned);
    };

    return (
        <Pressable onPress={handlePress}>
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
                style={styles.hiddenInput}
                value={value}
                onChangeText={handleChange}
                keyboardType="number-pad"
                maxLength={length}
                autoFocus
            />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    box: {
        width: 48,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
    },
    boxActive: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    boxFilled: {
        borderColor: colors.border,
    },
    digit: {
        color: colors.textPrimary,
        fontSize: typography.h2,
        fontWeight: typography.semibold,
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        height: 0,
        width: 0,
    },
});
