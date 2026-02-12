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
    amountPlaceholder: string;
    descriptionPlaceholder: string;
    selectWallet: string;
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
    ocrDefaultDesc: string;
  };

  // Analytics
  analytics: {
    title: string;
    spendingByCategory: string;
    incomeByCategory: string;
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
    income: string;
    expense: string;
    net: string;
    all: string;
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
    budgetAmount: string;
    categoriesDesc: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    selectCurrency: string;
    depositTo: string;
    payFrom: string;
    walletNamePlaceholder: string;
    initialBalance: string;
    exporting: string;
    downloadCsv: string;
    googleAuthInfo: string;
    editWallet: string;
    deleteWalletTitle: string;
    deleteWalletConfirm: string;
    customCategories: string;
    addCategory: string;
    categoryName: string;
    walletColor: string;
  };

  // Login / Auth
  login: {
    subtitle: string;
    login: string;
    register: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    phonePlaceholder: string;
    orWith: string;
    google: string;
    noAccount: string;
    hasAccount: string;
    registerHere: string;
    loginHere: string;
    errorLogin: string;
    useGoogleLogin: string;
    errorGoogle: string;
    sendOtp: string;
    verifyTitle: string;
    verifySub: string;
    verify: string;
    resend: string;
    resendIn: string;
    back: string;
    pwMin: string;
    pwUpper: string;
    pwLower: string;
    pwNumber: string;
    pwSpecial: string;
    pwStrength: string;
    secureInfo: string;
    devOtpLabel: string;
    verifyFailed: string;
    resendFailed: string;
  };

  // Profile
  profile: {
    title: string;
    name: string;
    email: string;
    save: string;
    saved: string;
    signOut: string;
    signOutConfirm: string;
    joined: string;
    photoHint: string;
    deletePhoto: string;
    uploading: string;
    photoMaxSize: string;
    photoSuccess: string;
    photoDeleted: string;
    photoError: string;
    deletePhotoFailed: string;
    saveFailed: string;
    signOutFailed: string;
    unsupportedFormat: string;
    photoReady: string;
    discardTitle: string;
    discardMessage: string;
    discard: string;
    continueEditing: string;
  };

  // Telegram Link
  telegram: {
    title: string;
    desc: string;
    generate: string;
    regenerate: string;
    linked: string;
    linkedAs: string;
    unlink: string;
    copied: string;
    copy: string;
    expires: string;
    sec: string;
    step1: string;
    step2: string;
    step3: string;
    unlinkConfirm: string;
    error: string;
  };

  // Photo Crop
  photoCrop: {
    title: string;
    hint: string;
    cancel: string;
    confirm: string;
  };

  // Converter
  converter: {
    title: string;
    from: string;
    to: string;
    currentRate: string;
    popularPairs: string;
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
    signOutFailed: string;
    transactionAdded: string;
    transactionDeleted: string;
    walletAdded: string;
    walletDeleted: string;
    walletAddFailed: string;
    dataExported: string;
    passwordChanged: string;
    passwordFailed: string;
    passwordMismatch: string;
    passwordTooShort: string;
    currencyChanged: string;
    budgetSaved: string;
    budgetDeleted: string;
    telegramError: string;
    telegramLinked: string;
    telegramUnlinked: string;
    codeCopied: string;
    ocrSaved: string;
    ocrFailed: string;
    nameSaved: string;
    deleteFailed: string;
    addFailed: string;
    saveFailed: string;
    exportFailed: string;
    noDataExport: string;
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
    saving: string;
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
