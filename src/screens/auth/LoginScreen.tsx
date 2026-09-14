import React, { useMemo, useState } from 'react';
import { View,
    Text,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity, Image } from 'react-native';
import { toast } from 'sonner-native';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input, Button } from '../../components';
import { API_BASE_URL } from '../../constants';
import { useTheme, fontFor } from '../../theme';

type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    OTPVerification: { email: string; otpToken: string };
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { colors, typography, isDark } = useTheme();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

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
        if (emailError) validateEmail(value);
    };

    const handleContinue = async () => {
        if (!validateEmail(email)) {
            toast.error('Invalid Email', { description: emailError || 'Please enter a valid email address.' });
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, { email });
            await AsyncStorage.setItem('temp_auth_email', email);
            navigation.navigate('OTPVerification', { email, otpToken: response.data.otpToken });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
                toast.error('Error', { description: errorMessage });
            } else {
                toast.error('Error', { description: 'Something went wrong. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.mark}>
                        <Image
                            source={require('../../asset/logo-white-tight.png')}
                            style={styles.markInner}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.title}>Welcome to Finova.</Text>
                    <Text style={styles.subtitle}>
                        Enter the email you use for money things. We'll send a 6-digit code.
                    </Text>

                    <Input
                        label="EMAIL"
                        placeholder="you@work.com"
                        value={email}
                        onChangeText={handleEmailChange}
                        onBlur={() => validateEmail(email)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        error={emailError}
                    />

                    <View style={styles.footer}>
                        <Button title="Send code" onPress={handleContinue} loading={loading} />
                        <TouchableOpacity style={styles.signup} onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.signupText}>
                                New here? <Text style={styles.signupLink}>Create account</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors'], t: ReturnType<typeof useTheme>['typography']) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: c.canvas },
        flex: { flex: 1 },
        scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
        mark: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
        markInner: { width: 24, height: 24 },
        title: { color: c.ink1, fontSize: 26, fontFamily: fontFor('bold'), letterSpacing: -0.5, marginTop: 28, marginBottom: 6 },
        subtitle: { color: c.ink2, fontSize: 14, lineHeight: 20, marginBottom: 24 },
        footer: { marginTop: 'auto' },
        signup: { alignItems: 'center', marginTop: 16 },
        signupText: { color: c.ink3, fontSize: 13 },
        signupLink: { color: c.accent, fontFamily: fontFor('medium') },
    });
