import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../constants';

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

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 2,
        borderColor: colors.border,
    },
    cardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '15',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.inputBackground,
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
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: typography.semibold,
        flex: 1,
        marginRight: spacing.sm,
    },
    titleSelected: {
        color: colors.primary,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    amountBadge: {
        backgroundColor: 'rgba(45, 127, 249, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(45, 127, 249, 0.2)',
    },
    amountText: {
        color: colors.primary,
        fontSize: typography.bodySmall,
        fontWeight: typography.bold,
    },
    description: {
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
        lineHeight: 20,
    },
    checkContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm,
    },
    checkmark: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: typography.bold,
    },
});
