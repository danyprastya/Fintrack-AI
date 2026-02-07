"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { ArrowDownUp, RefreshCw, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

// Offline exchange rates (approximate, updated periodically)
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
  { name: string; nameEn: string; flag: string; symbol: string }
> = {
  USD: { name: "Dolar AS", nameEn: "US Dollar", flag: "🇺🇸", symbol: "$" },
  IDR: {
    name: "Rupiah Indonesia",
    nameEn: "Indonesian Rupiah",
    flag: "🇮🇩",
    symbol: "Rp",
  },
  EUR: { name: "Euro", nameEn: "Euro", flag: "🇪🇺", symbol: "€" },
  GBP: {
    name: "Poundsterling Inggris",
    nameEn: "British Pound",
    flag: "🇬🇧",
    symbol: "£",
  },
  JPY: { name: "Yen Jepang", nameEn: "Japanese Yen", flag: "🇯🇵", symbol: "¥" },
  SGD: {
    name: "Dolar Singapura",
    nameEn: "Singapore Dollar",
    flag: "🇸🇬",
    symbol: "S$",
  },
  MYR: {
    name: "Ringgit Malaysia",
    nameEn: "Malaysian Ringgit",
    flag: "🇲🇾",
    symbol: "RM",
  },
  THB: { name: "Baht Thailand", nameEn: "Thai Baht", flag: "🇹🇭", symbol: "฿" },
  AUD: {
    name: "Dolar Australia",
    nameEn: "Australian Dollar",
    flag: "🇦🇺",
    symbol: "A$",
  },
  CNY: {
    name: "Yuan Tiongkok",
    nameEn: "Chinese Yuan",
    flag: "🇨🇳",
    symbol: "¥",
  },
  KRW: {
    name: "Won Korea",
    nameEn: "South Korean Won",
    flag: "🇰🇷",
    symbol: "₩",
  },
  INR: { name: "Rupee India", nameEn: "Indian Rupee", flag: "🇮🇳", symbol: "₹" },
  PHP: {
    name: "Peso Filipina",
    nameEn: "Philippine Peso",
    flag: "🇵🇭",
    symbol: "₱",
  },
  VND: {
    name: "Dong Vietnam",
    nameEn: "Vietnamese Dong",
    flag: "🇻🇳",
    symbol: "₫",
  },
  SAR: {
    name: "Riyal Arab Saudi",
    nameEn: "Saudi Riyal",
    flag: "🇸🇦",
    symbol: "﷼",
  },
};

const POPULAR_PAIRS = [
  ["IDR", "USD"],
  ["IDR", "SGD"],
  ["IDR", "MYR"],
  ["IDR", "JPY"],
  ["USD", "EUR"],
  ["USD", "GBP"],
];

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

export default function ConverterPage() {
  const { t, language } = useLanguage();
  const [fromCurrency, setFromCurrency] = useState("IDR");
  const [toCurrency, setToCurrency] = useState("USD");
  const [amount, setAmount] = useState("1000000");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const numAmount = parseFloat(amount.replace(/[^\d.]/g, "")) || 0;
  const convertedAmount = convert(numAmount, fromCurrency, toCurrency);
  const rate = convert(1, fromCurrency, toCurrency);

  const swapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  const currencies = Object.keys(CURRENCY_INFO);

  const title = language === "id" ? "Konversi Mata Uang" : "Currency Converter";

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={title} />

      <div className="flex-1 p-4 space-y-5">
        {/* Converter Card */}
        <Card className="border-0 shadow-lg shadow-primary/5 overflow-hidden">
          <CardContent className="p-0">
            {/* From section */}
            <div className="p-4 space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {language === "id" ? "Dari" : "From"}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowFromPicker(!showFromPicker);
                    setShowToPicker(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors shrink-0"
                >
                  <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {CURRENCY_INFO[fromCurrency]?.symbol}
                  </span>
                  <span className="text-sm font-semibold">{fromCurrency}</span>
                </button>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  className="text-right text-lg font-semibold border-0 bg-transparent h-11 focus-visible:ring-0"
                  placeholder="0"
                />
              </div>
              {showFromPicker && (
                <CurrencyPicker
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

            {/* Swap Button */}
            <div className="relative">
              <div className="border-t border-border" />
              <button
                onClick={swapCurrencies}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <ArrowDownUp className="h-4 w-4" />
              </button>
            </div>

            {/* To section */}
            <div className="p-4 space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {language === "id" ? "Ke" : "To"}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowToPicker(!showToPicker);
                    setShowFromPicker(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors shrink-0"
                >
                  <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {CURRENCY_INFO[toCurrency]?.symbol}
                  </span>
                  <span className="text-sm font-semibold">{toCurrency}</span>
                </button>
                <div className="flex-1 text-right text-lg font-semibold text-primary h-11 flex items-center justify-end px-3">
                  {CURRENCY_INFO[toCurrency]?.symbol}{" "}
                  {formatNumber(convertedAmount, toCurrency)}
                </div>
              </div>
              {showToPicker && (
                <CurrencyPicker
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
          </CardContent>
        </Card>

        {/* Exchange Rate Info */}
        <Card className="border shadow-sm">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {language === "id" ? "Kurs saat ini" : "Current rate"}
              </p>
              <p className="text-sm font-semibold">
                1 {fromCurrency} = {CURRENCY_INFO[toCurrency]?.symbol}{" "}
                {formatNumber(rate, toCurrency)} {toCurrency}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              Offline
            </div>
          </CardContent>
        </Card>

        {/* Popular Pairs */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">
            {language === "id" ? "Pasangan Populer" : "Popular Pairs"}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_PAIRS.map(([from, to]) => {
              const r = convert(1, from, to);
              return (
                <button
                  key={`${from}-${to}`}
                  onClick={() => {
                    setFromCurrency(from);
                    setToCurrency(to);
                    setShowFromPicker(false);
                    setShowToPicker(false);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border transition-all hover:shadow-sm",
                    fromCurrency === from && toCurrency === to
                      ? "border-primary/30 bg-primary/5"
                      : "border-border hover:border-primary/20",
                  )}
                >
                  <div className="flex -space-x-1">
                    <span className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                      {CURRENCY_INFO[from]?.symbol}
                    </span>
                    <span className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                      {CURRENCY_INFO[to]?.symbol}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold">
                      {from}/{to}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatNumber(r, to)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrencyPicker({
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
    <div className="mt-2 p-2 rounded-xl bg-muted/50 border border-border max-h-48 overflow-y-auto space-y-0.5">
      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={lang === "id" ? "Cari mata uang..." : "Search currency..."}
        className="h-8 text-xs mb-1.5"
        autoFocus
      />
      {filtered.map((c) => {
        const info = CURRENCY_INFO[c];
        return (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className={cn(
              "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg transition-colors text-left",
              selected === c ? "bg-primary/10 text-primary" : "hover:bg-muted",
            )}
          >
            <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {info?.symbol}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold">{c}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">
                {lang === "id" ? info?.name : info?.nameEn}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {info?.symbol}
            </span>
          </button>
        );
      })}
    </div>
  );
}
