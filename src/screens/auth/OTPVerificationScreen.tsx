import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { toast } from 'sonner-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { OTPInput, Button, BackButton } from '../../components';
import { API_BASE_URL } from '../../constants';
import { api } from '../../services';
import { notificationService } from '../../services/NotificationService';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useTheme, fontFor } from '../../theme';
import { Palette } from '../../theme/palette';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/authSlice';

type OTPVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

export const OTPVerificationScreen: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const route = useRoute<OTPVerificationScreenRouteProp>();
    const { colors, typography } = useTheme();
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(54);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [otpToken, setOtpToken] = useState(route.params?.otpToken || '');

    const email = route.params?.email || 'user@example.com';
    const isSignupFlow = route.params?.isSignupFlow || false;
    const signupData = route.params?.signupData;

    const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

    useEffect(() => {
        if (timer > 0) {
            const t = setInterval(() => setTimer((p) => p - 1), 1000);
            return () => clearInterval(t);
        }
    }, [timer]);

    useEffect(() => { if (otp.length === 6) handleVerify(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [otp]);

    const handleVerify = async () => {
        setLoading(true);
        try {
            const body = isSignupFlow && signupData
                ? { otpToken, code: otp, name: signupData.name, age: signupData.age }
                : { otpToken, code: otp };
            const response = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, body);
            await AsyncStorage.setItem('authToken', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Dispatch to Redux
            dispatch(login({ token: response.data.token, user: response.data.user }));

            if (isSignupFlow && signupData) {
                await AsyncStorage.setItem('signupData', JSON.stringify(signupData));
            }
            try {
                const fcmToken = await notificationService.getFCMToken();
                if (fcmToken) {
                    await axios.post(
                        `${API_BASE_URL}/api/notifications/register-token`,
                        { fcm_token: fcmToken, device_type: Platform.OS },
                        { headers: { Authorization: `Bearer ${response.data.token}` } },
                    );
                }
            } catch (e) { console.error('FCM registration failed', e); }

            const user = response.data.user;

            const meRes = await api.get('/api/auth/me');
            const meData = meRes.data;
            await AsyncStorage.setItem('isFinancialProfilePresent', JSON.stringify(meData?.user?.isFinancialProfilePresent || false));

            const onboardingComplete = meData?.user?.isFinancialProfilePresent;
            if (!onboardingComplete) {
                navigation.reset({ index: 0, routes: [{ name: 'Onboarding' as never }] });
            } else {
                await AsyncStorage.removeItem('temp_auth_email');
                navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
            }
        } catch (error) {
            setOtp('');
            if (axios.isAxiosError(error)) {
                toast.error('Invalid code', { description: error.response?.data?.message || 'Try again.' });
            } else {
                toast.error('Error', { description: 'Something went wrong.' });
            }
        } finally { setLoading(false); }
    };

    const handleResend = async () => {
        if (timer > 0 || resending) return;
        setResending(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, { email });
            setOtpToken(response.data.otpToken);
            setTimer(54);
            toast.success('Sent', { description: 'A new code is on the way.' });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error('Error', { description: error.response?.data?.message || 'Failed to resend.' });
            } else {
                toast.error('Error', { description: 'Something went wrong.' });
            }
        } finally { setResending(false); }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <BackButton onPress={() => navigation.goBack()} />
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>Check your inbox.</Text>
                    <Text style={styles.subtitle}>
                        6-digit code sent to <Text style={styles.strong}>{email}</Text>
                    </Text>

                    <View style={styles.otpWrap}>
                        <OTPInput value={otp} onChangeText={setOtp} length={6} />
                    </View>

                    <View style={styles.resendRow}>
                        <Text style={styles.resendText}>
                            {timer > 0
                                ? <>Resend in <Text style={styles.timer}>{formatTime(timer)}</Text></>
                                : resending
                                    ? 'Sending…'
                                    : ' '}
                        </Text>
                        <TouchableOpacity 
                            onPress={timer > 0 ? () => navigation.goBack() : handleResend} 
                            disabled={resending}
                        >
                            <Text style={[styles.link, resending && styles.linkDisabled]}>
                                {timer > 0 ? 'Change email' : 'Resend code'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Button title="Verify code" onPress={handleVerify} loading={loading} disabled={otp.length < 6} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const makeStyles = (c: Palette, t: ReturnType<typeof useTheme>['typography']) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: c.canvas },
        header: { paddingHorizontal: 24, paddingTop: 12 },
        back: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
        backArrow: { color: c.ink1, fontSize: 18, marginTop: -2 },
        content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
        title: { color: c.ink1, fontSize: 26, fontFamily: fontFor('bold'), letterSpacing: -0.5, marginBottom: 8 },
        subtitle: { color: c.ink2, fontSize: 14, lineHeight: 20, marginBottom: 24 },
        strong: { color: c.ink1, fontFamily: fontFor('semibold') },
        otpWrap: { marginTop: 8 },
        resendRow: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 20,
        },
        resendText: { color: c.ink3, fontSize: 13 },
        timer: { color: c.ink1, fontVariant: ['tabular-nums'], fontFamily: fontFor('semibold') },
        link: { color: c.accent, fontSize: 13, fontFamily: fontFor('medium') },
        linkDisabled: { color: c.ink3 },
        footer: { paddingHorizontal: 24, paddingBottom: 24 },
    });
