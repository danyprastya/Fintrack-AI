"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ICON_PICKER_OPTIONS, getCategoryIcon } from "@/lib/category-icons";
import { X, Search } from "lucide-react";

interface IconPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconKey: string) => void;
  selected?: string;
}

export function IconPickerDialog({
  open,
  onClose,
  onSelect,
  selected,
}: IconPickerDialogProps) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const filtered = search
    ? ICON_PICKER_OPTIONS.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase()),
      )
    : ICON_PICKER_OPTIONS;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-xs bg-background rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 p-3 pb-2 border-b">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Pick Icon</h4>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/50 border text-xs outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
        {/* Icon Grid */}
        <div className="p-3 grid grid-cols-6 gap-2 max-h-[40vh] overflow-y-auto">
          {filtered.map((opt) => {
            const Ico = opt.Icon;
            return (
              <button
                key={opt.name}
                onClick={() => {
                  onSelect(opt.name);
                  onClose();
                }}
                className={cn(
                  "h-10 w-full rounded-xl flex items-center justify-center transition-all",
                  selected === opt.name
                    ? "bg-primary text-primary-foreground scale-105"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Ico className="h-4.5 w-4.5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Small preview button that shows the selected icon and opens picker
export function IconPickerButton({
  value,
  onClick,
  className,
}: {
  value: string;
  onClick: () => void;
  className?: string;
}) {
  const Icon = getCategoryIcon(value);
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 w-12 rounded-lg bg-muted/50 border flex items-center justify-center hover:bg-muted transition-colors",
        className,
      )}
    >
      <Icon className="h-4 w-4 text-foreground" />
    </button>
  );
}
