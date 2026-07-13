import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';

export type RootStackParamList = {
    Auth: undefined;
    Onboarding: undefined;
    Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
    isLoggedIn?: boolean;
    isOnboardingCompleted?: boolean;
}

// Define proper types if possible, or use any for flexibility in this refactor
export const RootNavigator: React.FC<RootNavigatorProps & { initialRouteName?: string; initialParams?: any }> = ({
    isLoggedIn = false,
    isOnboardingCompleted = false,
    initialRouteName,
    initialParams
}) => {
    // Determine initial route if not provided
    console.log('isLoggedIn', isLoggedIn);
    console.log('isOnboardingCompleted', isOnboardingCompleted);
    console.log('Provided initialRouteName:', initialRouteName);

    const routeName = initialRouteName || (isLoggedIn ? (isOnboardingCompleted ? 'Main' : 'Onboarding') : 'Auth');

    return (
        <Stack.Navigator
            initialRouteName={routeName as keyof RootStackParamList}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Auth" component={AuthNavigator} initialParams={routeName === 'Auth' ? initialParams : undefined} />
            <Stack.Screen name="Onboarding" component={OnboardingNavigator} initialParams={routeName === 'Onboarding' ? initialParams : undefined} />
            <Stack.Screen name="Main" component={MainTabNavigator} />
        </Stack.Navigator>
    );
};
