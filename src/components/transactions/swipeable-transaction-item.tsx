"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { useLanguage } from "@/contexts/language-context";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Pencil,
  Trash2,
} from "lucide-react";

interface SwipeableTransactionItemProps {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  categoryIcon: string;
  categoryName: string;
  date: string;
  accountName?: string;
  currency?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  className?: string;
}

const TYPE_STYLES = {
  income: { color: "text-income", prefix: "+", Icon: ArrowUpRight },
  expense: { color: "text-expense", prefix: "-", Icon: ArrowDownRight },
  transfer: { color: "text-transfer", prefix: "", Icon: ArrowLeftRight },
};

const SWIPE_THRESHOLD = 40;
const MAX_SWIPE = 108; // Width of both buttons combined

export function SwipeableTransactionItem({
  id,
  type,
  amount,
  description,
  categoryIcon,
  categoryName,
  date,
  accountName,
  currency = "IDR",
  onDelete,
  onEdit,
  className,
}: SwipeableTransactionItemProps) {
  const { t } = useLanguage();
  const style = TYPE_STYLES[type];

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
      currentXRef.current = isRevealed ? -MAX_SWIPE : 0;
      isDraggingRef.current = true;
      setIsDragging(true);
    },
    [isRevealed],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const diff = e.touches[0].clientX - startXRef.current;
    const newOffset = Math.min(
      0,
      Math.max(-MAX_SWIPE, currentXRef.current + diff),
    );
    setOffsetX(newOffset);
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    if (offsetX < -SWIPE_THRESHOLD) {
      setOffsetX(-MAX_SWIPE);
      setIsRevealed(true);
    } else {
      setOffsetX(0);
      setIsRevealed(false);
    }
  }, [offsetX]);

  // Mouse support for desktop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      startXRef.current = e.clientX;
      currentXRef.current = isRevealed ? -MAX_SWIPE : 0;
      isDraggingRef.current = true;
      setIsDragging(true);

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const diff = ev.clientX - startXRef.current;
        const newOffset = Math.min(
          0,
          Math.max(-MAX_SWIPE, currentXRef.current + diff),
        );
        setOffsetX(newOffset);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        setOffsetX((prev) => {
          if (prev < -SWIPE_THRESHOLD) {
            setIsRevealed(true);
            return -MAX_SWIPE;
          } else {
            setIsRevealed(false);
            return 0;
          }
        });
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isRevealed],
  );

  const closeSwipe = useCallback(() => {
    setOffsetX(0);
    setIsRevealed(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-2xl", className)}
    >
      {/* Action buttons behind */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center">
        <button
          onClick={() => {
            closeSwipe();
            onEdit?.(id);
          }}
          className="flex items-center justify-center w-[15vw] h-[94%] bg-primary text-primary-foreground gap-1 flex-col"
        >
          <Pencil className="h-4 w-4" />
          <span className="text-[10px] font-medium">{t.general.edit}</span>
        </button>
        <button
          onClick={() => {
            closeSwipe();
            onDelete?.(id);
          }}
          className="flex items-center justify-center rounded-r-2xl w-[15vw] mr-1 h-[94%] bg-destructive text-white gap-1 flex-col"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-[10px] font-medium">{t.general.delete}</span>
        </button>
      </div>

      {/* Foreground row */}
      <div
        className="relative bg-card flex items-center gap-3 p-3 rounded-2xl border border-border/60 shadow-sm transition-transform duration-200 ease-out select-none touch-pan-y"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? "none" : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
          {categoryIcon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{description}</p>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
              {date}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs text-muted-foreground truncate">
                {categoryName}
              </span>
              {accountName && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {accountName}
                  </span>
                </>
              )}
            </div>
            <p className={cn("text-sm font-semibold shrink-0", style.color)}>
              {style.prefix}
              {formatCurrency(amount, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
