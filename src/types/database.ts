import { Timestamp } from 'firebase/firestore';

// ============================================================
// USER
// ============================================================
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  currency: string;
  monthlyBudget: number;
  telegramChatId?: string;
  language: 'id' | 'en';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// ACCOUNT / WALLET
// ============================================================
export type AccountType = 'cash' | 'bank' | 'ewallet';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// TRANSACTION
// ============================================================
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  toAccountId?: string; // For transfers
  type: TransactionType;
  amount: number;
  date: Timestamp;
  categoryId: string;
  description: string;
  imageUrl?: string;
  merchant?: string;
  isRecurring: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
  source: 'manual' | 'ocr' | 'telegram';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// CATEGORY
// ============================================================
export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  budgetLimit?: number;
  order: number;
  isDefault: boolean;
}

// ============================================================
// BUDGET
// ============================================================
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  spent: number;
  month: number; // 1-12
  year: number;
}

// ============================================================
// DEFAULT CATEGORIES
// ============================================================
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'userId'>[] = [
  { name: 'foodDrinks', type: 'expense', icon: '🍔', color: '#f97316', order: 1, isDefault: true },
  { name: 'transportation', type: 'expense', icon: '🚗', color: '#3b82f6', order: 2, isDefault: true },
  { name: 'shopping', type: 'expense', icon: '🛍️', color: '#ec4899', order: 3, isDefault: true },
  { name: 'entertainment', type: 'expense', icon: '🎬', color: '#8b5cf6', order: 4, isDefault: true },
  { name: 'bills', type: 'expense', icon: '📄', color: '#ef4444', order: 5, isDefault: true },
  { name: 'health', type: 'expense', icon: '💊', color: '#10b981', order: 6, isDefault: true },
  { name: 'education', type: 'expense', icon: '📚', color: '#06b6d4', order: 7, isDefault: true },
  { name: 'others', type: 'expense', icon: '📦', color: '#6b7280', order: 8, isDefault: true },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'userId'>[] = [
  { name: 'salary', type: 'income', icon: '💰', color: '#10b981', order: 1, isDefault: true },
  { name: 'investment', type: 'income', icon: '📈', color: '#3b82f6', order: 2, isDefault: true },
  { name: 'freelance', type: 'income', icon: '💻', color: '#8b5cf6', order: 3, isDefault: true },
  { name: 'gift', type: 'income', icon: '🎁', color: '#f97316', order: 4, isDefault: true },
  { name: 'others', type: 'income', icon: '📦', color: '#6b7280', order: 5, isDefault: true },
];
