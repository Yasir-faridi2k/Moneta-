import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './layout/AppShell';
import { ToastProvider } from './components/ui';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

export function AppRoutes() {
  return <ToastProvider><Suspense fallback={<div className="loading-state route-loading">Loading your workspace…</div>}><Routes><Route element={<AppShell />}>
    <Route index element={<DashboardPage />} />
    <Route path="transactions" element={<TransactionsPage />} />
    <Route path="budgets" element={<BudgetsPage />} />
    <Route path="categories" element={<CategoriesPage />} />
    <Route path="reports" element={<ReportsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route></Routes></Suspense></ToastProvider>;
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
