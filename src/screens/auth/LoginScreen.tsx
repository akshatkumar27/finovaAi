import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logo, Input, Button, FooterLinks, AnimatedMascot } from '../../components';
import { colors, typography, spacing, API_BASE_URL } from '../../constants';

type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    OTPVerification: { email: string; otpToken: string };
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);

    const validateEmail = (emailValue: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailValue.trim()) {
            setEmailError('Email is required');
            return false;
        }
        if (!emailRegex.test(emailValue)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (emailError) {
            validateEmail(value);
        }
    };

    const handleContinue = async () => {
        if (!validateEmail(email)) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Email',
                text2: emailError || 'Please enter a valid email address.',
            });
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, {
                email: email,
            });
            console.log('OTP sent successfully:', response.data);

            // Save status for resume capability
            // await AsyncStorage.setItem('onboardingStatus', 'OTP_VERIFICATION');
            await AsyncStorage.setItem('temp_auth_email', email);

            navigation.navigate('OTPVerification', { email, otpToken: response.data.otpToken });
        } catch (error) {
            console.error('Error sending OTP:', error);
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: errorMessage,
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Something went wrong. Please try again.',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = () => {
        navigation.navigate('Signup');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Logo size="large" />
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Log in to manage your wealth with AI.</Text>

                        <View style={styles.form}>
                            <Input
                                label="EMAIL ADDRESS"
                                placeholder="name@domain.com"
                                value={email}
                                onChangeText={handleEmailChange}
                                onBlur={() => validateEmail(email)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                icon={<Text style={styles.inputIcon}>@</Text>}
                                error={emailError}
                            />
                        </View>

                        <Button
                            title="Continue"
                            onPress={handleContinue}
                            loading={loading}
                        />

                        {/* Signup Link */}
                        <TouchableOpacity style={styles.signupLink} onPress={handleSignup}>
                            <Text style={styles.signupText}>
                                New user? <Text style={styles.signupHighlight}>Sign up with Fino 🐼</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Mascot at the bottom */}
                    <View style={styles.mascotContainer}>
                        <AnimatedMascot />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: spacing.xxl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxl,
    },
    title: {
        color: colors.textPrimary,
        fontSize: typography.h1,
        fontWeight: typography.bold,
        marginBottom: spacing.sm,
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: typography.body,
        marginBottom: spacing.xl,
    },
    form: {
        marginBottom: spacing.lg,
    },
    inputIcon: {
        color: colors.textMuted,
        fontSize: typography.body,
    },
    footer: {
        paddingHorizontal: spacing.lg,
    },
    mascotContainer: {
        paddingHorizontal: spacing.xs,
        paddingBottom: spacing.lg,
        marginTop: 'auto',
    },
    signupLink: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    signupText: {
        color: colors.textSecondary,
        fontSize: typography.body,
    },
    signupHighlight: {
        color: colors.primary,
        fontWeight: typography.semibold as any,
    },
});
