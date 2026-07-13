import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CurrencyContextType {
    currencySymbol: string;
    setCurrencySymbol: (symbol: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
    currencySymbol: '₹', // Default fallback
    setCurrencySymbol: () => { },
});

export const useCurrency = () => useContext(CurrencyContext);

interface CurrencyProviderProps {
    children: ReactNode;
    initialSymbol?: string;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children, initialSymbol = '₹' }) => {
    const [currencySymbol, setCurrencySymbolState] = useState(initialSymbol);

    useEffect(() => {
        if (initialSymbol !== currencySymbol) {
            setCurrencySymbolState(initialSymbol);
        }
    }, [initialSymbol]);

    const setCurrencySymbol = async (symbol: string) => {
        setCurrencySymbolState(symbol);
        await AsyncStorage.setItem('appCurrencySymbol', symbol);
    };

    return (
        <CurrencyContext.Provider value={{ currencySymbol, setCurrencySymbol }}>
            {children}
        </CurrencyContext.Provider>
    );
};
