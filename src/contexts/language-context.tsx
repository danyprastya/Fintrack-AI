"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Language, Translations } from "@/lib/i18n/types";
import { getTranslations, getDefaultLanguage, saveLanguage } from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLanguageState(getDefaultLanguage());
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    saveLanguage(lang);
    document.documentElement.lang = lang;
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = language === "id" ? "en" : "id";
    setLanguage(newLang);
  }, [language, setLanguage]);

  const t = useMemo(() => getTranslations(language), [language]);

  const value = useMemo(
    () => ({
      language,
      t,
      setLanguage,
      toggleLanguage,
    }),
    [language, t, setLanguage, toggleLanguage],
  );

  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{
          language: "id",
          t: getTranslations("id"),
          setLanguage,
          toggleLanguage,
        }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
