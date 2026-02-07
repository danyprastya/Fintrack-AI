import {
  collection,
  doc,
  getDoc,
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
  writeBatch,
  DocumentReference,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import { User, Account, Transaction, Category, Budget } from '@/types/database';

// ============================================================
// GENERIC HELPERS
// ============================================================

async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T;
}

async function queryDocuments<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

// ============================================================
// USER OPERATIONS
// ============================================================

export async function getUser(userId: string): Promise<User | null> {
  return getDocument<User>('users', userId);
}

export async function createUser(userId: string, data: Partial<User>): Promise<void> {
  const docRef = doc(db, 'users', userId);
  const batch = writeBatch(db);
  batch.set(docRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  await batch.commit();
}

export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

// ============================================================
// ACCOUNT / WALLET OPERATIONS
// ============================================================

export async function getAccounts(userId: string): Promise<Account[]> {
  return queryDocuments<Account>(
    'accounts',
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );
}

export async function getAccount(accountId: string): Promise<Account | null> {
  return getDocument<Account>('accounts', accountId);
}

export async function createAccount(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'accounts'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateAccountBalance(accountId: string, amount: number): Promise<void> {
  const accountRef = doc(db, 'accounts', accountId);
  await runTransaction(db, async (transaction) => {
    const accountDoc = await transaction.get(accountRef);
    if (!accountDoc.exists()) throw new Error('Account not found');
    const currentBalance = accountDoc.data().balance || 0;
    transaction.update(accountRef, {
      balance: currentBalance + amount,
      updatedAt: Timestamp.now(),
    });
  });
}

// ============================================================
// TRANSACTION OPERATIONS (ATOMIC)
// ============================================================

export async function createTransaction(
  data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  let transactionId = '';
  const accountRef = doc(db, 'accounts', data.accountId);
  const transactionsRef = collection(db, 'transactions');

  await runTransaction(db, async (firestoreTransaction) => {
    const accountDoc = await firestoreTransaction.get(accountRef);
    if (!accountDoc.exists()) throw new Error('Account not found');

    const currentBalance = accountDoc.data().balance || 0;
    let balanceChange = 0;

    if (data.type === 'income') {
      balanceChange = data.amount;
    } else if (data.type === 'expense') {
      balanceChange = -data.amount;
    } else if (data.type === 'transfer' && data.toAccountId) {
      balanceChange = -data.amount;
      const toAccountRef = doc(db, 'accounts', data.toAccountId);
      const toAccountDoc = await firestoreTransaction.get(toAccountRef);
      if (!toAccountDoc.exists()) throw new Error('Destination account not found');
      const toBalance = toAccountDoc.data().balance || 0;
      firestoreTransaction.update(toAccountRef, {
        balance: toBalance + data.amount,
        updatedAt: Timestamp.now(),
      });
    }

    firestoreTransaction.update(accountRef, {
      balance: currentBalance + balanceChange,
      updatedAt: Timestamp.now(),
    });

    const newDocRef = doc(transactionsRef);
    transactionId = newDocRef.id;
    firestoreTransaction.set(newDocRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  return transactionId;
}

export async function getTransactions(
  userId: string,
  limitCount: number = 50
): Promise<Transaction[]> {
  return queryDocuments<Transaction>(
    'transactions',
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
}

export async function getRecentTransactions(
  userId: string,
  count: number = 5
): Promise<Transaction[]> {
  return queryDocuments<Transaction>(
    'transactions',
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(count)
  );
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  // Reverse the balance change atomically
  const transactionRef = doc(db, 'transactions', transactionId);
  await runTransaction(db, async (firestoreTransaction) => {
    const txDoc = await firestoreTransaction.get(transactionRef);
    if (!txDoc.exists()) throw new Error('Transaction not found');

    const txData = txDoc.data() as Transaction;
    const accountRef = doc(db, 'accounts', txData.accountId);
    const accountDoc = await firestoreTransaction.get(accountRef);
    if (!accountDoc.exists()) throw new Error('Account not found');

    const currentBalance = accountDoc.data().balance || 0;
    let balanceRevert = 0;

    if (txData.type === 'income') balanceRevert = -txData.amount;
    else if (txData.type === 'expense') balanceRevert = txData.amount;
    else if (txData.type === 'transfer' && txData.toAccountId) {
      balanceRevert = txData.amount;
      const toRef = doc(db, 'accounts', txData.toAccountId);
      const toDoc = await firestoreTransaction.get(toRef);
      if (toDoc.exists()) {
        firestoreTransaction.update(toRef, {
          balance: (toDoc.data().balance || 0) - txData.amount,
          updatedAt: Timestamp.now(),
        });
      }
    }

    firestoreTransaction.update(accountRef, {
      balance: currentBalance + balanceRevert,
      updatedAt: Timestamp.now(),
    });
    firestoreTransaction.delete(transactionRef);
  });
}

// ============================================================
// CATEGORY OPERATIONS
// ============================================================

export async function getCategories(userId: string): Promise<Category[]> {
  return queryDocuments<Category>(
    'categories',
    where('userId', '==', userId),
    orderBy('order', 'asc')
  );
}

export async function createCategory(data: Omit<Category, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'categories'), data);
  return docRef.id;
}

// ============================================================
// BUDGET OPERATIONS
// ============================================================

export async function getBudgets(userId: string, month: number, year: number): Promise<Budget[]> {
  return queryDocuments<Budget>(
    'budgets',
    where('userId', '==', userId),
    where('month', '==', month),
    where('year', '==', year)
  );
}

export async function upsertBudget(data: Omit<Budget, 'id'>): Promise<void> {
  const existing = await queryDocuments<Budget>(
    'budgets',
    where('userId', '==', data.userId),
    where('categoryId', '==', data.categoryId),
    where('month', '==', data.month),
    where('year', '==', data.year)
  );

  if (existing.length > 0) {
    await updateDoc(doc(db, 'budgets', existing[0].id), data);
  } else {
    await addDoc(collection(db, 'budgets'), data);
  }
}

// ============================================================
// TELEGRAM LINKING
// ============================================================

export async function getUserByTelegramChatId(chatId: string): Promise<User | null> {
  const users = await queryDocuments<User>(
    'users',
    where('telegramChatId', '==', chatId),
    limit(1)
  );
  return users.length > 0 ? users[0] : null;
}
