import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    LoginScreen,
    SignupScreen,
    OTPVerificationScreen,
} from '../screens/auth';

export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    OTPVerification: {
        email: string;
        otpToken: string;
        isSignupFlow?: boolean;
        signupData?: {
            name: string;
            age: string;
        };
    };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0a0a14' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        </Stack.Navigator>
    );
};
