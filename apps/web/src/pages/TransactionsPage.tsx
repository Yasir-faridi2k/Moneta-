import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowDownRight, ArrowUpRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { Category, Transaction } from '../types';
import { api } from '../services/api';
import { money, paiseToInput, rupeesToPaise, shortDate } from '../utils/format';
import { Button, EmptyState, ErrorState, Field, Form, FormActions, LoadingState, Modal, PageTitle, useToast } from '../components/ui';

function todayInput() { return new Date().toISOString().slice(0, 10); }

function TransactionForm({ transaction, categories, onClose, onSaved }: { transaction: Transaction | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(transaction?.title ?? '');
  const [amount, setAmount] = useState(transaction ? paiseToInput(transaction.amountPaise) : '');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(transaction?.type ?? 'EXPENSE');
  const [date, setDate] = useState(transaction?.date.slice(0, 10) ?? todayInput());
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? categories[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const notify = useToast();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountPaise = rupeesToPaise(amount);
    if (amountPaise === null) { setProblem('Enter an amount greater than zero with up to two decimal places.'); return; }
    if (!categoryId) { setProblem('Create a category before adding a transaction.'); return; }
    setBusy(true); setProblem('');
    try {
      const value = { title: title.trim(), amountPaise, type, date: `${date}T12:00:00.000Z`, categoryId };
      if (transaction) await api.updateTransaction(transaction.id, value);
      else await api.createTransaction(value);
      notify(transaction ? 'Transaction updated.' : 'Transaction added.');
      onSaved();
    } catch (cause) { setProblem(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }

  return <Modal title={transaction ? 'Edit transaction' : 'New transaction'} description="Keep the details clear and easy to find." onClose={onClose}>
    <Form onSubmit={submit}>
      <div className="segmented-control"><button type="button" className={type === 'EXPENSE' ? 'selected expense' : ''} onClick={() => setType('EXPENSE')}><ArrowUpRight size={16} /> Expense</button><button type="button" className={type === 'INCOME' ? 'selected income' : ''} onClick={() => setType('INCOME')}><ArrowDownRight size={16} /> Income</button></div>
      <Field label="Title"><input autoFocus required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Weekly groceries" /></Field>
      <div className="form-row"><Field label="Amount"><div className="input-prefix"><span>₹</span><input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div></Field><Field label="Date"><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field></div>
      <Field label="Category"><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
      {problem && <div className="form-error">{problem}</div>}
      <FormActions onCancel={onClose} busy={busy} submitLabel={transaction ? 'Save changes' : 'Add transaction'} />
    </Form>
  </Modal>;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const notify = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [items, categoryItems] = await Promise.all([
        api.transactions({ q: query || undefined, type: type || undefined, categoryId: categoryId || undefined }),
        api.categories(),
      ]);
      setTransactions(items); setCategories(categoryItems);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setLoading(false); }
  }, [query, type, categoryId]);
  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => transactions.reduce((result, item) => {
    result.count += 1;
    if (item.type === 'INCOME') result.income += item.amountPaise;
    else result.expenses += item.amountPaise;
    return result;
  }, { count: 0, income: 0, expenses: 0 }), [transactions]);

  async function remove(transaction: Transaction) {
    if (!window.confirm(`Delete “${transaction.title}”? This action cannot be undone.`)) return;
    try { await api.deleteTransaction(transaction.id); notify('Transaction deleted.'); await load(); }
    catch (cause) { notify(cause instanceof Error ? cause.message : 'Could not delete transaction.', 'error'); }
  }

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (transaction: Transaction) => { setEditing(transaction); setShowForm(true); };

  return <div className="page">
    <PageTitle eyebrow="YOUR ACTIVITY" title="Transactions" description="Every inflow and outflow, in one place." action={<Button onClick={openCreate}><Plus size={17} /> Add transaction</Button>} />
    <div className="inline-stat-row"><span><strong>{totals.count}</strong> {totals.count === 1 ? 'transaction' : 'transactions'}</span><span className="inline-stat-positive">Income {money(totals.income)}</span><span className="inline-stat-negative">Spending {money(totals.expenses)}</span></div>
    <section className="filter-bar">
      <label className="search-field"><Search size={17} /><input aria-label="Search transactions" placeholder="Search transactions" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <select aria-label="Filter by type" value={type} onChange={(event) => setType(event.target.value)}><option value="">All activity</option><option value="INCOME">Income</option><option value="EXPENSE">Expenses</option></select>
      <select aria-label="Filter by category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
    </section>
    {loading && <LoadingState label="Loading transactions…" />}
    {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
    {!loading && !error && <section className="panel transactions-panel">
      {transactions.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th className="align-right">AMOUNT</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id}><td><div className="transaction-name"><span className={`transaction-glyph ${transaction.type.toLowerCase()}`}>{transaction.type === 'INCOME' ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span><span>{transaction.title}</span></div></td><td><span className="category-chip"><i style={{ background: transaction.category.color }} />{transaction.category.name}</span></td><td className="muted-cell">{shortDate(transaction.date)}</td><td className={`align-right amount-cell ${transaction.type === 'INCOME' ? 'positive' : ''}`}>{transaction.type === 'INCOME' ? '+' : '−'}{money(transaction.amountPaise)}</td><td><div className="row-actions"><button aria-label={`Edit ${transaction.title}`} className="icon-button small" onClick={() => openEdit(transaction)}><Pencil size={15} /></button><button aria-label={`Delete ${transaction.title}`} className="icon-button small danger-text" onClick={() => void remove(transaction)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No transactions found" description={query || type || categoryId ? 'Try adjusting your filters, or add a new transaction.' : 'Your money story starts with your first transaction.'} action={<Button onClick={openCreate}><Plus size={16} /> Add transaction</Button>} />}
    </section>}
    {showForm && <TransactionForm transaction={editing} categories={categories} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); void load(); }} />}
  </div>;
}
