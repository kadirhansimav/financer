
export type TabType = 'dashboard' | 'assets' | 'expenses' | 'incomes' | 'insights' | 'reports' | 'settings';

export interface MarketData {
  gramGold: number;
  gramSilver: number;
  usdTry: number;
  euroTry?: number;
  lastUpdated: string;
}

export interface Asset {
  id: string;
  type: 'GOLD' | 'SILVER' | 'USD' | 'EURO' | 'STOCK' | 'TRY' | 'OTHER';
  name: string;
  amount: number;
  buyPrice: number; // Price per unit when bought
  buyDate: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export interface OneTimeIncome {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO Date
  category: string;
}

export interface Income {
  id: string;
  title: string;
  amount: number;
  dayOfMonth: number; // 1-31
  lastDepositedDate?: string; // ISO Date string of last confirmation
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  dayOfMonth: number; // 1-31
  category: string;
}

export interface InstallmentPlan {
  id: string;
  title: string;
  totalAmount: number;
  installmentCount: number;
  startDate: string;
  category: string;
  // Computed or tracked
  paidInstallments?: number; 
}

export interface AppState {
  assets: Asset[];
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  installments: InstallmentPlan[];
  incomes: Income[];
  oneTimeIncomes: OneTimeIncome[];
}

export const ASSET_TYPES: { [key: string]: string } = {
  TRY: 'Türk Lirası (Nakit)',
  GOLD: 'Altın (Gram)',
  SILVER: 'Gümüş (Gram)',
  USD: 'Amerikan Doları',
  EURO: 'Euro',
  STOCK: 'Hisse Senedi',
  OTHER: 'Diğer'
};