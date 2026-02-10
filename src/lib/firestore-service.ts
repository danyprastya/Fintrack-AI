/**
 * Firestore Service Layer
 *
 * All client-side Firestore operations go through here.
 * Uses lazy-init getFirebaseDb() so it works with SSR/SSG.
 */
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  QueryConstraint,
  Firestore,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

// ============================================================
// HELPERS
// ============================================================

function db(): Firestore {
  const firestore = getFirebaseDb();
  if (!firestore) throw new Error("Firestore not initialized");
  return firestore;
}

async function queryDocuments<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db(), collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

// ============================================================
// WALLET / ACCOUNT
// ============================================================

export interface WalletDoc {
  id: string;
  userId: string;
  name: string;
  type: "cash" | "bank" | "ewallet";
  balance: number;
  icon: string;
  isDefault?: boolean;
  createdAt: Timestamp;
}

export async function getWallets(userId: string): Promise<WalletDoc[]> {
  return queryDocuments<WalletDoc>(
    "wallets",
    where("userId", "==", userId),
    orderBy("createdAt", "asc"),
  );
}

export async function createWallet(
  data: Omit<WalletDoc, "id" | "createdAt">,
): Promise<string> {
  const docRef = await addDoc(collection(db(), "wallets"), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateWallet(
  walletId: string,
  data: Partial<WalletDoc>,
): Promise<void> {
  await updateDoc(doc(db(), "wallets", walletId), data);
}

export async function deleteWallet(walletId: string): Promise<void> {
  await deleteDoc(doc(db(), "wallets", walletId));
}

// ============================================================
// TRANSACTIONS
// ============================================================

export interface TransactionDoc {
  id: string;
  userId: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  category: string;
  categoryIcon: string;
  walletId?: string;
  toWalletId?: string;
  date: Timestamp;
  createdAt: Timestamp;
  source: "manual" | "ocr" | "telegram";
}

export async function getTransactions(
  userId: string,
  limitCount: number = 50,
): Promise<TransactionDoc[]> {
  return queryDocuments<TransactionDoc>(
    "transactions",
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );
}

export async function getRecentTransactions(
  userId: string,
  count: number = 5,
): Promise<TransactionDoc[]> {
  return queryDocuments<TransactionDoc>(
    "transactions",
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(count),
  );
}

export async function createTransactionWithBalance(
  data: Omit<TransactionDoc, "id" | "createdAt">,
): Promise<string> {
  const firestore = db();
  let transactionId = "";

  // If walletId exists, do atomic transaction + balance update
  if (data.walletId) {
    const walletRef = doc(firestore, "wallets", data.walletId);
    const txColRef = collection(firestore, "transactions");

    await runTransaction(firestore, async (t) => {
      const walletSnap = await t.get(walletRef);
      if (!walletSnap.exists()) throw new Error("Wallet not found");

      const currentBalance = walletSnap.data().balance || 0;
      let balanceChange = 0;

      if (data.type === "income") balanceChange = data.amount;
      else if (data.type === "expense") balanceChange = -data.amount;
      else if (data.type === "transfer" && data.toWalletId) {
        balanceChange = -data.amount;
        const toRef = doc(firestore, "wallets", data.toWalletId);
        const toSnap = await t.get(toRef);
        if (toSnap.exists()) {
          t.update(toRef, {
            balance: (toSnap.data().balance || 0) + data.amount,
          });
        }
      }

      t.update(walletRef, { balance: currentBalance + balanceChange });

      const newDocRef = doc(txColRef);
      transactionId = newDocRef.id;
      t.set(newDocRef, { ...data, createdAt: Timestamp.now() });
    });
  } else {
    // No wallet — just add the document
    const docRef = await addDoc(collection(firestore, "transactions"), {
      ...data,
      createdAt: Timestamp.now(),
    });
    transactionId = docRef.id;
  }

  return transactionId;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const firestore = db();
  const txRef = doc(firestore, "transactions", transactionId);

  await runTransaction(firestore, async (t) => {
    const txSnap = await t.get(txRef);
    if (!txSnap.exists()) throw new Error("Transaction not found");

    const txData = txSnap.data() as TransactionDoc;

    // Reverse balance if linked to a wallet
    if (txData.walletId) {
      const walletRef = doc(firestore, "wallets", txData.walletId);
      const walletSnap = await t.get(walletRef);
      if (walletSnap.exists()) {
        const currentBalance = walletSnap.data().balance || 0;
        let revert = 0;
        if (txData.type === "income") revert = -txData.amount;
        else if (txData.type === "expense") revert = txData.amount;
        else if (txData.type === "transfer" && txData.toWalletId) {
          revert = txData.amount;
          const toRef = doc(firestore, "wallets", txData.toWalletId);
          const toSnap = await t.get(toRef);
          if (toSnap.exists()) {
            t.update(toRef, {
              balance: (toSnap.data().balance || 0) - txData.amount,
            });
          }
        }
        t.update(walletRef, { balance: currentBalance + revert });
      }
    }

    t.delete(txRef);
  });
}

// ============================================================
// BUDGETS
// ============================================================

export interface BudgetDoc {
  id: string;
  userId: string;
  categoryName: string;
  categoryIcon: string;
  limit: number;
  spent: number;
  month: number;
  year: number;
  color: string;
}

export async function getBudgets(
  userId: string,
  month: number,
  year: number,
): Promise<BudgetDoc[]> {
  return queryDocuments<BudgetDoc>(
    "budgets",
    where("userId", "==", userId),
    where("month", "==", month),
    where("year", "==", year),
  );
}

// ============================================================
// AGGREGATION HELPERS (client-side)
// ============================================================

/** Compute total balance from all wallets */
export function computeTotalBalance(wallets: WalletDoc[]): number {
  return wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
}

/** Compute monthly income/expense from transactions */
export function computeMonthlyTotals(
  transactions: TransactionDoc[],
  month: number,
  year: number,
): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    const txDate = tx.date?.toDate?.() || tx.createdAt?.toDate?.();
    if (!txDate) continue;
    if (txDate.getMonth() + 1 === month && txDate.getFullYear() === year) {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
    }
  }
  return { income, expense };
}

/** Group transactions by date string for display */
export function groupTransactionsByDate(
  transactions: TransactionDoc[],
  locale: string = "id-ID",
): {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  categoryIcon: string;
  categoryName: string;
  date: string;
  dateGroup: string;
  walletId?: string;
}[] {
  return transactions.map((tx) => {
    const d = tx.date?.toDate?.() || tx.createdAt?.toDate?.() || new Date();
    const dateStr = d.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return {
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      categoryIcon: tx.categoryIcon || "📦",
      categoryName: tx.category || "others",
      date: timeStr,
      dateGroup: dateStr,
      walletId: tx.walletId,
    };
  });
}

/** Compute spending per category for analytics */
export function computeCategorySpending(
  transactions: TransactionDoc[],
  month: number,
  year: number,
): { category: string; icon: string; amount: number }[] {
  const map = new Map<string, { icon: string; amount: number }>();

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    const d = tx.date?.toDate?.() || tx.createdAt?.toDate?.();
    if (!d) continue;
    if (d.getMonth() + 1 !== month || d.getFullYear() !== year) continue;

    const key = tx.category || "others";
    const existing = map.get(key) || { icon: tx.categoryIcon || "📦", amount: 0 };
    existing.amount += tx.amount;
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      icon: data.icon,
      amount: data.amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}
