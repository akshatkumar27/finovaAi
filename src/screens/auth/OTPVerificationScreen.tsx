import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { BackButton, OTPInput, Button } from '../../components';
import { colors, typography, spacing, API_BASE_URL } from '../../constants';
import { notificationService } from '../../services/NotificationService';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { api } from '../../services';

type OTPVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

export const OTPVerificationScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<OTPVerificationScreenRouteProp>();
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(54);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [otpToken, setOtpToken] = useState(route.params?.otpToken || '');

    const email = route.params?.email || 'user@example.com';
    const isSignupFlow = route.params?.isSignupFlow || false;
    const signupData = route.params?.signupData;

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    useEffect(() => {
        if (otp.length === 6) {
            handleVerify();
        }
    }, [otp]);

    const handleVerify = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`,
                (isSignupFlow && signupData) ? {
                    otpToken: otpToken,
                    code: otp,
                    name: signupData.name,
                    age: signupData.age
                } :
                    {
                        otpToken: otpToken,
                        code: otp,
                    });
            console.log('OTP verified successfully:', response.data);

            // Save token to AsyncStorage
            await AsyncStorage.setItem('authToken', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

            // If signup flow, store additional signup data
            if (isSignupFlow && signupData) {
                await AsyncStorage.setItem('signupData', JSON.stringify(signupData));
            }

            // Register FCM Token
            try {
                const fcmToken = await notificationService.getFCMToken();
                if (fcmToken) {
                    await axios.post(
                        `${API_BASE_URL}/api/notifications/register-token`,
                        {
                            fcm_token: fcmToken,
                            device_type: Platform.OS,
                        },
                        {
                            headers: { Authorization: `Bearer ${response.data.token}` }
                        }
                    );
                    console.log('FCM Token registered successfully');
                }
            } catch (fcmError) {
                console.error('Failed to register FCM token:', fcmError);
                // Non-blocking error
            }

            // Check if user is new or if onboarding data is missing
            const user = response.data.user;
            console.log('response.data.user?.isNewUser00', user);

            // Save onboardingData and financial profile status
            if (user) {
                const payload = {
                    monthly_income: user.monthly_income || 0,
                    monthly_expenses: user.monthly_expenses || 0,
                    monthly_emi: user.monthly_emi || 0,
                    emi_outstanding: user.emi_outstanding || 0,
                    monthly_investment: user.monthly_investment || 0,
                };
                await AsyncStorage.setItem('onboardingData', JSON.stringify(payload));
            }

            // Use the status in place of the old isOnboardingIncomplete check

            const isFinancialProfilePresent = await AsyncStorage.getItem('isFinancialProfilePresent');
            const meRes = await api.get('/api/auth/me');
            const meData = meRes.data;


            // Save in global storage
            await AsyncStorage.setItem('isFinancialProfilePresent', JSON.stringify(meData?.user?.isFinancialProfilePresent || false));

            const isOnboardingIncomplete = meData?.user?.isFinancialProfilePresent;
            console.log('isOnboardingIncomplete--', isOnboardingIncomplete, typeof (isFinancialProfilePresent));
            if (!isOnboardingIncomplete) {
                // Set status to start of onboarding
                // await AsyncStorage.setItem('onboardingStatus', 'MonthlyIncome'); // Assuming MonthlyIncome is the first screen

                // Navigate to onboarding questions
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Onboarding' as never }],
                });
            } else {
                // Completed
                // await AsyncStorage.setItem('onboardingStatus', 'COMPLETED');
                await AsyncStorage.removeItem('temp_auth_email');

                // Navigate to main app
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' as never }],
                });
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            setOtp('');
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Invalid OTP. Please try again.';
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

    const handleResend = async () => {
        if (timer === 0) {
            setResending(true);
            try {
                const response = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, {
                    email: email,
                });
                setOtpToken(response.data.otpToken);
                setTimer(54);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'OTP has been resent to your email.',
                });
            } catch (error) {
                console.error('Error resending OTP:', error);
                if (axios.isAxiosError(error)) {
                    const errorMessage = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
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
                setResending(false);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <BackButton onPress={() => navigation.goBack()} />
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>Verify your email</Text>
                    <Text style={styles.subtitle}>
                        We've sent a 6-digit code to
                    </Text>
                    <View style={styles.emailContainer}>
                        <Text style={styles.email}>{email}</Text>
                        <Text style={styles.editLink} onPress={() => navigation.goBack()}>Edit</Text>
                    </View>
                    <View style={styles.otpContainer}>
                        <OTPInput value={otp} onChangeText={setOtp} length={6} />
                    </View>

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive the code? </Text>
                        <TouchableOpacity onPress={handleResend} disabled={timer > 0 || resending}>
                            <Text style={[styles.resendLink, (timer > 0 || resending) && styles.resendDisabled]}>
                                {resending ? 'Sending...' : `Resend Code ${timer > 0 ? `(${formatTime(timer)})` : ''}`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Verify & Continue"
                        onPress={handleVerify}
                        loading={loading}
                        disabled={otp.length < 6}
                    />
                </View>
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
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
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
        lineHeight: 24,
    },
    email: {
        color: colors.primary,
    },
    editLink: {
        color: colors.link,
        textDecorationLine: 'underline',
        marginLeft: spacing.sm,
    },
    emailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: spacing.sm,
    },
    otpContainer: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.lg,
        flexWrap: 'wrap',
    },
    resendText: {
        color: colors.textSecondary,
        fontSize: typography.bodySmall,
    },
    resendLink: {
        color: colors.link,
        fontSize: typography.bodySmall,
        fontWeight: typography.semibold,
    },
    resendDisabled: {
        color: colors.textMuted,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
});
