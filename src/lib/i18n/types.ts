export type Language = 'id' | 'en';

export interface Translations {
  // Navigation
  nav: {
    home: string;
    transactions: string;
    scan: string;
    converter: string;
    analytics: string;
    settings: string;
  };

  // Dashboard
  dashboard: {
    greeting: string;
    totalBalance: string;
    income: string;
    expense: string;
    recentTransactions: string;
    viewAll: string;
    thisMonthBudget: string;
    quickActions: string;
    addIncome: string;
    addExpense: string;
    transfer: string;
    scanReceipt: string;
    noTransactions: string;
    budgetUsed: string;
    limit: string;
    of: string;
    remaining: string;
    overBudget: string;
  };

  // Transactions
  transactions: {
    title: string;
    search: string;
    filter: string;
    all: string;
    incomeType: string;
    expenseType: string;
    transferType: string;
    today: string;
    yesterday: string;
    thisWeek: string;
    thisMonth: string;
    noTransactions: string;
    deleteConfirm: string;
    addTransaction: string;
  };

  // Scanner
  scan: {
    title: string;
    instruction: string;
    takePhoto: string;
    processing: string;
    results: string;
    total: string;
    date: string;
    merchant: string;
    save: string;
    retry: string;
    category: string;
    account: string;
    noCamera: string;
    scanFailed: string;
    uploadImage: string;
  };

  // Analytics
  analytics: {
    title: string;
    spendingByCategory: string;
    monthlyTrend: string;
    incomeVsExpense: string;
    topSpending: string;
    period: string;
    weekly: string;
    monthly: string;
    yearly: string;
    noData: string;
    totalIncome: string;
    totalExpense: string;
    netBalance: string;
  };

  // Settings
  settings: {
    title: string;
    profile: string;
    language: string;
    languageId: string;
    languageEn: string;
    currency: string;
    monthlyBudget: string;
    wallets: string;
    connectTelegram: string;
    telegramConnected: string;
    telegramInstruction: string;
    about: string;
    version: string;
    signOut: string;
    signIn: string;
    darkMode: string;
    notifications: string;
    categories: string;
    editProfile: string;
    save: string;
    cancel: string;
    general: string;
    security: string;
    data: string;
    exportData: string;
    importData: string;
    deleteAccount: string;
    addWallet: string;
    walletName: string;
    walletBalance: string;
    cash: string;
    bank: string;
    ewallet: string;
  };

  // Categories
  categories: {
    foodDrinks: string;
    transportation: string;
    shopping: string;
    entertainment: string;
    bills: string;
    health: string;
    education: string;
    salary: string;
    investment: string;
    freelance: string;
    gift: string;
    others: string;
  };

  // General / Common
  general: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    loading: string;
    error: string;
    noData: string;
    retry: string;
    confirm: string;
    success: string;
    back: string;
    next: string;
    close: string;
    add: string;
    amount: string;
    description: string;
    date: string;
    category: string;
    account: string;
    from: string;
    to: string;
    appName: string;
    appTagline: string;
  };

  // Months
  months: {
    jan: string;
    feb: string;
    mar: string;
    apr: string;
    may: string;
    jun: string;
    jul: string;
    aug: string;
    sep: string;
    oct: string;
    nov: string;
    dec: string;
  };
}
