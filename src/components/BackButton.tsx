import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { useTheme } from '../theme';
import { Palette } from '../theme/palette';

interface BackButtonProps {
    onPress: () => void;
    style?: ViewStyle;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress, style }) => {
    const { colors } = useTheme();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.7}>
            <Icon name="chevron-left" size="lg" color="ink1" />
        </TouchableOpacity>
    );
};

const makeStyles = (c: Palette) =>
    StyleSheet.create({
        button: {
            width: 34,
            height: 34,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.surface,
            justifyContent: 'center',
            alignItems: 'center',
        },
    });
