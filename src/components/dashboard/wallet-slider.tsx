"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency, formatCurrencyParts } from "@/lib/utils/currency";
import { Wallet, Banknote, Landmark, Smartphone } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Link from "next/link";

interface WalletData {
  id: string;
  name: string;
  type: "cash" | "bank" | "ewallet";
  balance: number;
  color?: string;
}

interface WalletSliderProps {
  wallets: WalletData[];
  currency?: string;
  isHidden?: boolean;
  className?: string;
}

const WALLET_COLORS: Record<
  string,
  { bg: string; text: string; iconBg: string }
> = {
  teal: {
    bg: "bg-gradient-to-br from-teal-500 to-teal-600",
    text: "text-white",
    iconBg: "bg-white/15",
  },
  indigo: {
    bg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    text: "text-white",
    iconBg: "bg-white/15",
  },
  violet: {
    bg: "bg-gradient-to-br from-violet-500 to-violet-600",
    text: "text-white",
    iconBg: "bg-white/15",
  },
  rose: {
    bg: "bg-gradient-to-br from-rose-500 to-rose-600",
    text: "text-white",
    iconBg: "bg-white/15",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-500 to-amber-600",
    text: "text-white",
    iconBg: "bg-white/15",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    text: "text-white",
    iconBg: "bg-white/15",
  },
  sky: {
    bg: "bg-gradient-to-br from-sky-500 to-sky-600",
    text: "text-white",
    iconBg: "bg-white/15",
  },
  pink: {
    bg: "bg-gradient-to-br from-pink-500 to-pink-600",
    text: "text-white",
    iconBg: "bg-white/15",
  },
};

const DEFAULT_TYPE_COLORS: Record<string, string> = {
  cash: "teal",
  bank: "indigo",
  ewallet: "violet",
};

function WalletIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "bank":
      return <Landmark className={className} />;
    case "ewallet":
      return <Smartphone className={className} />;
    default:
      return <Banknote className={className} />;
  }
}

/** Reusable wallet card used inside the carousel */
function WalletCard({
  wallet,
  currency,
  isHidden = false,
}: {
  wallet: WalletData;
  currency: string;
  isHidden?: boolean;
}) {
  const colorKey = wallet.color || DEFAULT_TYPE_COLORS[wallet.type] || "teal";
  const colors = WALLET_COLORS[colorKey] || WALLET_COLORS.teal;

  const displayBalance = () => {
    if (isHidden) {
      const { symbol } = formatCurrencyParts(wallet.balance, currency);
      return `${symbol} ------`;
    }
    return formatCurrency(wallet.balance, currency);
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-3.5 h-full relative overflow-hidden select-none",
        colors.bg,
        colors.text,
      )}
    >
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div
          className={cn(
            "h-8 w-8 rounded-xl flex items-center justify-center mb-2",
            colors.iconBg,
          )}
        >
          <WalletIcon type={wallet.type} className="h-4 w-4" />
        </div>
        <p className="text-[11px] font-medium opacity-80 truncate">
          {wallet.name}
        </p>
        <p className="text-sm font-bold mt-0.5">
          {displayBalance()}
        </p>
      </div>
    </div>
  );
}

export function WalletSlider({
  wallets,
  currency = "IDR",
  isHidden = false,
  className,
}: WalletSliderProps) {
  const { t } = useLanguage();

  if (wallets.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          {t.settings.wallets}
        </h3>
        <Link
          href="/settings"
          className="text-xs text-primary font-medium hover:underline"
        >
          {t.dashboard.viewAll}
        </Link>
      </div>

      <Carousel
        opts={{ align: "start", dragFree: true, loop: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {wallets.map((wallet) => (
            <CarouselItem
              key={wallet.id}
              className="pl-3 basis-[55%] lg:basis-1/4"
            >
              <WalletCard wallet={wallet} currency={currency} isHidden={isHidden} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
