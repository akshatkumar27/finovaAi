import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Logo, Input, Button, FooterLinks, AnimatedMascot } from '../../components';
import { colors, typography, spacing, API_BASE_URL } from '../../constants';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export const SignupScreen: React.FC = () => {
    const navigation = useNavigation<SignupScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [loading, setLoading] = useState(false);

    // Error states
    const [emailError, setEmailError] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    const [ageError, setAgeError] = useState('');

    // Validation functions
    const validateEmail = (value: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
            setEmailError('Email is required');
            return false;
        }
        if (!emailRegex.test(value)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validateFullName = (value: string): boolean => {
        if (!value.trim()) {
            setFullNameError('Full name is required');
            return false;
        }
        if (value.trim().length < 2) {
            setFullNameError('Name must be at least 2 characters');
            return false;
        }
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
            setFullNameError('Name can only contain letters');
            return false;
        }
        setFullNameError('');
        return true;
    };

    const validateAge = (value: string): boolean => {
        if (!value.trim()) {
            setAgeError('Age is required');
            return false;
        }
        const ageNum = parseInt(value, 10);
        if (isNaN(ageNum)) {
            setAgeError('Please enter a valid age');
            return false;
        }
        if (ageNum < 18) {
            setAgeError('You must be at least 18 years old');
            return false;
        }
        if (ageNum > 90) {
            setAgeError('Age must not be more than 90');
            return false;
        }
        setAgeError('');
        return true;
    };

    // Change handlers with live validation
    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (emailError) validateEmail(value);
    };

    const handleFullNameChange = (value: string) => {
        // Only allow letters and spaces
        const filteredValue = value.replace(/[^a-zA-Z\s]/g, '');
        setFullName(filteredValue);
        if (fullNameError) validateFullName(filteredValue);
    };

    const handleAgeChange = (value: string) => {
        // Only allow numbers
        const filteredValue = value.replace(/[^0-9]/g, '');
        setAge(filteredValue);
        if (ageError) validateAge(filteredValue);
    };

    const validateAllFields = (): boolean => {
        const isEmailValid = validateEmail(email);
        const isNameValid = validateFullName(fullName);
        const isAgeValid = validateAge(age);
        return isEmailValid && isNameValid && isAgeValid;
    };

    const handleContinue = async () => {
        if (!email.trim() || !fullName.trim() || !age.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Incomplete Form',
                text2: 'Please fill out all fields before continuing.',
            });
            return;
        }

        if (!validateAllFields()) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Input',
                text2: 'Please correct the errors in the form before continuing.',
            });
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, {
                email: email,
                name: fullName,
                age: age,
            });
            console.log('OTP sent successfully:', response.data);
            navigation.navigate('OTPVerification', {
                email,
                otpToken: response.data.otpToken,
                isSignupFlow: true,
                signupData: {
                    name: fullName,
                    age: age,
                },
            });
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

    const handleLogin = () => {
        navigation.navigate('Login');
    };

    const isFormValid = email.trim() && fullName.trim() && age.trim();

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
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Logo size="medium" />
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>
                            Join Finova AI for smarter wealth management.
                        </Text>

                        <View style={styles.form}>
                            <Input
                                label="FULL NAME"
                                placeholder="John Doe"
                                value={fullName}
                                onChangeText={handleFullNameChange}
                                onBlur={() => validateFullName(fullName)}
                                autoComplete="name"
                                icon={<Text style={styles.inputIcon}>👤</Text>}
                                error={fullNameError}
                            />

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

                            <Input
                                label="AGE"
                                placeholder="25"
                                value={age}
                                onChangeText={handleAgeChange}
                                onBlur={() => validateAge(age)}
                                keyboardType="number-pad"
                                icon={<Text style={styles.inputIcon}>📅</Text>}
                                error={ageError}
                            />
                        </View>

                        <Button
                            title="Continue"
                            onPress={handleContinue}
                            loading={loading}
                        />
                    </View>

                    {/* Mascot at the bottom */}
                    <View style={styles.mascotContainer}>
                        <AnimatedMascot text="Let's get you started! 🎉" arrowTopRatio={0.15} mascotWidth={100} customTooltipStyle={{ marginTop: 30 }}
                            mascotHeight={160} />
                    </View>

                    <View style={styles.footer}>
                        <FooterLinks
                            showAuthLink
                            authLinkType="login"
                            onAuthLinkPress={handleLogin}
                        />
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
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    title: {
        color: colors.textPrimary,
        fontSize: typography.h1,
        fontWeight: typography.bold as any,
        marginBottom: spacing.sm,
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: typography.body,
        marginBottom: spacing.lg,
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
        paddingBottom: spacing.md,
        marginTop: 'auto',
    },
});
