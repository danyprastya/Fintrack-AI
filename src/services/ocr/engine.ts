import { createWorker, Worker } from 'tesseract.js';

let worker: Worker | null = null;

/**
 * Initialize or reuse Tesseract worker
 */
async function getWorker(): Promise<Worker> {
  if (!worker) {
    worker = await createWorker('ind+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          // Progress callback can be used for UI updates
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
  }
  return worker;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Perform OCR on an image
 */
export async function recognizeText(image: File | Blob | string): Promise<OCRResult> {
  const w = await getWorker();
  const result = await w.recognize(image);
  return {
    text: result.data.text,
    confidence: result.data.confidence,
  };
}

/**
 * Terminate the OCR worker to free resources
 */
export async function terminateOCR(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
