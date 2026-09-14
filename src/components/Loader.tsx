import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import { useTheme } from '../theme';
import { Palette } from '../theme/palette';

interface LoaderProps {
    /** Diameter for the mark. Dots scale below it. Default 64. */
    size?: number;
    /** Show the Finova mark above the dots. Default true. */
    showMark?: boolean;
    /** Extra bottom padding, e.g. for empty-state placement. */
    style?: any;
}

// Single design-system loading indicator used app-wide.
// - Theme-aware Finova mark (teal on light canvas, mint on dark canvas)
// - Three pulsing accent dots below it, matching the SplashScreen pattern
// - useNativeDriver so it stays 60 fps
export const Loader: React.FC<LoaderProps> = ({ size = 64, showMark = true, style }) => {
    const { isDark, colors } = useTheme();
    const dots = useRef([new Animated.Value(0.3), new Animated.Value(0.3), new Animated.Value(0.3)]).current;

    useEffect(() => {
        const loops = dots.map((v, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 180),
                    Animated.timing(v, {
                        toValue: 1,
                        duration: 420,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(v, {
                        toValue: 0.3,
                        duration: 420,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ),
        );
        loops.forEach((l) => l.start());
        return () => loops.forEach((l) => l.stop());
    }, [dots]);

    const source = isDark
        ? require('../asset/logotrans-dark.png')
        : require('../asset/logotrans-light.png');

    return (
        <View style={[styles.container, style]}>
            {showMark && (
                <Image
                    source={source}
                    style={{ width: size, height: size, marginBottom: 16 }}
                    resizeMode="contain"
                />
            )}
            <View style={styles.dots}>
                {dots.map((v, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.dot,
                            { backgroundColor: colors.accent, opacity: v, transform: [{ scale: v }] },
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    dots: { flexDirection: 'row', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
});
