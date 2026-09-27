import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../theme';

interface GoalCardProps {
    icon: string;
    title: string;
    description: string;
    selected: boolean;
    onPress: () => void;
    style?: ViewStyle;
    highlightedAmount?: string;
}

export const GoalCard: React.FC<GoalCardProps> = ({
    icon,
    title,
    description,
    selected,
    onPress,
    style,
    highlightedAmount,
}) => {
    const { colors } = useTheme();
    const styles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    padding: spacing.md,
                    marginBottom: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                cardSelected: {
                    borderColor: colors.accent,
                    backgroundColor: colors.accentSoft,
                },
                iconContainer: {
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.surfaceAlt,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: spacing.md,
                },
                icon: {
                    fontSize: 28,
                },
                content: {
                    flex: 1,
                },
                title: {
                    color: colors.ink1,
                    fontSize: typography.body,
                    fontWeight: typography.semibold,
                    flex: 1,
                    marginRight: spacing.sm,
                },
                titleSelected: {
                    color: colors.accent,
                },
                headerRow: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing.xs,
                },
                amountBadge: {
                    backgroundColor: colors.accentSoft,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.accent,
                },
                amountText: {
                    color: colors.accent,
                    fontSize: typography.bodySmall,
                    fontWeight: typography.bold,
                },
                description: {
                    color: colors.ink2,
                    fontSize: typography.bodySmall,
                    lineHeight: 20,
                },
                checkContainer: {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: spacing.sm,
                },
                checkmark: {
                    color: colors.accentInk,
                    fontSize: 16,
                    fontWeight: typography.bold,
                },
            }),
        [colors],
    );

    return (
        <TouchableOpacity
            style={[styles.card, selected && styles.cardSelected, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{icon}</Text>
            </View>
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
                    {highlightedAmount && (
                        <View style={styles.amountBadge}>
                            <Text style={styles.amountText}>{highlightedAmount}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.description}>{description}</Text>
            </View>
            {selected && (
                <View style={styles.checkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};
