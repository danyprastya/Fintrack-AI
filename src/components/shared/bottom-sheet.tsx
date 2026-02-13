"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional right-side action in header */
  headerRight?: React.ReactNode;
  /** Optional content below the title (e.g. filter tabs) */
  headerExtra?: React.ReactNode;
  /** Max height as CSS value, default: 45vh */
  maxHeight?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  headerRight,
  headerExtra,
  maxHeight = "80vh",
  children,
  className,
}: BottomSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-55 flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Sheet */}
      <div
        className={cn(
          "relative w-full max-w-lg bg-background rounded-t-2xl animate-in slide-in-from-bottom duration-300 flex flex-col",
          className,
        )}
        style={{ maxHeight }}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background rounded-t-2xl px-5 pt-5 pb-3 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{title}</h3>
            <div className="flex items-center gap-2">
              {headerRight}
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          {headerExtra}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
