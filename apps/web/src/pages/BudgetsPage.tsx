import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Budget, Category } from '../types';
import { api } from '../services/api';
import { money, monthLabel, paiseToInput, rupeesToPaise } from '../utils/format';
import { Button, EmptyState, ErrorState, Field, Form, FormActions, LoadingState, Modal, PageTitle, useToast } from '../components/ui';

function BudgetForm({ budget, categories, period, onClose, onSaved }: { budget: Budget | null; categories: Category[]; period: { year: number; month: number }; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(budget ? paiseToInput(budget.amountPaise) : '');
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? categories[0]?.id ?? '');
  const [monthValue, setMonthValue] = useState(`${budget?.year ?? period.year}-${String(budget?.month ?? period.month).padStart(2, '0')}`);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const notify = useToast();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountPaise = rupeesToPaise(amount);
    if (amountPaise === null) { setProblem('Enter an amount greater than zero with up to two decimal places.'); return; }
    const [year, month] = monthValue.split('-').map(Number);
    setBusy(true); setProblem('');
    try {
      const value = { amountPaise, year, month, categoryId };
      if (budget) await api.updateBudget(budget.id, value);
      else await api.createBudget(value);
      notify(budget ? 'Budget updated.' : 'Budget created.'); onSaved();
    } catch (cause) { setProblem(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }

  return <Modal title={budget ? 'Edit budget' : 'Create a budget'} description="Set a monthly spending guide for a category." onClose={onClose}>
    <Form onSubmit={submit}>
      <Field label="Category"><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
      <Field label="Monthly limit"><div className="input-prefix"><span>₹</span><input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div></Field>
      <Field label="Budget month"><input required type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} /></Field>
      {problem && <div className="form-error">{problem}</div>}
      <FormActions onCancel={onClose} busy={busy} submitLabel={budget ? 'Save changes' : 'Create budget'} />
    </Form>
  </Modal>;
}

export default function BudgetsPage() {
  const today = new Date();
  const [period, setPeriod] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Budget | null>(null);
  const [showForm, setShowForm] = useState(false);
  const notify = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [items, categoryItems] = await Promise.all([api.budgets(period), api.categories()]);
      setBudgets(items); setCategories(categoryItems);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setLoading(false); }
  }, [period]);
  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => budgets.reduce((result, item) => ({
    planned: result.planned + item.amountPaise,
    spent: result.spent + item.spentPaise,
  }), { planned: 0, spent: 0 }), [budgets]);
  const moveMonth = (direction: number) => setPeriod((current) => {
    const date = new Date(Date.UTC(current.year, current.month - 1 + direction, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  });

  async function remove(budget: Budget) {
    if (!window.confirm(`Delete the ${budget.category.name} budget for ${monthLabel(budget.year, budget.month)}?`)) return;
    try { await api.deleteBudget(budget.id); notify('Budget deleted.'); await load(); }
    catch (cause) { notify(cause instanceof Error ? cause.message : 'Could not delete budget.', 'error'); }
  }

  return <div className="page">
    <PageTitle eyebrow="PLAN WITH INTENTION" title="Budgets" description="A little structure for the things that matter." action={<Button onClick={() => { setEditing(null); setShowForm(true); }} disabled={!categories.length}><Plus size={17} /> New budget</Button>} />
    <div className="budget-summary panel"><div><span className="summary-overline">PLANNED THIS MONTH</span><strong>{money(totals.planned)}</strong><small>Across {budgets.length} {budgets.length === 1 ? 'category' : 'categories'}</small></div><div className="budget-summary-divider" /><div><span className="summary-overline">SPENT SO FAR</span><strong>{money(totals.spent)}</strong><small>{totals.planned > 0 ? `${Math.round((totals.spent / totals.planned) * 100)}% of your planned total` : 'No budgets set yet'}</small></div><div className="budget-summary-period"><button aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button><span>{monthLabel(period.year, period.month)}</span><button aria-label="Next month" onClick={() => moveMonth(1)} disabled={period.year === today.getFullYear() && period.month >= today.getMonth() + 1}>›</button></div></div>
    {loading && <LoadingState label="Loading budgets…" />}
    {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
    {!loading && !error && <div className="budget-grid">{budgets.length ? budgets.map((budget) => {
      const progress = Math.min(100, Math.max(0, budget.percentUsed));
      return <article className="budget-card panel" key={budget.id}>
        <div className="budget-card-top"><div className="budget-category-icon" style={{ backgroundColor: `${budget.category.color}20`, color: budget.category.color }}><span style={{ background: budget.category.color }} /></div><div className="row-actions"><button className="icon-button small" aria-label={`Edit ${budget.category.name} budget`} onClick={() => { setEditing(budget); setShowForm(true); }}><Pencil size={15} /></button><button className="icon-button small danger-text" aria-label={`Delete ${budget.category.name} budget`} onClick={() => void remove(budget)}><Trash2 size={15} /></button></div></div>
        <div className="budget-card-title"><h2>{budget.category.name}</h2><span>{monthLabel(budget.year, budget.month, 'short')}</span></div>
        <div className="budget-amounts"><strong>{money(budget.spentPaise)}</strong><span>of {money(budget.amountPaise)}</span></div>
        <div className={`progress-track ${budget.warning ?? ''}`}><span style={{ width: `${progress}%` }} /></div>
        <div className="budget-card-foot"><span className={budget.warning ? 'warning-text' : ''}>{budget.warning && <AlertTriangle size={14} />}{budget.warning === 'exceeded' ? 'Budget exceeded' : budget.warning === 'near-limit' ? 'Approaching limit' : `${money(Math.max(0, budget.remainingPaise))} remaining`}</span><strong>{budget.percentUsed}%</strong></div>
      </article>;
    }) : <div className="panel budget-empty"><EmptyState title="No budgets for this month" description="Choose a category and set a comfortable monthly limit." action={categories.length ? <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} /> Create your first budget</Button> : <span className="muted-cell">Add a category before creating a budget.</span>} /></div>}</div>}
    {showForm && <BudgetForm budget={editing} categories={categories} period={period} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); void load(); }} />}
  </div>;
}
