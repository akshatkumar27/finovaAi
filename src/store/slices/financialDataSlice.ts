import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FinancialDataState {
    isFinancialProfilePresent: boolean;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyEmi: number;
    emiOutstanding: number;
    monthlyInvestment: number;
    loading: boolean;
    error: string | null;
}

const initialState: FinancialDataState = {
    isFinancialProfilePresent: false,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyEmi: 0,
    emiOutstanding: 0,
    monthlyInvestment: 0,
    loading: false,
    error: null,
};

const financialDataSlice = createSlice({
    name: 'financialData',
    initialState,
    reducers: {
        setFinancialProfilePresent(state, action: PayloadAction<boolean>) {
            state.isFinancialProfilePresent = action.payload;
        },
        setFinancialData(state, action: PayloadAction<Partial<FinancialDataState>>) {
            return { ...state, ...action.payload };
        },
        clearFinancialData() {
            return initialState;
        },
    },
});

export const { setFinancialProfilePresent, setFinancialData, clearFinancialData } = financialDataSlice.actions;

export default financialDataSlice.reducer;
