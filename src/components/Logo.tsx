import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme, fontFor } from '../theme';

interface LogoProps {
    size?: 'small' | 'medium' | 'large';
}

// Theme-aware Finova mark:
// - dark theme  → logotrans-dark.png  (keeps the cyan glow, reads well on canvas #0E1013)
// - light theme → logotrans-light.png (glow stripped, crisp on canvas #F7F5F0)
export const Logo: React.FC<LogoProps> = ({ size = 'medium' }) => {
    const { isDark, colors } = useTheme();
    const iconSize = size === 'small' ? 48 : size === 'large' ? 80 : 64;
    const fontSize = size === 'small' ? 14 : size === 'large' ? 20 : 16;

    const source = isDark
        ? require('../asset/logotrans-dark.png')
        : require('../asset/logotrans-light.png');

    return (
        <View style={styles.container}>
            <Image
                source={source}
                style={{
                    width: iconSize,
                    height: iconSize,
                    marginBottom: 4,
                }}
                resizeMode="contain"
            />
            <Text
                style={[
                    styles.brandName,
                    { fontSize, color: colors.ink1, fontFamily: fontFor('semibold') },
                ]}
            >
                Finova AI
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    brandName: {
        letterSpacing: 2,
    },
});
