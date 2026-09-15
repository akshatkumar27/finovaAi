import { configureStore } from '@reduxjs/toolkit';
import financialDataReducer from './slices/financialDataSlice';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        settings: settingsReducer,
        financialData: financialDataReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
