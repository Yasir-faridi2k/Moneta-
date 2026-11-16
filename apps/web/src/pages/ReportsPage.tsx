import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, FileBarChart2 } from 'lucide-react';
import type { DashboardSummary, Transaction } from '../types';
import { api } from '../services/api';
import { money, monthLabel, shortDate } from '../utils/format';
import { transactionsToCsv } from '../utils/csv.js';
import { Button, EmptyState, ErrorState, LoadingState, PageTitle, Panel, useToast } from '../components/ui';

function currencyTick(value: number) {
  return value === 0 ? '₹0' : `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 0 }).format(value / 100)}`;
}

export default function ReportsPage() {
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const notify = useToast();
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [report, allTransactions] = await Promise.all([api.dashboard(period.year, period.month), api.transactions()]);
      setSummary(report); setTransactions(allTransactions);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setLoading(false); }
  }, [period]);
  useEffect(() => { void load(); }, [load]);

  const periodTransactions = useMemo(() => transactions.filter((item) => {
    const date = new Date(item.date);
    return date.getUTCFullYear() === period.year && date.getUTCMonth() + 1 === period.month;
  }), [transactions, period]);
  const moveMonth = (direction: number) => setPeriod((current) => {
    const date = new Date(Date.UTC(current.year, current.month - 1 + direction, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  });

  function exportCsv() {
    if (!periodTransactions.length) return;
    const blob = new Blob([transactionsToCsv(periodTransactions)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `moneta-transactions-${period.year}-${String(period.month).padStart(2, '0')}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    notify(`Exported ${periodTransactions.length} transaction${periodTransactions.length === 1 ? '' : 's'} to CSV.`);
  }

  return <div className="page">
    <PageTitle eyebrow="THE BIGGER PICTURE" title="Reports" description="Monthly patterns, made easier to understand." action={<div className="report-actions"><div className="month-switcher"><button aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button><span>{monthLabel(period.year, period.month)}</span><button aria-label="Next month" onClick={() => moveMonth(1)} disabled={period.year === now.getFullYear() && period.month >= now.getMonth() + 1}>›</button></div><Button variant="secondary" onClick={exportCsv} disabled={!periodTransactions.length}><Download size={16} /> Export CSV</Button></div>} />
    {loading && <LoadingState label="Building your report…" />}
    {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
    {!loading && summary && <>
      <div className="report-summary-grid">
        <div className="report-summary-card"><span>Income</span><strong className="positive">{money(summary.totalIncomePaise)}</strong><small>Money received this month</small></div>
        <div className="report-summary-card"><span>Expenses</span><strong>{money(summary.totalExpensesPaise)}</strong><small>Money spent this month</small></div>
        <div className="report-summary-card"><span>Net cash flow</span><strong className={summary.totalIncomePaise - summary.totalExpensesPaise >= 0 ? 'positive' : 'warning-text'}>{money(summary.totalIncomePaise - summary.totalExpensesPaise)}</strong><small>Income less expenses</small></div>
        <div className="report-summary-card"><span>Transactions</span><strong>{periodTransactions.length}</strong><small>Records this month</small></div>
      </div>
      <div className="reports-grid">
        <Panel title="Monthly cash flow" subtitle="Income compared with spending" className="report-chart-panel">
          {summary.monthlyTotals.some((item) => item.incomePaise || item.expensesPaise) ? <div className="chart-wrap report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={summary.monthlyTotals} margin={{ top: 14, right: 8, bottom: 0, left: 4 }} barGap={5}>
            <CartesianGrid vertical={false} stroke="#edf0ea" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#898d86', fontSize: 11 }} tickFormatter={(value: string) => monthLabel(Number(value.slice(0, 4)), Number(value.slice(5)), 'short').split(' ')[0]} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#898d86', fontSize: 11 }} tickFormatter={currencyTick} width={58} />
            <Tooltip formatter={(value) => money(Number(value))} labelFormatter={(value) => { const [year, month] = String(value).split('-').map(Number); return monthLabel(year, month); }} contentStyle={{ borderRadius: 12, borderColor: '#e8eae5' }} />
            <Bar dataKey="incomePaise" name="Income" fill="#719676" radius={[5, 5, 0, 0]} maxBarSize={25} />
            <Bar dataKey="expensesPaise" name="Expenses" fill="#e1ae7f" radius={[5, 5, 0, 0]} maxBarSize={25} />
          </BarChart></ResponsiveContainer></div> : <div className="chart-empty">No monthly activity to chart yet.</div>}
        </Panel>
        <Panel title="Spending by category" subtitle={monthLabel(period.year, period.month)} className="report-breakdown-panel">
          {summary.expenseByCategory.length ? <div className="report-breakdown-list">{summary.expenseByCategory.map((item) => <div className="breakdown-item" key={item.categoryId}><div className="breakdown-label"><span><i style={{ background: item.color }} />{item.name}</span><strong>{money(item.amountPaise)}</strong></div><div className="breakdown-track"><span style={{ width: `${summary.totalExpensesPaise ? Math.min(100, item.amountPaise / summary.totalExpensesPaise * 100) : 0}%`, background: item.color }} /></div><small>{summary.totalExpensesPaise ? Math.round(item.amountPaise / summary.totalExpensesPaise * 100) : 0}% of monthly spending</small></div>)}</div> : <div className="chart-empty">No spending recorded for this month.</div>}
        </Panel>
      </div>
      <Panel title="Monthly records" subtitle={`${periodTransactions.length} saved transactions`} className="report-transactions-panel">
        {periodTransactions.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>DATE</th><th>DESCRIPTION</th><th>CATEGORY</th><th>TYPE</th><th className="align-right">AMOUNT</th></tr></thead><tbody>{periodTransactions.map((item) => <tr key={item.id}><td className="muted-cell">{shortDate(item.date)}</td><td>{item.title}</td><td><span className="category-chip"><i style={{ background: item.category.color }} />{item.category.name}</span></td><td><span className={`type-pill ${item.type.toLowerCase()}`}>{item.type === 'INCOME' ? 'Income' : 'Expense'}</span></td><td className={`align-right amount-cell ${item.type === 'INCOME' ? 'positive' : ''}`}>{item.type === 'INCOME' ? '+' : '−'}{money(item.amountPaise)}</td></tr>)}</tbody></table></div> : <EmptyState title="Nothing to report yet" description="Transactions you add for this month will appear here." />}
      </Panel>
      <div className="export-note"><FileBarChart2 size={17} /><span>CSV export includes saved transaction dates, categories, type, and exact paise amounts.</span></div>
    </>}
  </div>;
}
