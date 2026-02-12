"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "type"
> {
  value: string;
  onChange: (value: string) => void;
  /** Optional currency symbol prefix shown inside the input */
  currencyPrefix?: string;
}

/**
 * Currency input with auto thousand-separator formatting.
 * Uses type="text" with inputMode="numeric" for mobile numeric keyboard.
 * Strips non-numeric chars, formats with dots as thousand separators.
 * The raw numeric string (no separators) is passed back via onChange.
 */
function CurrencyInput({
  value,
  onChange,
  currencyPrefix,
  className,
  ...props
}: CurrencyInputProps) {
  const formatWithSeparator = (raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    onChange(rawDigits);
  };

  if (currencyPrefix) {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none select-none">
          {currencyPrefix}
        </span>
        <input
          type="text"
          inputMode="numeric"
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            currencyPrefix.length > 2 ? "pl-12" : "pl-9",
            "pr-3",
            className,
          )}
          value={formatWithSeparator(value)}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      value={formatWithSeparator(value)}
      onChange={handleChange}
      {...props}
    />
  );
}

export { CurrencyInput };
