import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Animated,
    Easing,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, fontFor } from '../theme';
import { Palette } from '../theme/palette';

// A branded splash for the pre-auth loading state.
//   ┌──────────────────┐   canvas
//   │                  │
//   │      [F]         │   theme-aware mark (128 dp)
//   │   Finova AI      │   wordmark, Inter SemiBold, letter-spacing 2
//   │  Grow your money.│   tagline, Inter Regular, ink3
//   │                  │
//   │    ● ● ●         │   pulsing progress dots (accent)
//   │                  │
//   │   Finova AI · v1 │   version footer, ink3
//   └──────────────────┘
export const SplashScreen: React.FC = () => {
    const { isDark, colors } = useTheme();
    const styles = React.useMemo(() => makeStyles(colors), [colors]);

    const source = isDark
        ? require('../asset/logotrans-dark.png')
        : require('../asset/logotrans-light.png');

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.canvas}
            />

            {/* Center: mark + wordmark + tagline */}
            <View style={styles.center}>
                <Image source={source} style={styles.mark} resizeMode="contain" />
                <Text style={styles.wordmark}>Finova AI</Text>
                <Text style={styles.tagline}>Grow your money.</Text>
            </View>

            {/* Bottom: progress dots + version */}
            <View style={styles.bottom}>
                <PulsingDots color={colors.accent} />
                <Text style={styles.version}>Finova AI · v1.0</Text>
            </View>
        </SafeAreaView>
    );
};

// Three dots pulsing in sequence — a subtler, more branded progress cue
// than ActivityIndicator, and stays on-brand in both themes.
const PulsingDots: React.FC<{ color: string }> = ({ color }) => {
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

    return (
        <View style={dotStyles.row}>
            {dots.map((v, i) => (
                <Animated.View
                    key={i}
                    style={[
                        dotStyles.dot,
                        { backgroundColor: color, opacity: v, transform: [{ scale: v }] },
                    ]}
                />
            ))}
        </View>
    );
};

const dotStyles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    dot: { width: 8, height: 8, borderRadius: 4 },
});

const makeStyles = (c: Palette) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.canvas,
        },
        center: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
        },
        mark: {
            width: 96,
            height: 96,
            marginBottom: 20,
        },
        wordmark: {
            color: c.ink1,
            fontFamily: fontFor('semibold'),
            fontSize: 22,
            letterSpacing: 2,
        },
        tagline: {
            color: c.ink3,
            fontFamily: fontFor('regular'),
            fontSize: 14,
            marginTop: 8,
            letterSpacing: 0.2,
        },
        bottom: {
            alignItems: 'center',
            paddingBottom: 16,
        },
        version: {
            color: c.ink3,
            fontFamily: fontFor('regular'),
            fontSize: 11,
            letterSpacing: 0.4,
        },
    });
