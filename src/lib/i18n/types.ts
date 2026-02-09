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
    noWallets: string;
    signOutConfirm: string;
    signOutTitle: string;
    aboutDesc: string;
    currencyDesc: string;
    securityDesc: string;
    exportDesc: string;
    budgetDesc: string;
    categoriesDesc: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    selectCurrency: string;
    depositTo: string;
    payFrom: string;
  };

  // Notifications page
  notificationsPage: {
    markAllRead: string;
    clearAll: string;
    noNotifications: string;
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  };

  // Empty states
  emptyState: {
    noTransactions: string;
    noTransactionsDesc: string;
    noBudgets: string;
    noBudgetsDesc: string;
    noAnalytics: string;
    noAnalyticsDesc: string;
    noWallets: string;
    noWalletsDesc: string;
  };

  // Toast messages
  toast: {
    loginSuccess: string;
    loginFailed: string;
    registerSuccess: string;
    accountExists: string;
    profileSaved: string;
    photoUpdated: string;
    photoDeleted: string;
    photoFailed: string;
    googleFailed: string;
    popupClosed: string;
    unauthorized: string;
    googleNotEnabled: string;
    signOutSuccess: string;
    transactionAdded: string;
    transactionDeleted: string;
    walletAdded: string;
    walletDeleted: string;
    dataExported: string;
    passwordChanged: string;
    passwordFailed: string;
    currencyChanged: string;
    budgetSaved: string;
    telegramError: string;
    telegramLinked: string;
    telegramUnlinked: string;
    codeCopied: string;
    ocrSaved: string;
    ocrFailed: string;
    nameSaved: string;
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
