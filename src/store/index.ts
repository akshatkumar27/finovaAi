import { configureStore } from '@reduxjs/toolkit';
import financialDataReducer from './slices/financialDataSlice';

export const store = configureStore({
    reducer: {
        financialData: financialDataReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
