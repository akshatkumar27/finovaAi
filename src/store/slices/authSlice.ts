import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
    isLoggedIn: boolean;
    token: string | null;
    user: any | null;
    logoutTarget?: string | null;
}

const initialState: AuthState = {
    isLoggedIn: false,
    token: null,
    user: null,
    logoutTarget: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login(state, action: PayloadAction<{ token: string; user: any }>) {
            state.isLoggedIn = true;
            state.token = action.payload.token;
            state.user = action.payload.user;
        },
        logout(state, action: PayloadAction<{ targetScreen?: string } | undefined>) {
            state.isLoggedIn = false;
            state.token = null;
            state.user = null;
            state.logoutTarget = action.payload?.targetScreen || null;
        },
        updateUser(state, action: PayloadAction<any>) {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
    },
});

export const { login, logout, updateUser } = authSlice.actions;

export default authSlice.reducer;
