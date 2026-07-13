import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    GoalPulseScreen,
    VaultScreen,
    InvestHubScreen,
    ProfileScreen,
    NotificationScreen,
    EditGoalScreen,
    GoalChatScreen,
    ContributionsScreen,
    PersonalInfoScreen,
    PrivacySecurityScreen,
    HelpSupportScreen,
    NotificationSettingsScreen,
    EditFinancialDetailsScreen,
} from '../screens/main';
import { AddGoalScreen } from '../screens/onboarding';

export type MainStackParamList = {
    Pulse: undefined;
    Vault: undefined;
    Invest: undefined;
    Profile: undefined;
    Notifications: undefined;
    EditGoal: {
        goalId?: string;
        name?: string;
        target?: number;
        achieveIn?: number;
        monthlyContribution?: number;
        savedAmount?: number;
        availableForNewGoals?: number;
        contributionDay?: string;
    };
    GoalChat: {
        goalTitle?: string;
        initialSuggestion?: string;
    };
    AddGoal: {
        availableForNewGoals?: number;
        suggestionName?: string;
        suggestionTarget?: number;
        suggestionMonths?: number;
        suggestionDescription?: string;
    };
    Contributions: {
        goalId?: string;
        goalName?: string;
        targetAmount?: number;
        monthlyContribution?: number;
        achieveInMonths?: number;
        goalCreatedAt?: string;
        contributionDay?: string;
    };
    PersonalInfo: undefined;
    PrivacySecurity: undefined;
    HelpSupport: undefined;
    NotificationSettings: undefined;
    EditFinancialDetails: {
        onboardingData: {
            monthly_income?: number;
            monthly_expenses?: number;
            monthly_emi?: number;
            emi_outstanding?: number;
            monthly_investment?: number;
        };
    };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainStackNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName="Pulse"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Pulse" component={GoalPulseScreen} />
            <Stack.Screen name="Vault" component={VaultScreen} />
            <Stack.Screen name="Invest" component={InvestHubScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="EditGoal" component={EditGoalScreen} />
            <Stack.Screen name="GoalChat" component={GoalChatScreen} />
            <Stack.Screen name="AddGoal" component={AddGoalScreen} />
            <Stack.Screen name="Contributions" component={ContributionsScreen} />
            <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
            <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="EditFinancialDetails" component={EditFinancialDetailsScreen} />
        </Stack.Navigator>
    );
};

// Keep the old export name for backward compatibility
export const MainTabNavigator = MainStackNavigator;
