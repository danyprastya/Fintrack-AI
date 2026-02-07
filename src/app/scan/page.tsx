"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import { PageHeader } from "@/components/shared/page-header";
import { CameraView } from "@/components/scan/camera-view";
import { OCRResult } from "@/components/scan/ocr-result";
import { recognizeText, terminateOCR } from "@/services/ocr/engine";
import { parseReceiptText, categorizeMerchant } from "@/services/ocr/parser";
import { Loader2 } from "lucide-react";

type ScanState = "camera" | "processing" | "result";

interface ScanResult {
  total: number | null;
  date: string | null;
  merchant: string | null;
}

export default function ScanPage() {
  const { t } = useLanguage();
  const [state, setState] = useState<ScanState>("camera");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [progress, setProgress] = useState(0);

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
    (data: { total: number; merchant: string; date: string }) => {
      // TODO: Save to Firestore
      console.log("Saving receipt:", data);
      if (data.merchant) {
        const category = categorizeMerchant(data.merchant);
        console.log("Auto-categorized as:", category);
      }
      setState("camera");
      setResult(null);
    },
    [],
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
