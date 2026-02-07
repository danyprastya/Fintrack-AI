"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { Languages, Check } from "lucide-react";
import { Language } from "@/lib/i18n/types";

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { t, language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string; abbr: string }[] = [
    { code: "id", label: t.settings.languageId, abbr: "ID" },
    { code: "en", label: t.settings.languageEn, abbr: "EN" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Languages className="h-4 w-4 text-muted-foreground" />
        {t.settings.language}
      </div>
      <div className="space-y-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all",
              language === lang.code
                ? "bg-primary/10 border border-primary/20"
                : "bg-muted/50 border border-transparent hover:bg-muted",
            )}
          >
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {lang.abbr}
              </span>
              <span className="text-sm font-medium">{lang.label}</span>
            </div>
            {language === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
