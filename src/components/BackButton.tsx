import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                    d="M15 18l-6-6 6-6"
                    stroke={colors.ink1}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
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
