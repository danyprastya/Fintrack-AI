import { NextRequest, NextResponse } from "next/server";
import {
  recognizeReceiptWithGemini,
  isGeminiConfigured,
} from "@/services/ocr/gemini-ocr";

export const runtime = "nodejs";

/**
 * POST /api/ocr/recognize
 *
 * Accepts an uploaded image and returns structured receipt data
 * using Google Gemini Flash for OCR.
 *
 * Body: FormData with "image" field (File/Blob)
 * Returns: { total, date, merchant, items, rawText, confidence }
 */
export async function POST(request: NextRequest) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: "OCR service not configured" },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: "Unsupported image format. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 },
      );
    }

    // Validate file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large. Maximum 10MB." },
        { status: 400 },
      );
    }

    // Convert to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Process with Gemini
    const result = await recognizeReceiptWithGemini(base64, imageFile.type);

    return NextResponse.json(result);
  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 },
    );
  }
}
