import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../constants';

interface BackButtonProps {
    onPress: () => void;
    style?: ViewStyle;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress, style }) => {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.7}>
            <Text style={styles.icon}>{'‹'}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        color: colors.textPrimary,
        fontSize: 24,
        fontWeight: '300',
        marginTop: -2,
    },
});
