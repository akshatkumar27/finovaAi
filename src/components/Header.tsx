import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BackButton } from './BackButton';
import { colors, typography, spacing } from '../constants';

interface HeaderProps {
    title?: string;
    titleStyle?: TextStyle;
    rightElement?: React.ReactNode;
    onBack?: () => void;
    style?: ViewStyle;
    showBackButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    titleStyle,
    rightElement,
    onBack,
    style,
    showBackButton = true,
}) => {
    const navigation = useNavigation();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.container, style]}>
            {/* Absolute Centered Title */}
            <View style={styles.titleContainer} pointerEvents="none">
                {title && (
                    <Text style={[styles.title, titleStyle]} numberOfLines={1}>
                        {title}
                    </Text>
                )}
            </View>

            {/* Left Element (Back Button) */}
            <View style={styles.leftContainer}>
                {showBackButton && <BackButton onPress={handleBack} />}
            </View>

            {/* Right Element */}
            <View style={styles.rightContainer}>
                {rightElement}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 56, // Standard header height
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    titleContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: -1, // Ensure it doesn't block touch events for buttons, but buttons need to be higher? 
        // Actually pointerEvents="none" on this container handles the touch logic.
        // We just need to make sure text renders correctly.
        paddingHorizontal: 60, // Prevent overlap with standard buttons
    },
    title: {
        color: colors.textPrimary,
        fontSize: typography.h3,
        fontWeight: typography.semibold,
        textAlign: 'center',
    },
    leftContainer: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        minWidth: 40,
        zIndex: 1,
    },
    rightContainer: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        minWidth: 40,
        zIndex: 1,
    },
});
