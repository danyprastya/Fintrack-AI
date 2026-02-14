"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./auth-context";
import { convertCurrency, BASE_RATES } from "@/lib/utils/exchange-rates";

const STORAGE_KEY = "fintrack-currency";
const BASE_CURRENCY_KEY = "fintrack-base-currency";

interface CurrencyContextValue {
  /** The currency code the user wants displayed (e.g. "USD", "IDR") */
  displayCurrency: string;
  /** The currency in which all Firestore values are stored */
  baseCurrency: string;
  /** Update the display currency */
  setDisplayCurrency: (code: string) => void;
  /** Convert an amount from baseCurrency to displayCurrency for rendering */
  convertForDisplay: (amount: number) => number;
  /** List of supported currency codes */
  supportedCurrencies: string[];
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Base currency: the currency values are stored in (set once at account creation)
  const [baseCurrency, setBaseCurrency] = useState("IDR");

  // Display currency: what the user wants to see
  const [displayCurrency, setDisplayCurrencyState] = useState("IDR");

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDisplay = localStorage.getItem(STORAGE_KEY);
      const storedBase = localStorage.getItem(BASE_CURRENCY_KEY);
      if (storedDisplay) setDisplayCurrencyState(storedDisplay);
      if (storedBase) setBaseCurrency(storedBase);
      else {
        // First time: set baseCurrency to whatever the display currency is
        localStorage.setItem(BASE_CURRENCY_KEY, storedDisplay || "IDR");
        setBaseCurrency(storedDisplay || "IDR");
      }
    }
  }, []);

  const setDisplayCurrency = useCallback((code: string) => {
    setDisplayCurrencyState(code);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, code);
    }
  }, []);

  const convertForDisplay = useCallback(
    (amount: number): number => {
      if (baseCurrency === displayCurrency) return amount;
      return convertCurrency(amount, baseCurrency, displayCurrency);
    },
    [baseCurrency, displayCurrency],
  );

  const supportedCurrencies = useMemo(() => Object.keys(BASE_RATES), []);

  const value = useMemo(
    () => ({
      displayCurrency,
      baseCurrency,
      setDisplayCurrency,
      convertForDisplay,
      supportedCurrencies,
    }),
    [
      displayCurrency,
      baseCurrency,
      setDisplayCurrency,
      convertForDisplay,
      supportedCurrencies,
    ],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
