"use client";

import { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useDynamicIslandToast } from "@/components/ui/dynamic-island-toast";
import { PageHeader } from "@/components/shared/page-header";
import { CameraView } from "@/components/scan/camera-view";
import { OCRResult } from "@/components/scan/ocr-result";
import { recognizeText, terminateOCR } from "@/services/ocr/engine";
import { parseReceiptText, categorizeMerchant } from "@/services/ocr/parser";
import { Loader2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import {
  createTransactionWithBalance,
  getWallets,
  type WalletDoc,
} from "@/lib/firestore-service";

type ScanState = "camera" | "processing" | "result";

interface ScanResult {
  total: number | null;
  date: string | null;
  merchant: string | null;
}

export default function ScanPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useDynamicIslandToast();
  const [state, setState] = useState<ScanState>("camera");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [wallets, setWallets] = useState<WalletDoc[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    getWallets(user.uid).then(setWallets).catch(console.error);
  }, [user?.uid]);

  const processImage = useCallback(async (image: Blob | File) => {
    setState("processing");
    setProgress(0);

    try {
      const ocrResult = await recognizeText(image);
      const parsed = parseReceiptText(ocrResult.text);

      setResult({
        total: parsed.total,
        date: parsed.date?.toISOString().split("T")[0] || null,
        merchant: parsed.merchant,
      });
      setState("result");
    } catch (error) {
      console.error("OCR Error:", error);
      setState("camera");
    }
  }, []);

  const handleSave = useCallback(
    async (data: { total: number; merchant: string; date: string }) => {
      if (!user?.uid) return;

      try {
        const categoryName = data.merchant
          ? categorizeMerchant(data.merchant)
          : "others";

        // Map category name to icon
        const CATEGORY_ICONS: Record<string, string> = {
          foodDrinks: "🍔",
          transportation: "🚗",
          shopping: "🛍️",
          entertainment: "🎬",
          bills: "📄",
          health: "💊",
          education: "📚",
          others: "📦",
        };

        const txDate = data.date
          ? Timestamp.fromDate(new Date(data.date))
          : Timestamp.now();

        await createTransactionWithBalance({
          userId: user.uid,
          type: "expense",
          amount: data.total,
          description:
            data.merchant || (language === "id" ? "Struk OCR" : "OCR Receipt"),
          category: categoryName,
          categoryIcon: CATEGORY_ICONS[categoryName] || "📦",
          walletId: wallets.length > 0 ? wallets[0].id : undefined,
          date: txDate,
          source: "ocr",
        });

        showToast(
          "success",
          language === "id"
            ? "Transaksi dari struk disimpan"
            : "Receipt transaction saved",
        );
      } catch (err) {
        console.error("Save receipt error:", err);
        showToast(
          "error",
          language === "id" ? "Gagal menyimpan" : "Failed to save",
        );
      }

      setState("camera");
      setResult(null);
    },
    [user?.uid, wallets, showToast, language],
  );

  const handleRetry = useCallback(() => {
    setState("camera");
    setResult(null);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={t.scan.title} />

      <div className="flex-1 p-4 space-y-4">
        {state === "camera" && (
          <CameraView
            onCapture={(blob) => processImage(blob)}
            onUpload={(file) => processImage(file)}
            isProcessing={false}
          />
        )}

        {state === "processing" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-muted flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold">{t.scan.processing}</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI-OCR Tesseract.js
              </p>
            </div>
          </div>
        )}

        {state === "result" && result && (
          <OCRResult
            total={result.total}
            date={result.date}
            merchant={result.merchant}
            onSave={handleSave}
            onRetry={handleRetry}
          />
        )}
      </div>
    </div>
  );
}
