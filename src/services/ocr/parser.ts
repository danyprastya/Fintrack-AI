export interface ParsedReceipt {
  total: number | null;
  date: Date | null;
  merchant: string | null;
  items: ParsedItem[];
}

export interface ParsedItem {
  name: string;
  price: number;
  quantity?: number;
}

/**
 * Parse OCR text to extract receipt information
 */
export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  return {
    total: extractTotal(lines),
    date: extractDate(text),
    merchant: extractMerchant(lines),
    items: extractItems(lines),
  };
}

/**
 * Extract total amount from receipt text
 */
function extractTotal(lines: string[]): number | null {
  // Look for common total patterns in Indonesian and English receipts
  const totalPatterns = [
    /(?:total|grand total|jumlah|bayar|subtotal|sub total)\s*:?\s*(?:rp\.?\s*)?([0-9.,]+)/i,
    /(?:rp\.?\s*)([0-9.,]+)\s*$/i,
  ];

  // Search from bottom up (total usually at the bottom)
  for (let i = lines.length - 1; i >= 0; i--) {
    for (const pattern of totalPatterns) {
      const match = lines[i].match(pattern);
      if (match) {
        const amount = parseAmount(match[1]);
        if (amount > 0) return amount;
      }
    }
  }

  return null;
}

/**
 * Extract date from receipt text
 */
function extractDate(text: string): Date | null {
  const datePatterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,  // DD/MM/YYYY or DD-MM-YYYY
    /(\d{2,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,  // YYYY-MM-DD
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let day: number, month: number, year: number;

      if (parseInt(match[1]) > 31) {
        // YYYY-MM-DD format
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else {
        // DD/MM/YYYY format
        day = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        year = parseInt(match[3]);
        if (year < 100) year += 2000;
      }

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  return null;
}

/**
 * Extract merchant name (usually the first non-empty line)
 */
function extractMerchant(lines: string[]): string | null {
  if (lines.length === 0) return null;
  // First line is usually the merchant name
  const firstLine = lines[0];
  if (firstLine.length > 2 && firstLine.length < 50) {
    return firstLine;
  }
  return null;
}

/**
 * Extract individual items from receipt
 */
function extractItems(lines: string[]): ParsedItem[] {
  const items: ParsedItem[] = [];
  const itemPattern = /(.+?)\s+(?:rp\.?\s*)?([0-9.,]+)\s*$/i;

  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match) {
      const name = match[1].trim();
      const price = parseAmount(match[2]);
      if (name.length > 1 && price > 0 && !isMetadataLine(name)) {
        items.push({ name, price });
      }
    }
  }

  return items;
}

/**
 * Check if a line is metadata (not an item)
 */
function isMetadataLine(text: string): boolean {
  const metadataKeywords = [
    'total', 'subtotal', 'tax', 'pajak', 'ppn', 'diskon', 'discount',
    'tunai', 'cash', 'kembalian', 'change', 'bayar', 'payment',
  ];
  const lower = text.toLowerCase();
  return metadataKeywords.some((kw) => lower.includes(kw));
}

/**
 * Parse amount string to number
 */
function parseAmount(str: string): number {
  const cleaned = str.replace(/[.,]/g, '');
  return parseInt(cleaned) || 0;
}

/**
 * Smart categorize merchant to spending category
 */
export function categorizeMerchant(merchant: string): string {
  const lower = merchant.toLowerCase();

  const merchantCategories: Record<string, string[]> = {
    foodDrinks: [
      'starbucks', 'mcdonald', 'kfc', 'indomaret', 'alfamart',
      'warung', 'restoran', 'restaurant', 'cafe', 'coffee',
      'bakery', 'pizza', 'burger', 'sushi', 'mie', 'nasi',
      'gopay food', 'grabfood', 'shopeefood',
    ],
    transportation: [
      'grab', 'gojek', 'uber', 'bluebird', 'taxi',
      'pertamina', 'shell', 'spbu', 'parkir', 'tol',
      'transjakarta', 'mrt', 'lrt', 'kereta',
    ],
    shopping: [
      'tokopedia', 'shopee', 'lazada', 'blibli', 'bukalapak',
      'uniqlo', 'h&m', 'zara', 'mall',
    ],
    entertainment: [
      'cinema', 'bioskop', 'xxi', 'cgv', 'spotify',
      'netflix', 'youtube', 'game', 'steam',
    ],
    bills: [
      'pln', 'pdam', 'telkom', 'indihome', 'wifi',
      'listrik', 'air', 'internet', 'pulsa',
    ],
    health: [
      'apotek', 'pharmacy', 'hospital', 'rumah sakit',
      'klinik', 'clinic', 'dokter', 'doctor',
    ],
    education: [
      'sekolah', 'universitas', 'kursus', 'udemy',
      'coursera', 'buku', 'book',
    ],
  };

  for (const [category, keywords] of Object.entries(merchantCategories)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }

  return 'others';
}
