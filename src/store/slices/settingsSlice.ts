import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
    appCurrency: string;
}

const initialState: SettingsState = {
    appCurrency: '₹', // Default to INR
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setCurrency(state, action: PayloadAction<string>) {
            state.appCurrency = action.payload;
        },
    },
});

export const { setCurrency } = settingsSlice.actions;

export default settingsSlice.reducer;
