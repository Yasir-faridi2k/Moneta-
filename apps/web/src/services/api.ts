import type { Budget, BudgetInput, Category, DashboardSummary, Transaction, TransactionInput } from '../types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: { ...(options.body ? { 'content-type': 'application/json' } : {}), ...options.headers },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json() as { error?: string };
      if (payload.error) message = payload.error;
    } catch { /* Keep the HTTP status message if the response is not JSON. */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const json = (method: string, value?: unknown): RequestInit => ({
  method,
  ...(value === undefined ? {} : { body: JSON.stringify(value) }),
});

export const api = {
  dashboard: (year: number, month: number) => request<DashboardSummary>(`/dashboard/summary?year=${year}&month=${month}`),
  categories: () => request<Category[]>('/categories'),
  createCategory: (value: { name: string; color?: string }) => request<Category>('/categories', json('POST', value)),
  updateCategory: (id: string, value: { name?: string; color?: string }) => request<Category>(`/categories/${id}`, json('PATCH', value)),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, json('DELETE')),
  transactions: (filters: { type?: string; categoryId?: string; q?: string } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    const query = params.size ? `?${params}` : '';
    return request<Transaction[]>(`/transactions${query}`);
  },
  transaction: (id: string) => request<Transaction>(`/transactions/${id}`),
  createTransaction: (value: TransactionInput) => request<Transaction>('/transactions', json('POST', value)),
  updateTransaction: (id: string, value: Partial<TransactionInput>) => request<Transaction>(`/transactions/${id}`, json('PATCH', value)),
  deleteTransaction: (id: string) => request<void>(`/transactions/${id}`, json('DELETE')),
  budgets: (filters: { year?: number; month?: number; categoryId?: string } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined) params.set(key, String(value)); });
    const query = params.size ? `?${params}` : '';
    return request<Budget[]>(`/budgets${query}`);
  },
  budget: (id: string) => request<Budget>(`/budgets/${id}`),
  createBudget: (value: BudgetInput) => request<Budget>('/budgets', json('POST', value)),
  updateBudget: (id: string, value: Partial<BudgetInput>) => request<Budget>(`/budgets/${id}`, json('PATCH', value)),
  deleteBudget: (id: string) => request<void>(`/budgets/${id}`, json('DELETE')),
};
