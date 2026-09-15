import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

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

export const RootNavigator: React.FC<RootNavigatorProps & { initialRouteName?: string; initialParams?: any }> = ({
    isLoggedIn = false,
    isOnboardingCompleted = false,
    initialRouteName,
    initialParams
}) => {
    const logoutTarget = useSelector((state: RootState) => state.auth.logoutTarget);

    const routeName = initialRouteName || (isLoggedIn ? (isOnboardingCompleted ? 'Main' : 'Onboarding') : 'Auth');

    return (
        <Stack.Navigator
            initialRouteName={routeName as keyof RootStackParamList}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen 
                name="Auth" 
                component={AuthNavigator} 
                initialParams={!isLoggedIn && logoutTarget ? { screen: logoutTarget } : (routeName === 'Auth' ? initialParams : undefined)} 
            />
            <Stack.Screen name="Onboarding" component={OnboardingNavigator} initialParams={routeName === 'Onboarding' ? initialParams : undefined} />
            <Stack.Screen name="Main" component={MainTabNavigator} />
        </Stack.Navigator>
    );
};
