import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BackButton } from './BackButton';
import { typography, spacing } from '../constants';
import { useTheme } from '../theme';

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
    const { colors } = useTheme();
    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    height: 56,
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
                    zIndex: -1,
                    paddingHorizontal: 60,
                },
                title: {
                    color: colors.ink1,
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
            }),
        [colors],
    );

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.titleContainer} pointerEvents="none">
                {title && (
                    <Text style={[styles.title, titleStyle]} numberOfLines={1}>
                        {title}
                    </Text>
                )}
            </View>

            <View style={styles.leftContainer}>
                {showBackButton && <BackButton onPress={handleBack} />}
            </View>

            <View style={styles.rightContainer}>
                {rightElement}
            </View>
        </View>
    );
};
