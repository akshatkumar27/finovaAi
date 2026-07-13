import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    MonthlyIncomeScreen,
    MonthlyExpensesScreen,
    MonthlyEMIScreen,
    EMIOutstandingScreen,
    MonthlyInvestmentScreen,
    GoalSelectionScreen,
    AddGoalScreen,
} from '../screens/onboarding';

export type OnboardingData = {
    monthly_income?: number;
    monthly_expenses?: number;
    monthly_emi?: number;
    emi_outstanding?: number;
    monthly_investment?: number;
};

export type OnboardingStackParamList = {
    MonthlyIncome: undefined;
    MonthlyExpenses: { onboardingData: OnboardingData };
    MonthlyEMI: { onboardingData: OnboardingData };
    EMIOutstanding: { onboardingData: OnboardingData };
    MonthlyInvestment: { onboardingData: OnboardingData };
    GoalSelection: { onboardingData: OnboardingData };
    AddGoal: {
        suggestionName?: string;
        suggestionTarget?: number;
        suggestionMonths?: number;
        availableForNewGoals?: number;
        suggestionDescription?: string;
    } | undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName="MonthlyIncome"
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0a0a14' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="MonthlyIncome" component={MonthlyIncomeScreen} />
            <Stack.Screen name="MonthlyExpenses" component={MonthlyExpensesScreen} />
            <Stack.Screen name="MonthlyEMI" component={MonthlyEMIScreen} />
            <Stack.Screen name="EMIOutstanding" component={EMIOutstandingScreen} />
            <Stack.Screen name="MonthlyInvestment" component={MonthlyInvestmentScreen} />
            <Stack.Screen name="GoalSelection" component={GoalSelectionScreen} />
            <Stack.Screen name="AddGoal" component={AddGoalScreen} />
        </Stack.Navigator>
    );
};
