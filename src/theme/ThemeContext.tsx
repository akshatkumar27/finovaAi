import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Palette, lightPalette, darkPalette } from './palette';
import { typography, spacing, radii } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    colors: Palette;
    isDark: boolean;
    typography: typeof typography;
    spacing: typeof spacing;
    radii: typeof radii;
};

const STORAGE_KEY = 'finova.themeMode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() ?? 'dark');

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
            if (stored === 'light' || stored === 'dark' || stored === 'system') {
                setModeState(stored);
            }
        });
        const sub = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemScheme(colorScheme ?? 'dark');
        });
        return () => sub.remove();
    }, []);

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    }, []);

    const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
    const colors = isDark ? darkPalette : lightPalette;

    const value = useMemo<ThemeContextValue>(
        () => ({ mode, setMode, colors, isDark, typography, spacing, radii }),
        [mode, setMode, colors, isDark],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used inside <ThemeProvider>');
    }
    return ctx;
};
