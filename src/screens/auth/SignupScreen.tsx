import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { toast } from 'sonner-native';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Input, Button, BackButton } from '../../components';
import { API_BASE_URL } from '../../constants';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useTheme } from '../../theme';
import { Palette } from '../../theme/palette';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export const SignupScreen: React.FC = () => {
    const navigation = useNavigation<SignupScreenNavigationProp>();
    const { colors, typography } = useTheme();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [loading, setLoading] = useState(false);

    const [emailError, setEmailError] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    const [ageError, setAgeError] = useState('');

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    const validateEmail = (value: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) { setEmailError('Email is required'); return false; }
        if (!emailRegex.test(value)) { setEmailError('Enter a valid email'); return false; }
        setEmailError(''); return true;
    };
    const validateFullName = (value: string): boolean => {
        if (!value.trim()) { setFullNameError('Name is required'); return false; }
        if (value.trim().length < 2) { setFullNameError('Name is too short'); return false; }
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) { setFullNameError('Letters only'); return false; }
        setFullNameError(''); return true;
    };
    const validateAge = (value: string): boolean => {
        if (!value.trim()) { setAgeError('Age is required'); return false; }
        const n = parseInt(value, 10);
        if (isNaN(n)) { setAgeError('Enter a number'); return false; }
        if (n < 18) { setAgeError('Must be 18 or older'); return false; }
        if (n > 90) { setAgeError('Enter a valid age'); return false; }
        setAgeError(''); return true;
    };

    const handleContinue = async () => {
        if (!email.trim() || !fullName.trim() || !age.trim()) {
            toast.error('Incomplete', { description: 'Please fill out both fields.' });
            return;
        }
        const ok = validateEmail(email) && validateFullName(fullName) && validateAge(age);
        if (!ok) {
            toast.error('Invalid input', { description: 'Please fix the errors and try again.' });
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, { email, name: fullName, age });
            navigation.navigate('OTPVerification', {
                email,
                otpToken: response.data.otpToken,
                isSignupFlow: true,
                signupData: { name: fullName, age },
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error('Error', { description: error.response?.data?.message || 'Failed to send code.' });
            } else {
                toast.error('Error', { description: 'Something went wrong.' });
            }
        } finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <BackButton onPress={() => navigation.goBack()} />
                    <View style={styles.mark}><Text style={styles.markText}>Fn</Text></View>
                    <Text style={styles.title}>Let's set you up.</Text>
                    <Text style={styles.subtitle}>Three things and you're in.</Text>

                    <Input
                        label="YOUR NAME"
                        placeholder="Anaya Kulkarni"
                        value={fullName}
                        onChangeText={(v) => { const f = v.replace(/[^a-zA-Z\s]/g, ''); setFullName(f); if (fullNameError) validateFullName(f); }}
                        onBlur={() => validateFullName(fullName)}
                        autoComplete="name"
                        error={fullNameError}
                    />
                    <Input
                        label="EMAIL"
                        placeholder="you@work.com"
                        value={email}
                        onChangeText={(v) => { setEmail(v); if (emailError) validateEmail(v); }}
                        onBlur={() => validateEmail(email)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        error={emailError}
                    />
                    <Input
                        label="AGE"
                        placeholder="25"
                        value={age}
                        onChangeText={(v) => { const f = v.replace(/[^0-9]/g, ''); setAge(f); if (ageError) validateAge(f); }}
                        onBlur={() => validateAge(age)}
                        keyboardType="number-pad"
                        error={ageError}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.legal}>
                            By continuing you agree to our <Text style={styles.legalLink}>Terms</Text> and{' '}
                            <Text style={styles.legalLink}>Privacy</Text>.
                        </Text>
                        <Button title="Create account" onPress={handleContinue} loading={loading} />
                        <TouchableOpacity style={styles.altLink} onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.altText}>Already have an account? <Text style={styles.altAccent}>Log in</Text></Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const makeStyles = (c: Palette, t: ReturnType<typeof useTheme>['typography']) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: c.canvas },
        scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
        back: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
        backArrow: { color: c.ink1, fontSize: 18, marginTop: -2 },
        mark: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.ink1, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
        markText: { color: c.canvas, fontWeight: t.weightBold, fontSize: 15, letterSpacing: -0.4 },
        title: { color: c.ink1, fontSize: 26, fontWeight: t.weightBold, letterSpacing: -0.5, marginTop: 24, marginBottom: 6 },
        subtitle: { color: c.ink2, fontSize: 14, lineHeight: 20, marginBottom: 24 },
        footer: { marginTop: 'auto', paddingTop: 12, gap: 10 },
        legal: { color: c.ink3, fontSize: 12, lineHeight: 18 },
        legalLink: { color: c.accent, fontWeight: t.weightMedium },
        altLink: { alignItems: 'center', marginTop: 4 },
        altText: { color: c.ink3, fontSize: 13 },
        altAccent: { color: c.accent, fontWeight: t.weightMedium },
    });
