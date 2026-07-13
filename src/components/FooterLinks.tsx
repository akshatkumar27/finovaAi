import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '../constants';

interface FooterLinksProps {
    showAuthLink?: boolean;
    authLinkType?: 'login' | 'signup';
    onAuthLinkPress?: () => void;
}

export const FooterLinks: React.FC<FooterLinksProps> = ({
    showAuthLink = true,
    authLinkType = 'signup',
    onAuthLinkPress,
}) => {
    return (
        <View style={styles.container}>
            {showAuthLink && (
                <View style={styles.authLinkContainer}>
                    <Text style={styles.authText}>
                        {authLinkType === 'signup'
                            ? "Don't have an account? "
                            : 'Already have an account? '}
                    </Text>
                    <TouchableOpacity onPress={onAuthLinkPress}>
                        <Text style={styles.authLink}>
                            {authLinkType === 'signup' ? 'Sign up' : 'Log in'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.termsContainer}>
                <TouchableOpacity>
                    <Text style={styles.termsText}>TERMS OF SERVICE</Text>
                </TouchableOpacity>
                <Text style={styles.separator}>•</Text>
                <TouchableOpacity>
                    <Text style={styles.termsText}>PRIVACY POLICY</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.divider} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingBottom: 24,
    },
    authLinkContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    authText: {
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
    },
    authLink: {
        color: colors.link,
        fontSize: typography.bodySmall,
        fontWeight: typography.semibold,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    termsText: {
        color: colors.textMuted,
        fontSize: typography.caption,
        letterSpacing: 0.5,
    },
    separator: {
        color: colors.textMuted,
        marginHorizontal: 8,
    },
    divider: {
        width: 134,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
    },
});
