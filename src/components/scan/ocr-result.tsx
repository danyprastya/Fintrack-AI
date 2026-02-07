"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, RotateCcw, Receipt } from "lucide-react";

interface OCRResultProps {
  total: number | null;
  date: string | null;
  merchant: string | null;
  onSave: (data: { total: number; merchant: string; date: string }) => void;
  onRetry: () => void;
  className?: string;
}

export function OCRResult({
  total,
  date,
  merchant,
  onSave,
  onRetry,
  className,
}: OCRResultProps) {
  const { t } = useLanguage();

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-5 w-5 text-primary" />
          {t.scan.results}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t.scan.merchant}
            </label>
            <Input
              defaultValue={merchant || ""}
              placeholder={t.scan.merchant}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t.scan.total}
            </label>
            <div className="mt-1 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xl font-bold text-primary">
                {total ? formatCurrency(total) : "-"}
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t.scan.date}
            </label>
            <Input
              type="date"
              defaultValue={date || new Date().toISOString().split("T")[0]}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onRetry}
            className="flex-1 h-11 rounded-xl"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t.scan.retry}
          </Button>
          <Button
            onClick={() =>
              onSave({
                total: total || 0,
                merchant: merchant || "",
                date: date || new Date().toISOString(),
              })
            }
            className="flex-1 h-11 rounded-xl"
          >
            <Check className="mr-2 h-4 w-4" />
            {t.scan.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
