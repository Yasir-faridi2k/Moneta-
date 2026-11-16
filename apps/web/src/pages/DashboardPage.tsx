import { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, ChevronRight, CircleDollarSign, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';
import type { DashboardSummary } from '../types';
import { money, monthLabel, shortDate } from '../utils/format';
import { ErrorState, LoadingState, PageTitle, Panel } from '../components/ui';

function Metric({ label, value, note, tone, icon: Icon }: { label: string; value: string; note: string; tone?: 'green' | 'orange'; icon: typeof Wallet }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone ?? ''}`}><Icon size={18} strokeWidth={1.8} /></span></div><strong>{value}</strong><small>{note}</small></article>;
}

function currencyTick(value: number) {
  return value === 0 ? '₹0' : `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 0 }).format(value / 100)}`;
}

export default function DashboardPage() {
  const now = new Date();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setSummary(await api.dashboard(period.year, period.month)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setLoading(false); }
  }, [period]);
  useEffect(() => { void load(); }, [load]);

  const moveMonth = (direction: number) => setPeriod((current) => {
    const date = new Date(Date.UTC(current.year, current.month - 1 + direction, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  });

  return <div className="page page-dashboard">
    <PageTitle eyebrow="YOUR MONEY AT A GLANCE" title="Overview" description="A clear view of where you stand." action={<div className="month-switcher"><button aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button><span>{monthLabel(period.year, period.month)}</span><button aria-label="Next month" onClick={() => moveMonth(1)} disabled={period.year === now.getFullYear() && period.month >= now.getMonth() + 1}>›</button></div>} />
    {loading && <LoadingState label="Gathering your finances…" />}
    {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
    {!loading && summary && <>
      <div className="metric-grid">
        <Metric label="Total balance" value={money(summary.balancePaise)} note="Across all your activity" icon={CircleDollarSign} tone="green" />
        <Metric label="Income this month" value={money(summary.totalIncomePaise)} note={monthLabel(summary.period.year, summary.period.month)} icon={ArrowDownRight} tone="green" />
        <Metric label="Spending this month" value={money(summary.totalExpensesPaise)} note={`${summary.expenseByCategory.length} spending ${summary.expenseByCategory.length === 1 ? 'category' : 'categories'}`} icon={ArrowUpRight} tone="orange" />
        <Metric label="Budget remaining" value={money(summary.remainingBudgetPaise)} note={`${money(summary.budgetPaise)} planned this month`} icon={Wallet} tone={summary.remainingBudgetPaise < 0 ? 'orange' : 'green'} />
      </div>

      <div className="dashboard-charts">
        <Panel title="Income & spending" subtitle="Your last six months" action={<span className="chart-legend"><i className="legend-income" /> Income <i className="legend-expense" /> Spending</span>} className="trend-panel">
          {summary.monthlyTotals.some((item) => item.incomePaise || item.expensesPaise) ? <div className="chart-wrap trend-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={summary.monthlyTotals} margin={{ top: 10, right: 10, bottom: 0, left: 2 }}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#898d86', fontSize: 11 }} tickFormatter={(value: string) => monthLabel(Number(value.slice(0, 4)), Number(value.slice(5)), 'short').split(' ')[0]} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#898d86', fontSize: 11 }} tickFormatter={currencyTick} width={58} />
            <Tooltip formatter={(value) => money(Number(value))} labelFormatter={(value) => { const [year, month] = String(value).split('-').map(Number); return monthLabel(year, month); }} contentStyle={{ borderRadius: 12, borderColor: '#e8eae5', boxShadow: '0 8px 25px #1c27120d' }} />
            <Line type="monotone" dataKey="incomePaise" name="Income" stroke="#648c69" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="expensesPaise" name="Spending" stroke="#dca777" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart></ResponsiveContainer></div> : <div className="chart-empty"><Activity size={21} /><span>Your monthly trend will appear as you add activity.</span></div>}
        </Panel>

        <Panel title="Where it goes" subtitle={monthLabel(summary.period.year, summary.period.month)} className="category-panel">
          {summary.expenseByCategory.length ? <div className="category-chart-layout"><div className="chart-wrap donut-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={summary.expenseByCategory} dataKey="amountPaise" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={3} stroke="none">{summary.expenseByCategory.map((entry) => <Cell key={entry.categoryId} fill={entry.color} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 12, borderColor: '#e8eae5' }} /></PieChart></ResponsiveContainer></div><div className="category-legend">{summary.expenseByCategory.slice(0, 5).map((item) => <div className="category-legend-row" key={item.categoryId}><i style={{ background: item.color }} /><span>{item.name}</span><strong>{money(item.amountPaise, { compact: true })}</strong></div>)}</div></div> : <div className="chart-empty"><span>No expenses recorded for this month yet.</span></div>}
        </Panel>
      </div>

      <Panel title="Recent activity" subtitle="The latest changes in your accounts" action={<Link to="/transactions" className="text-link">All transactions <ChevronRight size={15} /></Link>} className="activity-panel">
        {summary.recentTransactions.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th className="align-right">AMOUNT</th></tr></thead><tbody>{summary.recentTransactions.map((transaction) => <tr key={transaction.id}><td><div className="transaction-name"><span className={`transaction-glyph ${transaction.type.toLowerCase()}`}>{transaction.type === 'INCOME' ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span><span>{transaction.title}</span></div></td><td><span className="category-chip"><i style={{ background: transaction.category.color }} />{transaction.category.name}</span></td><td className="muted-cell">{shortDate(transaction.date)}</td><td className={`align-right amount-cell ${transaction.type === 'INCOME' ? 'positive' : ''}`}>{transaction.type === 'INCOME' ? '+' : '−'}{money(transaction.amountPaise)}</td></tr>)}</tbody></table></div> : <div className="empty-inline">Your activity will show here once you add a transaction.</div>}
      </Panel>
      <div className="dashboard-footnote"><span className="status-dot" />Figures are calculated from your saved transactions and budgets.<Link to="/reports">View reports <ChevronRight size={14} /></Link></div>
    </>}
  </div>;
}
