import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, typography } from '../constants';

interface LogoProps {
    size?: 'small' | 'medium' | 'large';
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium' }) => {
    const iconSize = size === 'small' ? 48 : size === 'large' ? 80 : 64;
    const fontSize = size === 'small' ? 14 : size === 'large' ? 20 : 16;

    return (
        <View style={styles.container}>
            <Image
                source={require('../asset/logotrans.png')}
                style={{ width: iconSize, height: iconSize, borderRadius: iconSize / 4, marginBottom: 0 }}
                resizeMode="contain"
            />
            <Text style={[styles.brandName, { fontSize }]}>Finova AI</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    brandName: {
        color: colors.textPrimary,
        fontWeight: typography.semibold,
        letterSpacing: 2,
    },
});
