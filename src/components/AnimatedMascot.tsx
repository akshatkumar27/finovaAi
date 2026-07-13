import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import { colors, typography } from '../constants';
import { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

interface AnimatedMascotProps {
    text?: string;
    mascotImage?: ImageSourcePropType;
    mascotWidth?: number;
    mascotHeight?: number;
    /** Fraction of mascotHeight where the arrow should point (0=top, 1=bottom). Default 0.40 targets Fino's mouth. */
    arrowTopRatio?: number;
    customTooltipStyle?: StyleProp<ViewStyle>;
}

export const AnimatedMascot: React.FC<AnimatedMascotProps> = ({
    text = "Hi I'm Fino. Your smart financial assistant",
    mascotImage,
    mascotWidth = 100,
    mascotHeight = 120,
    arrowTopRatio = 0.40,
    customTooltipStyle
}) => {
    // Arrow vertical position: points to Fino's mouth, proportional to current mascot height
    const arrowTop = Math.round(mascotHeight * arrowTopRatio);
    const floatAnim = useRef(new Animated.Value(0)).current;
    const mascotSlideAnim = useRef(new Animated.Value(-150)).current;
    const tooltipOpacity = useRef(new Animated.Value(0)).current;
    const tooltipScale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        // Sequence: Mascot slides in first, then tooltip appears, then floating starts
        Animated.sequence([
            // Step 1: Mascot slides in from left
            Animated.timing(mascotSlideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            // Small delay before tooltip appears
            Animated.delay(100),
            // Step 2: Tooltip fades in with scale
            Animated.parallel([
                Animated.timing(tooltipOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(tooltipScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 100,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            // Step 3: Start continuous floating animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(floatAnim, {
                        toValue: 0,
                        duration: 1500,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    }, []);

    // Interpolate float animation for subtle up/down movement
    const floatTranslateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -12],
    });

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: floatTranslateY }],
                },
            ]}
        >
            {/* Mascot Image on the left */}
            <Animated.View
                style={[
                    styles.mascotContainer,
                    {
                        transform: [{ translateX: mascotSlideAnim }],
                    },
                ]}
            >
                <Image
                    source={mascotImage || require('../asset/mascot.png')}
                    style={[styles.mascotImage, { width: mascotWidth, height: mascotHeight }]}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Speech Bubble Tooltip */}
            <Animated.View
                style={[
                    styles.tooltipContainer,
                    {
                        opacity: tooltipOpacity,
                        transform: [{ scale: tooltipScale }],
                    },
                    customTooltipStyle
                ]}
            >
                {/* Arrow pointing to mascot mouth — positioned at arrowTop px from top of tooltip */}
                <View style={[styles.tooltipArrow, { top: arrowTop, marginTop: -10 }]} />
                <View style={[styles.tooltipArrowInner, { top: arrowTop, marginTop: -8 }]} />

                <View style={styles.tooltipBubble}>
                    <Text style={styles.tooltipText}>{text}</Text>
                </View>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    mascotContainer: {
        zIndex: 2,
    },
    mascotImage: {
        width: 100,
        height: 120,
    },
    tooltipContainer: {
        flex: 1,
        marginLeft: -10,
        position: 'relative',
        paddingTop: 0,
    },
    tooltipArrow: {
        position: 'absolute',
        left: 0,
        width: 0,
        height: 0,
        borderTopWidth: 10,
        borderBottomWidth: 10,
        borderRightWidth: 12,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: 'rgba(255, 255, 255, 0.25)',
        zIndex: 1,
    },
    tooltipArrowInner: {
        position: 'absolute',
        left: 2,
        width: 0,
        height: 0,
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderRightWidth: 10,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: 'rgba(30, 30, 40, 0.95)',
        zIndex: 2,
    },
    tooltipBubble: {
        marginLeft: 10,
        backgroundColor: 'rgba(30, 30, 40, 0.95)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 18,
        paddingVertical: 14,
        // Subtle shadow
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    tooltipText: {
        color: colors.textPrimary || '#FFFFFF',
        fontSize: typography.body || 14,
        fontWeight: '500',
        lineHeight: 20,
    },
});
