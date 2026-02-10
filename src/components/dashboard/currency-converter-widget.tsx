"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { ArrowDownUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

// Offline exchange rates
const BASE_RATES: Record<string, number> = {
  USD: 1,
  IDR: 15850,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  SGD: 1.34,
  MYR: 4.47,
  THB: 35.2,
  AUD: 1.53,
  CNY: 7.24,
  KRW: 1330,
  INR: 83.1,
  PHP: 56.2,
  VND: 24500,
  SAR: 3.75,
};

const CURRENCY_INFO: Record<
  string,
  { flag: string; symbol: string; name: string; nameEn: string }
> = {
  USD: { flag: "🇺🇸", symbol: "$", name: "Dolar AS", nameEn: "US Dollar" },
  IDR: { flag: "🇮🇩", symbol: "Rp", name: "Rupiah", nameEn: "Rupiah" },
  EUR: { flag: "🇪🇺", symbol: "€", name: "Euro", nameEn: "Euro" },
  GBP: { flag: "🇬🇧", symbol: "£", name: "Pound", nameEn: "Pound" },
  JPY: { flag: "🇯🇵", symbol: "¥", name: "Yen", nameEn: "Yen" },
  SGD: { flag: "🇸🇬", symbol: "S$", name: "SGD", nameEn: "SGD" },
  MYR: { flag: "🇲🇾", symbol: "RM", name: "Ringgit", nameEn: "Ringgit" },
  THB: { flag: "🇹🇭", symbol: "฿", name: "Baht", nameEn: "Baht" },
  AUD: { flag: "🇦🇺", symbol: "A$", name: "AUD", nameEn: "AUD" },
  CNY: { flag: "🇨🇳", symbol: "¥", name: "Yuan", nameEn: "Yuan" },
  KRW: { flag: "🇰🇷", symbol: "₩", name: "Won", nameEn: "Won" },
  INR: { flag: "🇮🇳", symbol: "₹", name: "Rupee", nameEn: "Rupee" },
  PHP: { flag: "🇵🇭", symbol: "₱", name: "Peso", nameEn: "Peso" },
  VND: { flag: "🇻🇳", symbol: "₫", name: "Dong", nameEn: "Dong" },
  SAR: { flag: "🇸🇦", symbol: "﷼", name: "Riyal", nameEn: "Riyal" },
};

function convert(amount: number, from: string, to: string): number {
  const fromRate = BASE_RATES[from] || 1;
  const toRate = BASE_RATES[to] || 1;
  return (amount / fromRate) * toRate;
}

function formatNumber(n: number, currency: string): string {
  const decimals = ["IDR", "JPY", "KRW", "VND"].includes(currency) ? 0 : 2;
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface CurrencyConverterWidgetProps {
  className?: string;
}

export function CurrencyConverterWidget({
  className,
}: CurrencyConverterWidgetProps) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [fromCurrency, setFromCurrency] = useState("IDR");
  const [toCurrency, setToCurrency] = useState("USD");
  const [amount, setAmount] = useState("1000000");
  const [isSwapped, setIsSwapped] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const numAmount = parseFloat(amount.replace(/[^\d.]/g, "")) || 0;
  const convertedAmount = convert(numAmount, fromCurrency, toCurrency);
  const rate = convert(1, fromCurrency, toCurrency);

  const swapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setIsSwapped((prev) => !prev);
    setShowFromPicker(false);
    setShowToPicker(false);
  }, [fromCurrency, toCurrency]);

  const currencies = Object.keys(CURRENCY_INFO);
  const title = t.converter.title;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header — tap to toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <ArrowDownUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-semibold">{title}</h2>
            {!isOpen && (
              <p className="text-[11px] text-muted-foreground">
                1 {fromCurrency} = {CURRENCY_INFO[toCurrency]?.symbol}{" "}
                {formatNumber(rate, toCurrency)} {toCurrency}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Collapsible body */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-150 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="rounded-2xl bg-card/60 dark:bg-card/40 backdrop-blur-sm shadow-sm p-4 space-y-3">
          {/* From */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t.converter.from}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowFromPicker(!showFromPicker);
                  setShowToPicker(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-muted/80 hover:bg-muted transition-colors shrink-0"
              >
                <span className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  {CURRENCY_INFO[fromCurrency]?.symbol}
                </span>
                <span className="text-xs font-semibold">{fromCurrency}</span>
              </button>
              <Input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^\d.]/g, ""))
                }
                className="text-right text-base font-semibold border-0 bg-transparent h-10 focus-visible:ring-0"
                placeholder="0"
              />
            </div>
            {showFromPicker && (
              <MiniPicker
                currencies={currencies}
                selected={fromCurrency}
                lang={language}
                onSelect={(c) => {
                  setFromCurrency(c);
                  setShowFromPicker(false);
                }}
              />
            )}
          </div>

          {/* Swap —  rotates 180° */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <button
              onClick={swapCurrencies}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              <ArrowDownUp
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-300",
                  isSwapped && "rotate-180",
                )}
              />
            </button>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* To */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t.converter.to}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowToPicker(!showToPicker);
                  setShowFromPicker(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-muted/80 hover:bg-muted transition-colors shrink-0"
              >
                <span className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  {CURRENCY_INFO[toCurrency]?.symbol}
                </span>
                <span className="text-xs font-semibold">{toCurrency}</span>
              </button>
              <div className="flex-1 text-right text-base font-semibold text-primary h-10 flex items-center justify-end px-3">
                {CURRENCY_INFO[toCurrency]?.symbol}{" "}
                {formatNumber(convertedAmount, toCurrency)}
              </div>
            </div>
            {showToPicker && (
              <MiniPicker
                currencies={currencies}
                selected={toCurrency}
                lang={language}
                onSelect={(c) => {
                  setToCurrency(c);
                  setShowToPicker(false);
                }}
              />
            )}
          </div>

          {/* Rate summary */}
          <div className="text-center text-[11px] text-muted-foreground pt-1">
            1 {fromCurrency} = {CURRENCY_INFO[toCurrency]?.symbol}{" "}
            {formatNumber(rate, toCurrency)} {toCurrency}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniPicker({
  currencies,
  selected,
  lang,
  onSelect,
}: {
  currencies: string[];
  selected: string;
  lang: string;
  onSelect: (c: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = currencies.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const info = CURRENCY_INFO[c];
    return (
      c.toLowerCase().includes(q) ||
      info?.name.toLowerCase().includes(q) ||
      info?.nameEn.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mt-1 p-1.5 rounded-xl bg-muted/50 border border-border/50 max-h-40 overflow-y-auto space-y-0.5">
      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={lang === "id" ? "Cari..." : "Search..."}
        className="h-7 text-xs mb-1"
        autoFocus
      />
      {filtered.map((c) => {
        const info = CURRENCY_INFO[c];
        return (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-colors text-left text-xs",
              selected === c
                ? "bg-primary/10 text-primary font-semibold"
                : "hover:bg-muted",
            )}
          >
            <span className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
              {info?.symbol}
            </span>
            <span className="font-medium">{c}</span>
            <span className="text-muted-foreground text-[10px]">
              {info?.symbol}
            </span>
          </button>
        );
      })}
    </div>
  );
}
