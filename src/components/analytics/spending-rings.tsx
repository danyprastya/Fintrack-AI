"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency } from "@/lib/utils/currency";
import { CategoryIcon } from "@/lib/category-icons";
import { BarChart3 } from "lucide-react";

interface CategorySpending {
  id: string;
  name: string;
  icon: string;
  amount: number;
  color: string;
  percentage: number;
}

interface SpendingRingsProps {
  categories: CategorySpending[];
  totalSpending: number;
  type?: "income" | "expense";
  currency?: string;
  className?: string;
}

interface RingData {
  label: string;
  icon: string;
  value: number;
  color: string;
  size: number;
  current: number;
  unit: string;
}

function CircleProgress({ data, index }: { data: RingData; index: number }) {
  const strokeWidth = 14;
  const radius = (data.size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - data.value) / 100) * circumference;

  const gradientId = `spend-gradient-${index}`;

  // Generate a lighter stop color
  const lighten = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.35));
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
    >
      <div className="relative">
        <svg
          width={data.size}
          height={data.size}
          viewBox={`0 0 ${data.size} ${data.size}`}
          className="transform -rotate-90"
          aria-label={`${data.label} - ${data.value}%`}
        >
          <title>{`${data.label} - ${data.value}%`}</title>

          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: data.color, stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: lighten(data.color), stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={data.size / 2}
            cy={data.size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-200/50 dark:text-zinc-800/50"
          />

          {/* Progress arc */}
          <motion.circle
            cx={data.size / 2}
            cy={data.size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{
              duration: 1.8,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 4px rgba(0,0,0,0.1))",
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
}

export function SpendingRings({
  categories,
  totalSpending,
  type = "expense",
  currency = "IDR",
  className,
}: SpendingRingsProps) {
  const { t } = useLanguage();

  // Take top 3 categories for rings
  const topCategories = categories.slice(0, 3);

  const rings: RingData[] = topCategories.map((cat, i) => ({
    label: cat.name,
    icon: cat.icon,
    value: cat.percentage,
    color: cat.color,
    size: 170 - i * 40,
    current: cat.amount,
    unit: cat.icon,
  }));

  if (categories.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <BarChart3 className="h-8 w-8 mb-2 text-muted-foreground/50" />
        <p className="text-sm">{t.analytics.noData}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      {/* Rings + Total center */}
      <div className="flex items-center justify-center gap-6">
        <div className="relative w-42.5 h-42.5 shrink-0">
          {rings.map((ring, index) => (
            <CircleProgress key={index} data={ring} index={index} />
          ))}
          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {type === "income"
                ? t.analytics.totalIncome
                : t.analytics.totalExpense}
            </p>
            <motion.p
              className="text-sm font-bold"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {formatCurrency(totalSpending, currency)}
            </motion.p>
          </div>
        </div>

        {/* Legend with values */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {topCategories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2.5">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate leading-tight flex items-center gap-1">
                  <CategoryIcon
                    icon={cat.icon || cat.name}
                    className="h-3 w-3"
                  />{" "}
                  {cat.name}
                </p>
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{ color: cat.color }}
                >
                  {cat.percentage}%
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    {formatCurrency(cat.amount, currency)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Full category list */}
      <div className="space-y-2.5">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
              <CategoryIcon
                icon={cat.icon || cat.name}
                className="h-4.5 w-4.5 text-muted-foreground"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{cat.name}</span>
                <span className="text-sm font-semibold shrink-0 ml-2">
                  {formatCurrency(cat.amount, currency)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.6 + i * 0.05 }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">
              {cat.percentage}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
