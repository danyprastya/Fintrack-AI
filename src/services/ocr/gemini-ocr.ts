/**
 * Receipt OCR using Google Gemini Flash 2.0.
 *
 * Gemini Flash is free-tier eligible (15 RPM, 1500 RPD) and provides
 * much higher accuracy than client-side Tesseract.js for receipt parsing.
 *
 * Env var required: GEMINI_API_KEY
 * Get one at: https://aistudio.google.com/apikey
 */

export interface GeminiOCRResult {
  total: number | null;
  date: string | null;
  merchant: string | null;
  items: { name: string; price: number; quantity?: number }[];
  rawText: string;
  confidence: "high" | "medium" | "low";
}

const GEMINI_MODEL = "gemini-2.0-flash";

const RECEIPT_PROMPT = `You are a receipt/invoice OCR parser. Analyze this image of a receipt and extract the following information in JSON format:

{
  "total": <number or null — the grand total/final amount paid>,
  "date": <string "YYYY-MM-DD" or null — the transaction date>,
  "merchant": <string or null — the store/merchant name>,
  "items": [{"name": "<item name>", "price": <number>, "quantity": <number or 1>}],
  "rawText": "<full text content of the receipt>",
  "confidence": "<high|medium|low — how confident you are in the extraction>"
}

Rules:
- For Indonesian receipts: "total", "jumlah", "bayar", "grand total" indicate the final amount
- Amounts are in the local currency (likely IDR) — return raw numbers without currency symbols
- If the receipt is blurry or partially visible, still extract what you can and set confidence to "low"
- Return ONLY the JSON object, no markdown or explanation
- If this is not a receipt/invoice image, return: {"total": null, "date": null, "merchant": null, "items": [], "rawText": "", "confidence": "low"}`;

/**
 * Process a receipt image using Gemini Flash vision API.
 * Accepts base64-encoded image data.
 */
export async function recognizeReceiptWithGemini(
  imageBase64: string,
  mimeType: string = "image/jpeg",
): Promise<GeminiOCRResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: RECEIPT_PROMPT },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 0.8,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Gemini API error:", error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract text from Gemini response
  const textContent =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  try {
    // Clean the response (remove potential markdown code blocks)
    const cleaned = textContent
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed: GeminiOCRResult = JSON.parse(cleaned);

    return {
      total: parsed.total ?? null,
      date: parsed.date ?? null,
      merchant: parsed.merchant ?? null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      rawText: parsed.rawText ?? "",
      confidence: parsed.confidence ?? "low",
    };
  } catch {
    console.error("Failed to parse Gemini response:", textContent);
    return {
      total: null,
      date: null,
      merchant: null,
      items: [],
      rawText: textContent,
      confidence: "low",
    };
  }
}

/**
 * Check if Gemini OCR is available (API key configured)
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
