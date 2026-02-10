import { TransactionType } from '@/types/database';

export interface ParsedTelegramCommand {
  type: TransactionType;
  amount: number;
  description: string;
  accountName?: string;
  toAccountName?: string;
  categoryHint?: string;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Parse a natural language Telegram message into a transaction command
 *
 * Supported formats:
 *   "Makan 50000 dari Cash"           → expense, 50000, "Makan", from Cash
 *   "Gaji 5000000 ke Bank"            → income, 5000000, "Gaji", to Bank
 *   "Transfer 100000 dari Cash ke Bank" → transfer, 100000, from Cash to Bank
 *   "makan siang 35rb"                → expense, 35000, "makan siang"
 *   "gaji 5jt"                        → income, 5000000, "gaji"
 *
 * Keywords determining type:
 *   Income:  gaji, pendapatan, bonus, terima, masuk, income, salary
 *   Transfer: transfer, pindah, kirim
 *   Default: expense
 */
export function parseTelegramMessage(text: string): ParsedTelegramCommand {
  const normalized = text.trim().toLowerCase();

  if (!normalized || normalized.startsWith('/')) {
    return {
      type: 'expense',
      amount: 0,
      description: '',
      isValid: false,
      errorMessage: 'Format tidak dikenali. Contoh: "Makan 50000 dari Cash"',
    };
  }

  // Detect transaction type
  const type = detectTransactionType(normalized);

  // Extract amount
  const amount = extractAmount(normalized);
  if (!amount || amount <= 0) {
    return {
      type,
      amount: 0,
      description: text,
      isValid: false,
      errorMessage: 'Jumlah tidak ditemukan. Contoh: "Makan 50000" atau "Makan 50rb"',
    };
  }

  // Extract account info
  const { fromAccount, toAccount } = extractAccounts(normalized);

  // Build description (remove amount and account parts)
  const description = buildDescription(text, amount);

  // Try to detect category
  const categoryHint = detectCategory(description);

  return {
    type,
    amount,
    description: description || type,
    accountName: fromAccount || undefined,
    toAccountName: toAccount || undefined,
    categoryHint,
    isValid: true,
  };
}

function detectTransactionType(text: string): TransactionType {
  const incomeKeywords = ['gaji', 'pendapatan', 'bonus', 'terima', 'masuk', 'income', 'salary', 'freelance', 'investasi'];
  const transferKeywords = ['transfer', 'pindah', 'kirim', 'tf'];

  if (transferKeywords.some((kw) => text.includes(kw))) return 'transfer';
  if (incomeKeywords.some((kw) => text.includes(kw))) return 'income';
  return 'expense';
}

function extractAmount(text: string): number {
  // Match patterns like: 50000, 50.000, 50rb, 50ribu, 5jt, 5juta, 5m
  const patterns = [
    /(\d+(?:[.,]\d{3})*)\s*(jt|juta)/i,   // 5jt, 5.5juta → millions
    /(\d+(?:[.,]\d{3})*)\s*(rb|ribu)/i,   // 50rb, 50ribu → thousands
    /(\d+(?:[.,]\d{3})*)\s*(m|mil)/i,     // 5m → millions
    /(\d+(?:[.,]\d{3})*)\s*(k)/i,         // 50k → thousands
    /(?:rp\.?\s*)?(\d+(?:[.,]\d{3})*)/i,  // 50000, Rp 50.000
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = match[1].replace(/[.,]/g, '');
      let amount = parseInt(numStr);
      const suffix = match[2]?.toLowerCase();

      if (suffix === 'jt' || suffix === 'juta' || suffix === 'm' || suffix === 'mil') {
        amount *= 1_000_000;
      } else if (suffix === 'rb' || suffix === 'ribu' || suffix === 'k') {
        amount *= 1_000;
      }

      return amount;
    }
  }

  return 0;
}

function extractAccounts(text: string): { fromAccount: string | null; toAccount: string | null } {
  let fromAccount: string | null = null;
  let toAccount: string | null = null;

  const fromMatch = text.match(/(?:dari|from)\s+(\w+)/i);
  const toMatch = text.match(/(?:ke|to)\s+(\w+)/i);

  if (fromMatch) fromAccount = normalizeAccountName(fromMatch[1]);
  if (toMatch) toAccount = normalizeAccountName(toMatch[1]);

  return { fromAccount, toAccount };
}

function normalizeAccountName(name: string): string {
  const mapping: Record<string, string> = {
    cash: 'cash', tunai: 'cash', kas: 'cash',
    bank: 'bank', bca: 'bank', bri: 'bank', mandiri: 'bank', bni: 'bank',
    ewallet: 'ewallet', gopay: 'ewallet', ovo: 'ewallet', dana: 'ewallet',
    shopeepay: 'ewallet',
  };
  return mapping[name.toLowerCase()] || name;
}

function buildDescription(original: string, _amount: number): string {
  // Remove amount patterns and account references
  let desc = original
    .replace(/\d+(?:[.,]\d{3})*\s*(?:jt|juta|rb|ribu|m|mil|k)?/gi, '')
    .replace(/(?:dari|from|ke|to)\s+\w+/gi, '')
    .replace(/(?:rp\.?\s*)/gi, '')
    .trim();

  // Clean up extra spaces
  desc = desc.replace(/\s+/g, ' ').trim();
  return desc;
}

function detectCategory(description: string): string | undefined {
  const lower = description.toLowerCase();
  const categoryMap: Record<string, string[]> = {
    foodDrinks: ['makan', 'minum', 'kopi', 'nasi', 'snack', 'food', 'lunch', 'dinner', 'breakfast'],
    transportation: ['bensin', 'transport', 'grab', 'gojek', 'taxi', 'parkir', 'tol'],
    shopping: ['belanja', 'beli', 'shop', 'tokped', 'shopee'],
    entertainment: ['nonton', 'hiburan', 'game', 'film', 'bioskop'],
    bills: ['listrik', 'air', 'internet', 'pulsa', 'wifi', 'tagihan'],
    health: ['obat', 'dokter', 'rumah sakit', 'apotek'],
    education: ['buku', 'kursus', 'sekolah', 'kuliah'],
    salary: ['gaji', 'salary'],
    investment: ['investasi', 'saham', 'reksadana'],
    freelance: ['freelance', 'project', 'proyek'],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }

  return undefined;
}

/**
 * Format success response for Telegram
 */
export function formatSuccessMessage(
  type: TransactionType,
  amount: number,
  description: string,
  accountName?: string,
): string {
  const emoji = type === 'income' ? '💰' : type === 'expense' ? '💸' : '🔄';
  const typeLabel = type === 'income' ? 'Pemasukan' : type === 'expense' ? 'Pengeluaran' : 'Transfer';
  const amountStr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  let msg = `${emoji} <b>${typeLabel} Tercatat!</b>\n\n`;
  msg += `📝 ${description}\n`;
  msg += `💵 ${amountStr}\n`;
  if (accountName) msg += `👛 ${accountName}\n`;
  msg += `\n✅ Berhasil disimpan ke FinTrack AI`;

  return msg;
}
