export type Category = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  _count?: { transactions: number; budgets: number };
};

export type Transaction = {
  id: string;
  title: string;
  amountPaise: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
};

export type Budget = {
  id: string;
  amountPaise: number;
  spentPaise: number;
  remainingPaise: number;
  percentUsed: number;
  warning: 'near-limit' | 'exceeded' | null;
  month: number;
  year: number;
  categoryId: string;
  category: Category;
};

export type DashboardSummary = {
  period: { year: number; month: number };
  balancePaise: number;
  totalIncomePaise: number;
  totalExpensesPaise: number;
  budgetPaise: number;
  remainingBudgetPaise: number;
  recentTransactions: Transaction[];
  expenseByCategory: { categoryId: string; name: string; color: string; amountPaise: number }[];
  monthlyTotals: { month: string; incomePaise: number; expensesPaise: number }[];
};

export type TransactionInput = {
  title: string;
  amountPaise: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  categoryId: string;
};

export type BudgetInput = {
  amountPaise: number;
  month: number;
  year: number;
  categoryId: string;
};
