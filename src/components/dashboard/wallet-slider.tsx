"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency } from "@/lib/utils/currency";
import { Wallet, Banknote, Landmark, Smartphone } from "lucide-react";
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

/** Touch-scrollable horizontal slider with equal-width children */
function TouchSlider({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    scrollLeftRef.current = el.scrollLeft;
    lastXRef.current = e.clientX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    el.setPointerCapture(e.pointerId);
    el.style.scrollBehavior = "auto";
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !scrollRef.current) return;
      const dx = e.clientX - startXRef.current;
      scrollRef.current.scrollLeft = scrollLeftRef.current - dx;

      const now = Date.now();
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        velocityRef.current = (e.clientX - lastXRef.current) / dt;
      }
      lastXRef.current = e.clientX;
      lastTimeRef.current = now;
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging || !scrollRef.current) return;
    setIsDragging(false);
    const el = scrollRef.current;
    el.style.scrollBehavior = "smooth";

    // Apply momentum
    const v = velocityRef.current;
    if (Math.abs(v) > 0.2) {
      el.scrollLeft -= v * 200;
    }
  }, [isDragging]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 cursor-grab active:cursor-grabbing"
      style={{
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className="flex-shrink-0"
              style={{
                width: "calc((100% - 1.5rem) / 2.3)",
                scrollSnapAlign: "start",
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

export function WalletSlider({
  wallets,
  currency = "IDR",
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

      <TouchSlider>
        {wallets.map((wallet) => {
          const colorKey =
            wallet.color || DEFAULT_TYPE_COLORS[wallet.type] || "teal";
          const colors = WALLET_COLORS[colorKey] || WALLET_COLORS.teal;

          return (
            <div
              key={wallet.id}
              className={cn(
                "rounded-2xl p-3.5 relative overflow-hidden",
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
                  {formatCurrency(wallet.balance, currency)}
                </p>
              </div>
            </div>
          );
        })}
      </TouchSlider>
    </div>
  );
}
